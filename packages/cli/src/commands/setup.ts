import { select } from "@inquirer/prompts";
import { Command } from "commander";
import { dirname, join } from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import ora from "ora";
import pc from "picocolors";

import {
  ALL_AGENT_NAMES,
  SETUP_AGENT_NAMES,
  detectAgents,
  getAgent,
  type AuthOptions,
  type SetupAgent,
} from "../setup/agents.js";
import {
  appendTomlServer,
  mergeServerEntry,
  readJsonConfig,
  resolveMcpPath,
  writeJsonConfig,
} from "../setup/mcp-writer.js";
import { getRuleContent, getSkillContent, type RuleMode } from "../setup/templates.js";
import { installSkillFiles } from "../utils/installer.js";
import { log } from "../utils/logger.js";
import { checkboxWithHover } from "../utils/prompts.js";
import { trackEvent } from "../utils/tracking.js";

type Scope = "global" | "project";
type SetupMode = RuleMode;

interface SetupOptions {
  cli?: boolean;
  mcp?: boolean;
  claude?: boolean;
  cursor?: boolean;
  antigravity?: boolean;
  opencode?: boolean;
  codex?: boolean;
  gemini?: boolean;
  project?: boolean;
  yes?: boolean;
  apiKey?: string;
}

const CHECKBOX_THEME = {
  style: {
    highlight: (text: string) => pc.green(text),
    disabledChoice: (text: string) => ` ${pc.dim("-")} ${pc.dim(text)}`,
  },
};

const SKILL_NAMES: Record<SetupMode, string> = {
  cli: "genrtl-cli",
  mcp: "genrtl-mcp",
};

function getSelectedAgents(options: SetupOptions): SetupAgent[] {
  const agents: SetupAgent[] = [];
  if (options.claude) agents.push("claude");
  if (options.cursor) agents.push("cursor");
  if (options.opencode) agents.push("opencode");
  if (options.codex) agents.push("codex");
  if (options.antigravity) agents.push("antigravity");
  if (options.gemini) agents.push("gemini");
  return agents;
}

export function resolveSetupAuth(options: Pick<SetupOptions, "apiKey">): AuthOptions | undefined {
  if (options.apiKey) return { mode: "api-key", apiKey: options.apiKey };
  if (process.env.GRTL_API_KEY) {
    return {
      mode: "api-key",
      apiKey: process.env.GRTL_API_KEY,
      apiKeyEnvVar: "GRTL_API_KEY",
    };
  }
  if (process.env.GENRTL_API_KEY) {
    return {
      mode: "api-key",
      apiKey: process.env.GENRTL_API_KEY,
      apiKeyEnvVar: "GENRTL_API_KEY",
    };
  }
  return undefined;
}

export function registerSetupCommand(program: Command): void {
  program
    .command("setup")
    .description("Install GenRTL CLI or MCP integration for a coding agent")
    .option("--cli", "Install a Skill that calls the grtl CLI")
    .option("--mcp", "Configure GenRTL MCP and install its Skill")
    .option("--claude", "Set up Claude Code")
    .option("--cursor", "Set up Cursor")
    .option("--antigravity", "Set up Antigravity")
    .option("--opencode", "Set up OpenCode")
    .option("--codex", "Set up Codex")
    .option("--gemini", "Set up Gemini CLI")
    .option("-p, --project", "Configure the current project instead of the user profile")
    .option("-y, --yes", "Use MCP mode and all detected agents without prompting")
    .option("--api-key <key>", "GenRTL API key for MCP mode")
    .action(async (options: SetupOptions) => {
      await setupCommand(options);
    });
}

async function resolveMode(options: SetupOptions): Promise<SetupMode | null> {
  if (options.cli && options.mcp) {
    log.error("Choose either --cli or --mcp, not both.");
    process.exitCode = 1;
    return null;
  }
  if (options.cli) return "cli";
  if (options.mcp || options.yes) return "mcp";

  try {
    return await select<SetupMode>({
      message: "How should your coding agent access GenRTL?",
      choices: [
        {
          name: "CLI Skill",
          value: "cli",
          description: "The agent runs the installed grtl command.",
        },
        {
          name: "MCP Server + Skill",
          value: "mcp",
          description: "The agent calls the four hosted GenRTL MCP tools.",
        },
      ],
    });
  } catch {
    log.warn("Setup cancelled");
    return null;
  }
}

