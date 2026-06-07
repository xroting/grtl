import { Command } from "commander";
import pc from "picocolors";
import ora from "ora";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";

import { log } from "../utils/logger.js";
import { checkboxWithHover } from "../utils/prompts.js";
import { trackEvent } from "../utils/tracking.js";
import {
  type SetupAgent,
  type HttpAuthOptions,
  SETUP_AGENT_NAMES,
  ALL_AGENT_NAMES,
  getAgent,
  detectAgents,
} from "../setup/http-agents.js";
import { getRuleContent } from "../setup/templates.js";
import {
  readJsonConfig,
  mergeServerEntry,
  writeJsonConfig,
  resolveMcpPath,
  appendTomlServer,
} from "../setup/mcp-writer.js";

type Scope = "global" | "project";

interface SetupOptions {
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

export function resolveSetupAuth(
  options: Pick<SetupOptions, "apiKey">
): HttpAuthOptions | undefined {
  if (options.apiKey) return { apiKey: options.apiKey };
  if (process.env.GRTL_API_KEY) {
    return { apiKey: process.env.GRTL_API_KEY, apiKeyEnvVar: "GRTL_API_KEY" };
  }
  if (process.env.GENRTL_API_KEY) {
    return { apiKey: process.env.GENRTL_API_KEY, apiKeyEnvVar: "GENRTL_API_KEY" };
  }
  return undefined;
}

export function registerSetupCommand(program: Command): void {
  program
    .command("setup")
    .description("Configure the hosted GenRTL HTTP MCP server for a coding agent")
    .option("--claude", "Set up Claude Code")
    .option("--cursor", "Set up Cursor")
    .option("--antigravity", "Set up Antigravity")
    .option("--opencode", "Set up OpenCode")
    .option("--codex", "Set up Codex")
    .option("--gemini", "Set up Gemini CLI")
    .option("-p, --project", "Configure the current project instead of the user profile")
    .option("-y, --yes", "Use all detected agents without prompting")
    .option("--api-key <key>", "GenRTL API key (prefer the GRTL_API_KEY environment variable)")
    .action(async (options: SetupOptions) => {
      await setupCommand(options);
    });
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
    log.error("No supported coding agents were detected. Pass an agent flag such as --cursor.");
    return [];
  }

  log.blank();
  const selected = await promptAgents();
  if (!selected) log.warn("Setup cancelled");
  return selected ?? [];
}

async function installRule(
  agentName: SetupAgent,
  scope: Scope
): Promise<{ status: string; path: string }> {
  const rule = getAgent(agentName).rule;
  const content = await getRuleContent("mcp", agentName);

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

async function setupAgent(
  agentName: SetupAgent,
  auth: HttpAuthOptions,
  scope: Scope
): Promise<{
  agent: string;
  mcpStatus: string;
  mcpPath: string;
  ruleStatus: string;
  rulePath: string;
}> {
  const agent = getAgent(agentName);
  const candidates =
    scope === "global" || agent.mcp.projectPaths.length === 0
      ? agent.mcp.globalPaths
      : agent.mcp.projectPaths.map((path) => join(process.cwd(), path));
  const mcpPath = await resolveMcpPath(candidates);
  const entry = agent.mcp.buildEntry(auth);

  let mcpStatus: string;
  try {
    if (mcpPath.endsWith(".toml")) {
      const { alreadyExists } = await appendTomlServer(mcpPath, "genrtl", entry);
      mcpStatus = alreadyExists ? "reconfigured" : "configured";
    } else {
      const existing = await readJsonConfig(mcpPath);
      const { config, alreadyExists } = mergeServerEntry(
        existing,
        agent.mcp.configKey,
        "genrtl",
        entry
      );
      await writeJsonConfig(mcpPath, config);
      mcpStatus = alreadyExists ? "reconfigured" : "configured";
    }
  } catch (error) {
    mcpStatus = `failed: ${error instanceof Error ? error.message : String(error)}`;
  }

  let ruleStatus: string;
  let rulePath = "";
  try {
    const result = await installRule(agentName, scope);
    ruleStatus = result.status;
    rulePath = result.path;
  } catch (error) {
    ruleStatus = `failed: ${error instanceof Error ? error.message : String(error)}`;
  }

  return { agent: agent.displayName, mcpStatus, mcpPath, ruleStatus, rulePath };
}

async function setupCommand(options: SetupOptions): Promise<void> {
  trackEvent("command", { name: "setup" });

  const auth = resolveSetupAuth(options);
  if (!auth) {
    log.error("Set GRTL_API_KEY or pass --api-key before running setup.");
    process.exitCode = 1;
    return;
  }

  const scope: Scope = options.project ? "project" : "global";
  const agents = await resolveAgents(options, scope);
  if (agents.length === 0) return;

  const spinner = ora("Configuring GenRTL MCP...").start();
  const results = [];

  for (const agentName of agents) {
    spinner.text = `Configuring ${getAgent(agentName).displayName}...`;
    results.push(await setupAgent(agentName, auth, scope));
  }

  const failed = results.some(
    (result) => result.mcpStatus.startsWith("failed") || result.ruleStatus.startsWith("failed")
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
    log.plain(`    ${pc.green("+")} MCP server ${result.mcpStatus}`);
    log.plain(`      ${pc.dim(result.mcpPath)}`);
    log.plain(`    ${pc.green("+")} Rule ${result.ruleStatus}`);
    log.plain(`      ${pc.dim(result.rulePath)}`);
  }
  log.blank();

  trackEvent("setup", { agents, scope, authMode: "api-key" });
}
