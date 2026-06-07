import { access } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export type SetupAgent = "claude" | "cursor" | "opencode" | "codex" | "antigravity" | "gemini";

export interface HttpAuthOptions {
  apiKey: string;
  apiKeyEnvVar?: "GRTL_API_KEY" | "GENRTL_API_KEY";
}

export const SETUP_AGENT_NAMES: Record<SetupAgent, string> = {
  claude: "Claude Code",
  cursor: "Cursor",
  opencode: "OpenCode",
  codex: "Codex",
  antigravity: "Antigravity",
  gemini: "Gemini CLI",
};

export type RuleType =
  | {
      kind: "file";
      dir: (scope: "project" | "global") => string;
      filename: string;
    }
  | { kind: "append"; file: (scope: "project" | "global") => string; sectionMarker: string };

export interface HttpAgentConfig {
  name: SetupAgent;
  displayName: string;
  mcp: {
    projectPaths: string[];
    globalPaths: string[];
    configKey: string;
    buildEntry: (auth: HttpAuthOptions) => Record<string, unknown>;
  };
  rule: RuleType;
  detect: {
    projectPaths: string[];
    globalPaths: string[];
  };
}

let mcpBaseUrl = "https://www.genrtl.com/api/mcp";

export function setMcpBaseUrl(url: string): void {
  const normalized = url.replace(/\/+$/, "");
  mcpBaseUrl = normalized.endsWith("/api/mcp") ? normalized : `${normalized}/api/mcp`;
}

function headers(auth: HttpAuthOptions): { Authorization: string } {
  return { Authorization: `Bearer ${auth.apiKey}` };
}

function claudeConfigDir(): string {
  return process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
}

function claudeGlobalMcpPath(): string {
  return process.env.CLAUDE_CONFIG_DIR
    ? join(claudeConfigDir(), ".claude.json")
    : join(homedir(), ".claude.json");
}

const agents: Record<SetupAgent, HttpAgentConfig> = {
  claude: {
    name: "claude",
    displayName: "Claude Code",
    mcp: {
      projectPaths: [".mcp.json"],
      get globalPaths() {
        return [claudeGlobalMcpPath()];
      },
      configKey: "mcpServers",
      buildEntry: (auth) => ({
        type: "http",
        url: mcpBaseUrl,
        headers: headers(auth),
      }),
    },
    rule: {
      kind: "file",
      dir: (scope) =>
        scope === "global" ? join(claudeConfigDir(), "rules") : join(".claude", "rules"),
      filename: "genrtl.md",
    },
    detect: {
      projectPaths: [".mcp.json", ".claude"],
      get globalPaths() {
        return [claudeConfigDir()];
      },
    },
  },
  cursor: {
    name: "cursor",
    displayName: "Cursor",
    mcp: {
      projectPaths: [join(".cursor", "mcp.json")],
      globalPaths: [join(homedir(), ".cursor", "mcp.json")],
      configKey: "mcpServers",
      buildEntry: (auth) => ({ url: mcpBaseUrl, headers: headers(auth) }),
    },
    rule: {
      kind: "file",
      dir: (scope) =>
        scope === "global" ? join(homedir(), ".cursor", "rules") : join(".cursor", "rules"),
      filename: "genrtl.mdc",
    },
    detect: {
      projectPaths: [".cursor"],
      globalPaths: [join(homedir(), ".cursor")],
    },
  },
  opencode: {
    name: "opencode",
    displayName: "OpenCode",
    mcp: {
      projectPaths: ["opencode.json", "opencode.jsonc", ".opencode.json", ".opencode.jsonc"],
      globalPaths: [
        join(homedir(), ".config", "opencode", "opencode.json"),
        join(homedir(), ".config", "opencode", "opencode.jsonc"),
        join(homedir(), ".config", "opencode", ".opencode.json"),
        join(homedir(), ".config", "opencode", ".opencode.jsonc"),
      ],
      configKey: "mcp",
      buildEntry: (auth) => ({
        type: "remote",
        url: mcpBaseUrl,
        enabled: true,
        headers: headers(auth),
      }),
    },
    rule: {
      kind: "append",
      file: (scope) =>
        scope === "global" ? join(homedir(), ".config", "opencode", "AGENTS.md") : "AGENTS.md",
      sectionMarker: "<!-- genrtl -->",
    },
    detect: {
      projectPaths: ["opencode.json", "opencode.jsonc", ".opencode.json", ".opencode.jsonc"],
      globalPaths: [join(homedir(), ".config", "opencode")],
    },
  },
  codex: {
    name: "codex",
    displayName: "Codex",
    mcp: {
      projectPaths: [join(".codex", "config.toml")],
      globalPaths: [join(homedir(), ".codex", "config.toml")],
      configKey: "mcp_servers",
      buildEntry: (auth) =>
        auth.apiKeyEnvVar
          ? {
              type: "http",
              url: mcpBaseUrl,
              bearer_token_env_var: auth.apiKeyEnvVar,
            }
          : {
              type: "http",
              url: mcpBaseUrl,
              headers: headers(auth),
            },
    },
    rule: {
      kind: "append",
      file: (scope) => (scope === "global" ? join(homedir(), ".codex", "AGENTS.md") : "AGENTS.md"),
      sectionMarker: "<!-- genrtl -->",
    },
    detect: {
      projectPaths: [".codex"],
      globalPaths: [join(homedir(), ".codex")],
    },
  },
  antigravity: {
    name: "antigravity",
    displayName: "Antigravity",
    mcp: {
      projectPaths: [],
      globalPaths: [join(homedir(), ".gemini", "antigravity", "mcp_config.json")],
      configKey: "mcpServers",
      buildEntry: (auth) => ({ serverUrl: mcpBaseUrl, headers: headers(auth) }),
    },
    rule: {
      kind: "append",
      file: (scope) => (scope === "global" ? join(homedir(), ".gemini", "GEMINI.md") : "GEMINI.md"),
      sectionMarker: "<!-- genrtl -->",
    },
    detect: {
      projectPaths: [".agent"],
      globalPaths: [join(homedir(), ".gemini", "antigravity"), join(homedir(), ".agent")],
    },
  },
  gemini: {
    name: "gemini",
    displayName: "Gemini CLI",
    mcp: {
      projectPaths: [join(".gemini", "settings.json")],
      globalPaths: [join(homedir(), ".gemini", "settings.json")],
      configKey: "mcpServers",
      buildEntry: (auth) => ({ httpUrl: mcpBaseUrl, headers: headers(auth) }),
    },
    rule: {
      kind: "append",
      file: (scope) => (scope === "global" ? join(homedir(), ".gemini", "GEMINI.md") : "GEMINI.md"),
      sectionMarker: "<!-- genrtl -->",
    },
    detect: {
      projectPaths: [".gemini"],
      globalPaths: [join(homedir(), ".gemini")],
    },
  },
};

export function getAgent(name: SetupAgent): HttpAgentConfig {
  return agents[name];
}

export const ALL_AGENT_NAMES = Object.keys(agents) as SetupAgent[];

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function detectAgents(scope: "project" | "global"): Promise<SetupAgent[]> {
  const detected: SetupAgent[] = [];
  for (const agent of Object.values(agents)) {
    const paths = scope === "global" ? agent.detect.globalPaths : agent.detect.projectPaths;
    for (const path of paths) {
      const fullPath = scope === "global" ? path : join(process.cwd(), path);
      if (await pathExists(fullPath)) {
        detected.push(agent.name);
        break;
      }
    }
  }
  return detected;
}