async function promptAgents(): Promise<SetupAgent[] | null> {
  try {
    return await checkboxWithHover(
      {
        message: "Which agents do you want to set up?",
        choices: ALL_AGENT_NAMES.map((name) => ({
          name: SETUP_AGENT_NAMES[name],
          value: name,
        })),
        loop: false,
        theme: CHECKBOX_THEME,
      },
      { getName: (agent: SetupAgent) => SETUP_AGENT_NAMES[agent] }
    );
  } catch {
    return null;
  }
}

async function resolveAgents(options: SetupOptions, scope: Scope): Promise<SetupAgent[]> {
  const explicit = getSelectedAgents(options);
  if (explicit.length > 0) return explicit;

  const detected = await detectAgents(scope);
  if (detected.length > 0 && options.yes) return detected;

  if (options.yes) {
    log.error("No supported coding agents were detected. Pass an agent flag such as --codex.");
    return [];
  }

  log.blank();
  const selected = await promptAgents();
  if (!selected) log.warn("Setup cancelled");
  return selected ?? [];
}

async function installRule(
  agentName: SetupAgent,
  scope: Scope,
  mode: SetupMode
): Promise<{ status: string; path: string }> {
  const rule = getAgent(agentName).rule;
  const content = await getRuleContent(mode, agentName);

  if (rule.kind === "file") {
    const ruleDir =
      scope === "global" ? rule.dir("global") : join(process.cwd(), rule.dir("project"));
    const rulePath = join(ruleDir, rule.filename);
    await mkdir(dirname(rulePath), { recursive: true });
    await writeFile(rulePath, content, "utf-8");
    return { status: "installed", path: rulePath };
  }

  const filePath =
    scope === "global" ? rule.file("global") : join(process.cwd(), rule.file("project"));
  const escapedMarker = rule.sectionMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const section = `${rule.sectionMarker}\n${content.trimEnd()}\n${rule.sectionMarker}`;

  let existing = "";
  try {
    existing = await readFile(filePath, "utf-8");
  } catch {
    // The rule file is created below.
  }

  if (existing.includes(rule.sectionMarker)) {
    const regex = new RegExp(`${escapedMarker}\\n[\\s\\S]*?${escapedMarker}`);
    await writeFile(filePath, existing.replace(regex, section), "utf-8");
    return { status: "updated", path: filePath };
  }

  const separator =
    existing.length > 0 && !existing.endsWith("\n") ? "\n\n" : existing.length > 0 ? "\n" : "";
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${existing}${separator}${section}\n`, "utf-8");
  return { status: "installed", path: filePath };
}

async function installSkill(
  agentName: SetupAgent,
  scope: Scope,
  mode: SetupMode
): Promise<{ status: string; path: string }> {
  const agent = getAgent(agentName);
  const skillName = SKILL_NAMES[mode];
  const skillsRoot =
    scope === "global"
      ? agent.skill.dir("global")
      : join(process.cwd(), agent.skill.dir("project"));
  const skillPath = join(skillsRoot, skillName);

  await installSkillFiles(
    skillName,
    [{ path: "SKILL.md", content: getSkillContent(mode) }],
    skillsRoot
  );
  return { status: "installed", path: skillPath };
}

async function configureMcp(
  agentName: SetupAgent,
  auth: AuthOptions,
  scope: Scope
): Promise<{ status: string; path: string }> {
  const agent = getAgent(agentName);
  const candidates =
    scope === "global" || agent.mcp.projectPaths.length === 0
      ? agent.mcp.globalPaths
      : agent.mcp.projectPaths.map((path) => join(process.cwd(), path));
  const mcpPath = await resolveMcpPath(candidates);
  const entry = agent.mcp.buildEntry(auth, "http");

  if (mcpPath.endsWith(".toml")) {
    const { alreadyExists } = await appendTomlServer(mcpPath, "genrtl", entry);
    return { status: alreadyExists ? "reconfigured" : "configured", path: mcpPath };
  }

  const existing = await readJsonConfig(mcpPath);
  const { config, alreadyExists } = mergeServerEntry(
    existing,
    agent.mcp.configKey,
    "genrtl",
    entry
  );
  await writeJsonConfig(mcpPath, config);
  return { status: alreadyExists ? "reconfigured" : "configured", path: mcpPath };
}

async function setupAgent(
  agentName: SetupAgent,
  mode: SetupMode,
  auth: AuthOptions | undefined,
  scope: Scope
): Promise<{
  agent: string;
  mcpStatus?: string;
  mcpPath?: string;
  ruleStatus: string;
  rulePath: string;
  skillStatus: string;
  skillPath: string;
}> {
  const agent = getAgent(agentName);
  let mcpStatus: string | undefined;
  let mcpPath: string | undefined;

  if (mode === "mcp" && auth) {
    try {
      const result = await configureMcp(agentName, auth, scope);
      mcpStatus = result.status;
      mcpPath = result.path;
    } catch (error) {
      mcpStatus = `failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  let ruleStatus: string;
  let rulePath = "";
  try {
    const result = await installRule(agentName, scope, mode);
    ruleStatus = result.status;
    rulePath = result.path;
  } catch (error) {
    ruleStatus = `failed: ${error instanceof Error ? error.message : String(error)}`;
  }

  let skillStatus: string;
  let skillPath = "";
  try {
    const result = await installSkill(agentName, scope, mode);
    skillStatus = result.status;
    skillPath = result.path;
  } catch (error) {
    skillStatus = `failed: ${error instanceof Error ? error.message : String(error)}`;
  }

  return {
    agent: agent.displayName,
    mcpStatus,
    mcpPath,
    ruleStatus,
    rulePath,
    skillStatus,
    skillPath,
  };
}

async function setupCommand(options: SetupOptions): Promise<void> {
  trackEvent("command", { name: "setup" });

  const mode = await resolveMode(options);
  if (!mode) return;

  const auth = resolveSetupAuth(options);
  if (mode === "mcp" && !auth) {
    log.error("MCP mode requires GRTL_API_KEY, GENRTL_API_KEY, or --api-key.");
    process.exitCode = 1;
    return;
  }

  const scope: Scope = options.project ? "project" : "global";
  const agents = await resolveAgents(options, scope);
  if (agents.length === 0) return;

  const spinner = ora(`Installing GenRTL ${mode.toUpperCase()} integration...`).start();
  const results = [];

  for (const agentName of agents) {
    spinner.text = `Configuring ${getAgent(agentName).displayName}...`;
    results.push(await setupAgent(agentName, mode, auth, scope));
  }

  const failed = results.some(
    (result) =>
      result.mcpStatus?.startsWith("failed") ||
      result.ruleStatus.startsWith("failed") ||
      result.skillStatus.startsWith("failed")
  );
  if (failed) {
    spinner.warn("GenRTL setup completed with errors");
    process.exitCode = 1;
  } else {
    spinner.succeed("GenRTL setup complete");
  }

  log.blank();
  for (const result of results) {
    log.plain(`  ${pc.bold(result.agent)}`);
    if (result.mcpStatus && result.mcpPath) {
      log.plain(`    ${pc.green("+")} MCP server ${result.mcpStatus}`);
      log.plain(`      ${pc.dim(result.mcpPath)}`);
    }
    log.plain(`    ${pc.green("+")} Skill ${result.skillStatus}`);
    log.plain(`      ${pc.dim(result.skillPath)}`);
    log.plain(`    ${pc.green("+")} Rule ${result.ruleStatus}`);
    log.plain(`      ${pc.dim(result.rulePath)}`);
  }
  log.blank();

  if (mode === "cli" && !process.env.GRTL_API_KEY && !process.env.GENRTL_API_KEY) {
    log.warn("Set GRTL_API_KEY or GENRTL_API_KEY in the coding agent's environment before use.");
  }

  trackEvent("setup", { agents, scope, mode, authMode: auth?.mode ?? "environment" });
}
