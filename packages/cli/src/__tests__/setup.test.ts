import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdir, readFile, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const MOCK_MCP_RULE = "Use GenRTL MCP to fetch docs.\n";
const MOCK_CLI_RULE = "Use the `grtl` CLI to fetch docs.\n";

vi.stubGlobal(
  "fetch",
  vi.fn((url: string) => {
    if (url.includes("genrtl-mcp.md")) {
      return Promise.resolve({ ok: true, text: () => Promise.resolve(MOCK_MCP_RULE) });
    }
    if (url.includes("genrtl-cli.md")) {
      return Promise.resolve({ ok: true, text: () => Promise.resolve(MOCK_CLI_RULE) });
    }
    return Promise.resolve({ ok: false });
  })
);

import { getRuleContent, getSkillContent } from "../setup/templates.js";
import {
  mergeServerEntry,
  removeServerEntry,
  readJsonConfig,
  writeJsonConfig,
  readTomlServerExists,
  readTomlServerEntry,
  buildTomlServerBlock,
  appendTomlServer,
  removeTomlServer,
  resolveMcpPath,
  isStdioGenRTLEntry,
  patchStdioApiKey,
} from "../setup/mcp-writer.js";
import { getAgent, ALL_AGENT_NAMES, type AuthOptions } from "../setup/agents.js";

describe("getRuleContent", () => {
  test("returns correct content per mode", async () => {
    expect(await getRuleContent("mcp", "claude")).toBe(MOCK_MCP_RULE);
    expect(await getRuleContent("cli", "claude")).toBe(MOCK_CLI_RULE);
  });

  test("only cursor gets alwaysApply frontmatter", async () => {
    const cursor = await getRuleContent("mcp", "cursor");
    expect(cursor).toContain("---\nalwaysApply: true\n---");
    expect(cursor).toContain(MOCK_MCP_RULE);

    for (const agent of ["claude", "antigravity", "codex", "opencode", "gemini"]) {
      const content = await getRuleContent("mcp", agent);
      expect(content).not.toContain("alwaysApply");
    }
  });

  test("returns fallback content when all fetch URLs fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false }))
    );
    const content = await getRuleContent("mcp", "claude");
    expect(content).toContain("GenRTL MCP");
    expect(content.length).toBeGreaterThan(100);

    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("genrtl-mcp.md"))
          return Promise.resolve({ ok: true, text: () => Promise.resolve(MOCK_MCP_RULE) });
        if (url.includes("genrtl-cli.md"))
          return Promise.resolve({ ok: true, text: () => Promise.resolve(MOCK_CLI_RULE) });
        return Promise.resolve({ ok: false });
      })
    );
  });
});

describe("getSkillContent", () => {
  test("builds a CLI skill for knowledge search and CBB installation", () => {
    const content = getSkillContent("cli");
    expect(content).toContain("name: genrtl-cli");
    expect(content).toContain("grtl knowledge-search");
    expect(content).toContain("grtl spec2rtl-search");
    expect(content).toContain("grtl spec2plan-search");
    expect(content).toContain("grtl verification-search");
    expect(content).toContain("grtl debug-search");
    expect(content).toContain("grtl cbb install <cbb_id>@<version>");
    expect(content).toContain("verifies SHA-256");
    expect(content).toContain("GRTL_API_KEY");
  });

  test("builds an MCP skill that invokes all five GenRTL tools", () => {
    const content = getSkillContent("mcp");
    expect(content).toContain("name: genrtl-mcp");
    expect(content).toContain("genrtl_knowledge_search");
    expect(content).toContain("genrtl_spec2rtl_search");
    expect(content).toContain("genrtl_spec2plan_search");
    expect(content).toContain("genrtl_verification_search");
    expect(content).toContain("genrtl_debug_search");
  });
});

describe("mergeServerEntry", () => {
  test("adds server to empty config", () => {
    const { config, alreadyExists } = mergeServerEntry({}, "mcpServers", "genrtl", {
      url: "https://genrtl.com/api/mcp",
    });
    expect(alreadyExists).toBe(false);
    expect((config.mcpServers as Record<string, unknown>).genrtl).toEqual({
      url: "https://genrtl.com/api/mcp",
    });
  });

  test("preserves existing servers when adding new one", () => {
    const { config } = mergeServerEntry(
      { mcpServers: { other: { url: "https://other.com" } } },
      "mcpServers",
      "genrtl",
      { url: "https://genrtl.com/api/mcp" }
    );
    const servers = config.mcpServers as Record<string, unknown>;
    expect(servers.genrtl).toBeTruthy();
    expect(servers.other).toEqual({ url: "https://other.com" });
  });

  test("overwrites existing server and flags alreadyExists", () => {
    const existing = { mcpServers: { genrtl: { url: "https://old.com" } } };
    const { config, alreadyExists } = mergeServerEntry(existing, "mcpServers", "genrtl", {
      url: "https://new.com",
    });
    expect(alreadyExists).toBe(true);
    expect((config.mcpServers as Record<string, unknown>).genrtl).toEqual({
      url: "https://new.com",
    });
  });

  test("overwrites existing server entry with new url", () => {
    const existing = {
      mcpServers: {
        genrtl: { url: "https://old.com", headers: { key: "old-key" } },
        other: { url: "https://other.com" },
      },
    };
    const { config, alreadyExists } = mergeServerEntry(existing, "mcpServers", "genrtl", {
      url: "https://genrtl.com/api/mcp",
      headers: { key: "new-key" },
    });
    expect(alreadyExists).toBe(true);
    const servers = config.mcpServers as Record<string, unknown>;
    expect(servers.genrtl).toEqual({
      url: "https://genrtl.com/api/mcp",
      headers: { key: "new-key" },
    });
    expect(servers.other).toEqual({ url: "https://other.com" });
  });

  test("overwrites existing server entry with different auth mode", () => {
    const existing = {
      mcpServers: {
        genrtl: { url: "https://genrtl.com/api/mcp", headers: { "x-api-key": "old" } },
      },
    };
    const { config, alreadyExists } = mergeServerEntry(existing, "mcpServers", "genrtl", {
      url: "https://genrtl.com/api/mcp",
    });
    expect(alreadyExists).toBe(true);
    expect((config.mcpServers as Record<string, unknown>).genrtl).toEqual({
      url: "https://genrtl.com/api/mcp",
    });
  });

  test("works with opencode configKey 'mcp'", () => {
    const { config } = mergeServerEntry({}, "mcp", "genrtl", {
      type: "remote",
      url: "https://genrtl.com/api/mcp",
    });
    expect((config.mcp as Record<string, unknown>).genrtl).toEqual({
      type: "remote",
      url: "https://genrtl.com/api/mcp",
    });
  });
});

describe("removeServerEntry", () => {
  test("removes server from config section", () => {
    const { config, removed } = removeServerEntry(
      {
        mcpServers: {
          genrtl: { url: "https://genrtl.com/api/mcp" },
          other: { url: "https://other.com" },
        },
      },
      "mcpServers",
      "genrtl"
    );

    expect(removed).toBe(true);
    expect(config).toEqual({
      mcpServers: {
        other: { url: "https://other.com" },
      },
    });
  });

  test("removes empty config section when genrtl is the only server", () => {
    const { config, removed } = removeServerEntry(
      {
        mcpServers: {
          genrtl: { url: "https://genrtl.com/api/mcp" },
        },
        theme: "dark",
      },
      "mcpServers",
      "genrtl"
    );

    expect(removed).toBe(true);
    expect(config).toEqual({ theme: "dark" });
  });

  test("returns original config when server is not present", () => {
    const existing = { mcpServers: { other: { url: "https://other.com" } } };
    const { config, removed } = removeServerEntry(existing, "mcpServers", "genrtl");

    expect(removed).toBe(false);
    expect(config).toEqual(existing);
  });

  test("preserves unrelated top-level fields and sibling MCP servers", () => {
    const existing = {
      version: 2,
      theme: "dark",
      mcpServers: {
        alpha: { url: "https://alpha.com" },
        genrtl: { url: "https://genrtl.com/api/mcp", headers: { key: "secret" } },
        omega: { url: "https://omega.com" },
      },
      telemetry: { enabled: true },
    };

    const { config, removed } = removeServerEntry(existing, "mcpServers", "genrtl");

    expect(removed).toBe(true);
    expect(config).toEqual({
      version: 2,
      theme: "dark",
      mcpServers: {
        alpha: { url: "https://alpha.com" },
        omega: { url: "https://omega.com" },
      },
      telemetry: { enabled: true },
    });
  });
});

describe("readJsonConfig / writeJsonConfig", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `grtl-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns empty object for missing or empty file", async () => {
    expect(await readJsonConfig(join(tempDir, "nope.json"))).toEqual({});

    await writeFile(join(tempDir, "empty.json"), "", "utf-8");
    expect(await readJsonConfig(join(tempDir, "empty.json"))).toEqual({});
  });

  test("roundtrip write then read preserves data", async () => {
    const path = join(tempDir, "sub", "dir", "config.json");
    const data = { mcpServers: { genrtl: { url: "https://genrtl.com/api/mcp" } } };

    await writeJsonConfig(path, data);
    const result = await readJsonConfig(path);
    expect(result).toEqual(data);

    const raw = await readFile(path, "utf-8");
    expect(raw.endsWith("\n")).toBe(true);
  });
});

describe("JSONC support", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `grtl-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("readJsonConfig strips comments without corrupting URLs", async () => {
    const path = join(tempDir, "config.jsonc");
    await writeFile(
      path,
      `{
  // This is a comment
  "mcp": {},
  "$schema": "https://opencode.ai/config.json"
}`,
      "utf-8"
    );
    const result = await readJsonConfig(path);
    expect(result.$schema).toBe("https://opencode.ai/config.json");
    expect(result.mcp).toEqual({});
  });

  test("readJsonConfig handles block comments", async () => {
    const path = join(tempDir, "config.jsonc");
    await writeFile(path, '{ /* block */ "key": "value" }', "utf-8");
    const result = await readJsonConfig(path);
    expect(result.key).toBe("value");
  });

  test("resolveMcpPath returns first existing candidate", async () => {
    const jsoncPath = join(tempDir, "opencode.jsonc");
    await writeFile(jsoncPath, "{}", "utf-8");
    const resolved = await resolveMcpPath([join(tempDir, "opencode.json"), jsoncPath]);
    expect(resolved).toBe(jsoncPath);
  });

  test("resolveMcpPath falls back to first candidate when none exist", async () => {
    const jsonPath = join(tempDir, "opencode.json");
    const resolved = await resolveMcpPath([jsonPath]);
    expect(resolved).toBe(jsonPath);
  });

  test("resolveMcpPath returns single candidate unchanged", async () => {
    const tomlPath = join(tempDir, "config.toml");
    const resolved = await resolveMcpPath([tomlPath]);
    expect(resolved).toBe(tomlPath);
  });
});

describe("TOML config", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `grtl-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("buildTomlServerBlock generates correct TOML", () => {
    const block = buildTomlServerBlock("genrtl", {
      url: "https://genrtl.com/api/mcp",
    });
    expect(block).toContain("[mcp_servers.genrtl]");
    expect(block).toContain('url = "https://genrtl.com/api/mcp"');
  });

  test("buildTomlServerBlock includes http_headers", () => {
    const block = buildTomlServerBlock("genrtl", {
      url: "https://genrtl.com/api/mcp",
      headers: { Authorization: "Bearer sk-test" },
    });
    expect(block).toContain("[mcp_servers.genrtl]");
    expect(block).toContain("[mcp_servers.genrtl.http_headers]");
    expect(block).toContain('Authorization = "Bearer sk-test"');
    expect(block).not.toContain("headers =");
  });

  test("readTomlServerExists detects existing server", async () => {
    const path = join(tempDir, "config.toml");
    await writeFile(path, '[mcp_servers.genrtl]\nurl = "https://test.com"\n', "utf-8");
    expect(await readTomlServerExists(path, "genrtl")).toBe(true);
    expect(await readTomlServerExists(path, "other")).toBe(false);
  });

  test("readTomlServerExists returns false for missing file", async () => {
    expect(await readTomlServerExists(join(tempDir, "nope.toml"), "genrtl")).toBe(false);
  });

  test("appendTomlServer appends to empty file", async () => {
    const path = join(tempDir, "config.toml");
    const { alreadyExists } = await appendTomlServer(path, "genrtl", {
      url: "https://genrtl.com/api/mcp",
    });
    expect(alreadyExists).toBe(false);
    const content = await readFile(path, "utf-8");
    expect(content).toContain("[mcp_servers.genrtl]");
    expect(content).toContain('url = "https://genrtl.com/api/mcp"');
  });

  test("appendTomlServer preserves existing config", async () => {
    const path = join(tempDir, "config.toml");
    await writeFile(path, 'model = "gpt-5"\n\n[mcp_servers.other]\nurl = "https://other.com"\n');
    await appendTomlServer(path, "genrtl", { url: "https://genrtl.com/api/mcp" });
    const content = await readFile(path, "utf-8");
    expect(content).toContain('model = "gpt-5"');
    expect(content).toContain("[mcp_servers.other]");
    expect(content).toContain("[mcp_servers.genrtl]");
  });

  test("appendTomlServer is idempotent", async () => {
    const path = join(tempDir, "config.toml");
    await appendTomlServer(path, "genrtl", { url: "https://genrtl.com/api/mcp" });
    const { alreadyExists } = await appendTomlServer(path, "genrtl", {
      url: "https://genrtl.com/api/mcp",
    });
    expect(alreadyExists).toBe(true);
    const content = await readFile(path, "utf-8");
    expect(content.match(/\[mcp_servers\.genrtl\]/g)?.length).toBe(1);
  });

  test("appendTomlServer overwrites existing server with new url", async () => {
    const path = join(tempDir, "config.toml");
    await appendTomlServer(path, "genrtl", { url: "https://old.com" });
    const { alreadyExists } = await appendTomlServer(path, "genrtl", {
      url: "https://genrtl.com/api/mcp",
    });
    expect(alreadyExists).toBe(true);
    const content = await readFile(path, "utf-8");
    expect(content.match(/\[mcp_servers\.genrtl\]/g)?.length).toBe(1);
    expect(content).toContain('url = "https://genrtl.com/api/mcp"');
    expect(content).not.toContain("https://old.com");
  });

  test("appendTomlServer overwrites server without affecting other servers", async () => {
    const path = join(tempDir, "config.toml");
    await writeFile(
      path,
      '[mcp_servers.genrtl]\nurl = "https://old.com"\n\n[mcp_servers.other]\nurl = "https://other.com"\n'
    );
    await appendTomlServer(path, "genrtl", { url: "https://genrtl.com/api/mcp" });
    const content = await readFile(path, "utf-8");
    expect(content).toContain('url = "https://genrtl.com/api/mcp"');
    expect(content).not.toContain("https://old.com");
    expect(content).toContain("[mcp_servers.other]");
    expect(content).toContain('url = "https://other.com"');
  });

  test("appendTomlServer overwrites server that appears before non-mcp sections", async () => {
    const path = join(tempDir, "config.toml");
    await writeFile(
      path,
      'model = "gpt-5"\n\n[mcp_servers.genrtl]\nurl = "https://old.com"\n\n[some_other_section]\nkey = "value"\n'
    );
    await appendTomlServer(path, "genrtl", {
      url: "https://genrtl.com/api/mcp",
      headers: { "x-api-key": "sk-new" },
    });
    const content = await readFile(path, "utf-8");
    expect(content).toContain('model = "gpt-5"');
    expect(content).toContain('url = "https://genrtl.com/api/mcp"');
    expect(content).toContain("[mcp_servers.genrtl.http_headers]");
    expect(content).toContain('x-api-key = "sk-new"');
    expect(content).not.toContain("https://old.com");
    expect(content).toContain("[some_other_section]");
    expect(content).toContain('key = "value"');
  });

  test("appendTomlServer overwrites server at end of file", async () => {
    const path = join(tempDir, "config.toml");
    await writeFile(
      path,
      '[mcp_servers.other]\nurl = "https://other.com"\n\n[mcp_servers.genrtl]\nurl = "https://old.com"\n'
    );
    await appendTomlServer(path, "genrtl", { url: "https://new.com" });
    const content = await readFile(path, "utf-8");
    expect(content).toContain("[mcp_servers.other]");
    expect(content).toContain('url = "https://new.com"');
    expect(content).not.toContain("https://old.com");
    expect(content.match(/\[mcp_servers\.genrtl\]/g)?.length).toBe(1);
  });

  test("appendTomlServer does not accumulate blank lines on repeated overwrites", async () => {
    const path = join(tempDir, "config.toml");
    await writeFile(
      path,
      'model = "o3"\n\n[mcp_servers.genrtl]\nurl = "https://old.com"\n\n[mcp_servers.other]\nurl = "https://other.com"\n'
    );

    for (let i = 1; i <= 3; i++) {
      await appendTomlServer(path, "genrtl", { url: `https://v${i}.com` });
    }

    const content = await readFile(path, "utf-8");
    expect(content.match(/\[mcp_servers\.genrtl\]/g)?.length).toBe(1);
    expect(content).toContain('url = "https://v3.com"');
    expect(content).toContain("[mcp_servers.other]");
    expect(content).not.toContain("\n\n\n");
  });

  test("removeTomlServer removes only the target server", async () => {
    const path = join(tempDir, "config.toml");
    await writeFile(
      path,
      'model = "gpt-5"\n\n[mcp_servers.genrtl]\nurl = "https://genrtl.com/api/mcp"\n\n[mcp_servers.other]\nurl = "https://other.com"\n',
      "utf-8"
    );

    const { removed } = await removeTomlServer(path, "genrtl");
    expect(removed).toBe(true);

    const content = await readFile(path, "utf-8");
    expect(content).toContain('model = "gpt-5"');
    expect(content).toContain("[mcp_servers.other]");
    expect(content).toContain('url = "https://other.com"');
    expect(content).not.toContain("[mcp_servers.genrtl]");
  });

  test("removeTomlServer removes nested subsections too", async () => {
    const path = join(tempDir, "config.toml");
    await writeFile(
      path,
      '[mcp_servers.genrtl]\nurl = "https://genrtl.com/api/mcp"\n\n[mcp_servers.genrtl.http_headers]\nAuthorization = "Bearer sk-test"\n\n[settings]\nmodel = "gpt-5"\n',
      "utf-8"
    );

    const { removed } = await removeTomlServer(path, "genrtl");
    expect(removed).toBe(true);

    const content = await readFile(path, "utf-8");
    expect(content).toContain("[settings]");
    expect(content).toContain('model = "gpt-5"');
    expect(content).not.toContain("[mcp_servers.genrtl]");
    expect(content).not.toContain("Authorization");
  });

  test("removeTomlServer preserves other MCP servers and their subsections", async () => {
    const path = join(tempDir, "config.toml");
    await writeFile(
      path,
      '[mcp_servers.genrtl]\nurl = "https://genrtl.com/api/mcp"\n\n[mcp_servers.genrtl.http_headers]\nAuthorization = "Bearer sk-test"\n\n[mcp_servers.other]\nurl = "https://other.com"\n\n[mcp_servers.other.http_headers]\nX_API_KEY = "keep-me"\n\n[settings]\nmodel = "gpt-5"\n',
      "utf-8"
    );

    const { removed } = await removeTomlServer(path, "genrtl");
    const content = await readFile(path, "utf-8");

    expect(removed).toBe(true);
    expect(content).toContain("[mcp_servers.other]");
    expect(content).toContain('url = "https://other.com"');
    expect(content).toContain("[mcp_servers.other.http_headers]");
    expect(content).toContain('X_API_KEY = "keep-me"');
    expect(content).toContain("[settings]");
    expect(content).not.toContain("[mcp_servers.genrtl]");
    expect(content).not.toContain("[mcp_servers.genrtl.http_headers]");
  });

  test("removeTomlServer returns false when server is missing", async () => {
    const path = join(tempDir, "config.toml");
    await writeFile(path, '[mcp_servers.other]\nurl = "https://other.com"\n', "utf-8");

    const { removed } = await removeTomlServer(path, "genrtl");
    expect(removed).toBe(false);
  });
});

describe("AGENTS.md append", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `grtl-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const marker = "<!-- genrtl -->";
  const ruleContent = "Use grtl CLI for docs.\n";

  async function appendRule(filePath: string, existing?: string): Promise<string> {
    if (existing !== undefined) {
      await writeFile(filePath, existing, "utf-8");
    }

    const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const section = `${marker}\n${ruleContent}${marker}`;

    let content = "";
    try {
      content = await readFile(filePath, "utf-8");
    } catch {}

    if (content.includes(marker)) {
      const regex = new RegExp(`${escapedMarker}\\n[\\s\\S]*?${escapedMarker}`);
      await writeFile(filePath, content.replace(regex, section), "utf-8");
    } else {
      const separator =
        content.length > 0 && !content.endsWith("\n") ? "\n\n" : content.length > 0 ? "\n" : "";
      await mkdir(join(filePath, ".."), { recursive: true });
      await writeFile(filePath, content + separator + section + "\n", "utf-8");
    }

    return readFile(filePath, "utf-8");
  }

  test("creates new file cleanly", async () => {
    const result = await appendRule(join(tempDir, "AGENTS.md"));
    expect(result).toBe(`${marker}\n${ruleContent}${marker}\n`);
    expect(result[0]).not.toBe("\n");
  });

  test("appends to existing content with proper spacing", async () => {
    const withNewline = await appendRule(join(tempDir, "a.md"), "# Rules\n");
    expect(withNewline).toContain("# Rules\n\n<!-- genrtl -->");

    const withoutNewline = await appendRule(join(tempDir, "b.md"), "No trailing newline");
    expect(withoutNewline).toContain("No trailing newline\n\n<!-- genrtl -->");
  });

  test("is idempotent on re-run", async () => {
    const filePath = join(tempDir, "AGENTS.md");
    const first = await appendRule(filePath);
    const second = await appendRule(filePath);
    expect(second).toBe(first);
    expect(second.match(/<!-- genrtl -->/g)?.length).toBe(2);
  });

  test("replaces section without affecting surrounding content", async () => {
    const filePath = join(tempDir, "AGENTS.md");
    await writeFile(filePath, `# Before\n\n${marker}\nold content\n${marker}\n\n# After\n`);

    const result = await appendRule(filePath);
    expect(result).toContain("# Before");
    expect(result).toContain("# After");
    expect(result).not.toContain("old content");
    expect(result).toContain(ruleContent);
  });
});

describe("agent config integration", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `grtl-agent-cfg-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const apiKeyAuth: AuthOptions = { mode: "api-key", apiKey: "sk-test-123" };
  const oauthAuth: AuthOptions = { mode: "oauth" };

  describe("claude", () => {
    const agent = getAgent("claude");

    test("buildEntry with api-key produces correct shape", () => {
      const entry = agent.mcp.buildEntry(apiKeyAuth, "http");
      expect(entry).toEqual({
        type: "http",
        url: "https://genrtl.com/api/mcp",
        headers: { Authorization: "Bearer sk-test-123" },
      });
    });

    test("buildEntry with oauth produces correct shape", () => {
      const entry = agent.mcp.buildEntry(oauthAuth, "http");
      expect(entry).toEqual({
        type: "http",
        url: "https://genrtl.com/api/mcp",
      });
    });

    test("uses CLAUDE_CONFIG_DIR for global Claude config, rules, skills, and detection", () => {
      const previous = process.env.CLAUDE_CONFIG_DIR;
      const customDir = join(tempDir, "xdg", "claude");
      process.env.CLAUDE_CONFIG_DIR = customDir;
      try {
        expect(agent.mcp.globalPaths).toEqual([join(customDir, ".claude.json")]);
        expect(agent.rule.kind).toBe("file");
        if (agent.rule.kind === "file") {
          expect(agent.rule.dir("global")).toBe(join(customDir, "rules"));
        }
        expect(agent.skill.dir("global")).toBe(join(customDir, "skills"));
        expect(agent.detect.globalPaths).toEqual([customDir]);
      } finally {
        if (previous === undefined) {
          delete process.env.CLAUDE_CONFIG_DIR;
        } else {
          process.env.CLAUDE_CONFIG_DIR = previous;
        }
      }
    });

    test("merges into JSON config with configKey mcpServers", async () => {
      const path = join(tempDir, ".claude.json");
      const existing = await readJsonConfig(path);
      const { config } = mergeServerEntry(
        existing,
        agent.mcp.configKey,
        "genrtl",
        agent.mcp.buildEntry(apiKeyAuth, "http")
      );
      await writeJsonConfig(path, config);

      const result = await readJsonConfig(path);
      const servers = result.mcpServers as Record<string, unknown>;
      expect(servers.genrtl).toEqual({
        type: "http",
        url: "https://genrtl.com/api/mcp",
        headers: { Authorization: "Bearer sk-test-123" },
      });
    });

    test("overwrites existing config in JSON", async () => {
      const path = join(tempDir, ".claude.json");
      await writeJsonConfig(path, {
        mcpServers: { genrtl: { type: "http", url: "https://old.com" } },
      });

      const existing = await readJsonConfig(path);
      const { config, alreadyExists } = mergeServerEntry(
        existing,
        agent.mcp.configKey,
        "genrtl",
        agent.mcp.buildEntry(apiKeyAuth, "http")
      );
      expect(alreadyExists).toBe(true);
      await writeJsonConfig(path, config);

      const result = await readJsonConfig(path);
      expect((result.mcpServers as Record<string, unknown>).genrtl).toEqual({
        type: "http",
        url: "https://genrtl.com/api/mcp",
        headers: { Authorization: "Bearer sk-test-123" },
      });
    });
  });

  describe("cursor", () => {
    const agent = getAgent("cursor");

    test("buildEntry with api-key produces correct shape (no type field)", () => {
      const entry = agent.mcp.buildEntry(apiKeyAuth, "http");
      expect(entry).toEqual({
        url: "https://genrtl.com/api/mcp",
        headers: { Authorization: "Bearer sk-test-123" },
      });
      expect(entry).not.toHaveProperty("type");
    });

    test("buildEntry with oauth produces correct shape", () => {
      const entry = agent.mcp.buildEntry(oauthAuth, "http");
      expect(entry).toEqual({
        url: "https://genrtl.com/api/mcp",
      });
    });

    test("merges into JSON config with configKey mcpServers", async () => {
      const path = join(tempDir, "mcp.json");
      const existing = await readJsonConfig(path);
      const { config } = mergeServerEntry(
        existing,
        agent.mcp.configKey,
        "genrtl",
        agent.mcp.buildEntry(oauthAuth, "http")
      );
      await writeJsonConfig(path, config);

      const result = await readJsonConfig(path);
      expect((result.mcpServers as Record<string, unknown>).genrtl).toEqual({
        url: "https://genrtl.com/api/mcp",
      });
    });

    test("overwrites existing config in JSON", async () => {
      const path = join(tempDir, "mcp.json");
      await writeJsonConfig(path, {
        mcpServers: { genrtl: { url: "https://old.com" }, other: { url: "https://other.com" } },
      });

      const existing = await readJsonConfig(path);
      const { config, alreadyExists } = mergeServerEntry(
        existing,
        agent.mcp.configKey,
        "genrtl",
        agent.mcp.buildEntry(apiKeyAuth, "http")
      );
      expect(alreadyExists).toBe(true);
      await writeJsonConfig(path, config);

      const result = await readJsonConfig(path);
      const servers = result.mcpServers as Record<string, unknown>;
      expect(servers.genrtl).toEqual({
        url: "https://genrtl.com/api/mcp",
        headers: { Authorization: "Bearer sk-test-123" },
      });
      expect(servers.other).toEqual({ url: "https://other.com" });
    });
  });

  describe("opencode", () => {
    const agent = getAgent("opencode");

    test("buildEntry with api-key includes type, url, enabled, and headers", () => {
      const entry = agent.mcp.buildEntry(apiKeyAuth, "http");
      expect(entry).toEqual({
        type: "remote",
        url: "https://genrtl.com/api/mcp",
        enabled: true,
        headers: { Authorization: "Bearer sk-test-123" },
      });
    });

    test("buildEntry with oauth includes type, url, enabled without headers", () => {
      const entry = agent.mcp.buildEntry(oauthAuth, "http");
      expect(entry).toEqual({
        type: "remote",
        url: "https://genrtl.com/api/mcp",
        enabled: true,
      });
    });

    test("uses configKey 'mcp' instead of 'mcpServers'", () => {
      expect(agent.mcp.configKey).toBe("mcp");
    });

    test("merges into JSON config with configKey mcp", async () => {
      const path = join(tempDir, "opencode.json");
      await writeJsonConfig(path, { $schema: "https://opencode.ai/config.json" });

      const existing = await readJsonConfig(path);
      const { config } = mergeServerEntry(
        existing,
        agent.mcp.configKey,
        "genrtl",
        agent.mcp.buildEntry(apiKeyAuth, "http")
      );
      await writeJsonConfig(path, config);

      const result = await readJsonConfig(path);
      expect(result.$schema).toBe("https://opencode.ai/config.json");
      expect((result.mcp as Record<string, unknown>).genrtl).toEqual({
        type: "remote",
        url: "https://genrtl.com/api/mcp",
        enabled: true,
        headers: { Authorization: "Bearer sk-test-123" },
      });
    });

    test("overwrites existing config in JSON", async () => {
      const path = join(tempDir, "opencode.json");
      await writeJsonConfig(path, {
        mcp: { genrtl: { type: "remote", url: "https://old.com", enabled: true } },
      });

      const existing = await readJsonConfig(path);
      const { config, alreadyExists } = mergeServerEntry(
        existing,
        agent.mcp.configKey,
        "genrtl",
        agent.mcp.buildEntry(oauthAuth, "http")
      );
      expect(alreadyExists).toBe(true);
      await writeJsonConfig(path, config);

      const result = await readJsonConfig(path);
      expect((result.mcp as Record<string, unknown>).genrtl).toEqual({
        type: "remote",
        url: "https://genrtl.com/api/mcp",
        enabled: true,
      });
    });

    test("works with JSONC files containing comments", async () => {
      const path = join(tempDir, "opencode.jsonc");
      await writeFile(
        path,
        `{
  // OpenCode config
  "$schema": "https://opencode.ai/config.json",
  "mcp": {}
}`,
        "utf-8"
      );

      const existing = await readJsonConfig(path);
      const { config } = mergeServerEntry(
        existing,
        agent.mcp.configKey,
        "genrtl",
        agent.mcp.buildEntry(apiKeyAuth, "http")
      );
      await writeJsonConfig(path, config);

      const result = await readJsonConfig(path);
      expect(result.$schema).toBe("https://opencode.ai/config.json");
      expect((result.mcp as Record<string, unknown>).genrtl).toBeTruthy();
    });
  });

  describe("codex", () => {
    const agent = getAgent("codex");

    test("buildEntry with api-key produces correct shape", () => {
      const entry = agent.mcp.buildEntry(apiKeyAuth, "http");
      expect(entry).toEqual({
        type: "http",
        url: "https://genrtl.com/api/mcp",
        headers: { Authorization: "Bearer sk-test-123" },
      });
    });

    test("uses bearer_token_env_var when setup reads an environment key", () => {
      const entry = agent.mcp.buildEntry(
        {
          mode: "api-key",
          apiKey: "gtr_test_example",
          apiKeyEnvVar: "GRTL_API_KEY",
        },
        "http"
      );
      expect(entry).toEqual({
        type: "http",
        url: "https://genrtl.com/api/mcp",
        bearer_token_env_var: "GRTL_API_KEY",
      });
    });

    test("buildEntry with oauth produces correct shape", () => {
      const entry = agent.mcp.buildEntry(oauthAuth, "http");
      expect(entry).toEqual({
        type: "http",
        url: "https://genrtl.com/api/mcp",
      });
    });

    test("appends to TOML config", async () => {
      const path = join(tempDir, "config.toml");
      const { alreadyExists } = await appendTomlServer(
        path,
        "genrtl",
        agent.mcp.buildEntry(apiKeyAuth, "http")
      );
      expect(alreadyExists).toBe(false);

      const content = await readFile(path, "utf-8");
      expect(content).toContain("[mcp_servers.genrtl]");
      expect(content).toContain('type = "http"');
      expect(content).toContain('url = "https://genrtl.com/api/mcp"');
      expect(content).toContain("[mcp_servers.genrtl.http_headers]");
      expect(content).toContain('Authorization = "Bearer sk-test-123"');
    });

    test("appends oauth entry to TOML without headers", async () => {
      const path = join(tempDir, "config.toml");
      await appendTomlServer(path, "genrtl", agent.mcp.buildEntry(oauthAuth, "http"));

      const content = await readFile(path, "utf-8");
      expect(content).toContain("[mcp_servers.genrtl]");
      expect(content).toContain('url = "https://genrtl.com/api/mcp"');
      expect(content).not.toContain("http_headers");
    });

    test("overwrites existing TOML config", async () => {
      const path = join(tempDir, "config.toml");
      await appendTomlServer(path, "genrtl", agent.mcp.buildEntry(oauthAuth, "http"));
      const { alreadyExists } = await appendTomlServer(
        path,
        "genrtl",
        agent.mcp.buildEntry(apiKeyAuth, "http")
      );

      expect(alreadyExists).toBe(true);
      const content = await readFile(path, "utf-8");
      expect(content.match(/\[mcp_servers\.genrtl\]/g)?.length).toBe(1);
      expect(content).toContain('url = "https://genrtl.com/api/mcp"');
      expect(content).not.toContain("mcp/oauth");
      expect(content).toContain('Authorization = "Bearer sk-test-123"');
    });

    test("overwrites TOML config preserving other servers", async () => {
      const path = join(tempDir, "config.toml");
      await writeFile(
        path,
        '[mcp_servers.other]\nurl = "https://other.com"\n\n[mcp_servers.genrtl]\ntype = "http"\nurl = "https://old.com"\n'
      );
      await appendTomlServer(path, "genrtl", agent.mcp.buildEntry(apiKeyAuth, "http"));

      const content = await readFile(path, "utf-8");
      expect(content).toContain("[mcp_servers.other]");
      expect(content).toContain('url = "https://other.com"');
      expect(content).toContain('url = "https://genrtl.com/api/mcp"');
      expect(content).not.toContain("https://old.com");
    });
  });

  describe("gemini", () => {
    const agent = getAgent("gemini");

    test("buildEntry with api-key uses httpUrl", () => {
      const entry = agent.mcp.buildEntry(apiKeyAuth, "http");
      expect(entry).toEqual({
        httpUrl: "https://genrtl.com/api/mcp",
        headers: { Authorization: "Bearer sk-test-123" },
      });
      expect(entry).not.toHaveProperty("url");
    });

    test("buildEntry with oauth uses httpUrl without headers", () => {
      const entry = agent.mcp.buildEntry(oauthAuth, "http");
      expect(entry).toEqual({
        httpUrl: "https://genrtl.com/api/mcp",
      });
    });

    test("uses configKey mcpServers", () => {
      expect(agent.mcp.configKey).toBe("mcpServers");
    });

    test("merges into settings.json with mcpServers key", async () => {
      const path = join(tempDir, "settings.json");
      await writeJsonConfig(path, { theme: "dark" });

      const existing = await readJsonConfig(path);
      const { config } = mergeServerEntry(
        existing,
        agent.mcp.configKey,
        "genrtl",
        agent.mcp.buildEntry(apiKeyAuth, "http")
      );
      await writeJsonConfig(path, config);

      const result = await readJsonConfig(path);
      expect(result.theme).toBe("dark");
      expect((result.mcpServers as Record<string, unknown>).genrtl).toEqual({
        httpUrl: "https://genrtl.com/api/mcp",
        headers: { Authorization: "Bearer sk-test-123" },
      });
    });

    test("overwrites existing config in JSON", async () => {
      const path = join(tempDir, "settings.json");
      await writeJsonConfig(path, {
        mcpServers: { genrtl: { httpUrl: "https://old.com" } },
      });

      const existing = await readJsonConfig(path);
      const { config, alreadyExists } = mergeServerEntry(
        existing,
        agent.mcp.configKey,
        "genrtl",
        agent.mcp.buildEntry(apiKeyAuth, "http")
      );
      expect(alreadyExists).toBe(true);
      await writeJsonConfig(path, config);

      const result = await readJsonConfig(path);
      expect((result.mcpServers as Record<string, unknown>).genrtl).toEqual({
        httpUrl: "https://genrtl.com/api/mcp",
        headers: { Authorization: "Bearer sk-test-123" },
      });
    });
  });

  describe("all agents have consistent config", () => {
    test("all agents are covered", () => {
      expect(ALL_AGENT_NAMES).toEqual([
        "claude",
        "cursor",
        "opencode",
        "codex",
        "antigravity",
        "gemini",
      ]);
    });

    test.each(ALL_AGENT_NAMES)("%s buildEntry returns url for both auth modes", (name) => {
      const agent = getAgent(name);
      const apiEntry = agent.mcp.buildEntry(apiKeyAuth, "http");
      const oauthEntry = agent.mcp.buildEntry(oauthAuth, "http");

      const urlKey = name === "gemini" ? "httpUrl" : name === "antigravity" ? "serverUrl" : "url";
      expect(apiEntry[urlKey]).toBe("https://genrtl.com/api/mcp");
      expect(oauthEntry[urlKey]).toBe("https://genrtl.com/api/mcp");
    });

    test.each(ALL_AGENT_NAMES)("%s buildEntry includes headers only for api-key auth", (name) => {
      const agent = getAgent(name);
      const apiEntry = agent.mcp.buildEntry(apiKeyAuth, "http");
      const oauthEntry = agent.mcp.buildEntry(oauthAuth, "http");

      expect(apiEntry.headers).toEqual({ Authorization: "Bearer sk-test-123" });
      expect(oauthEntry).not.toHaveProperty("headers");
    });

    test.each(ALL_AGENT_NAMES)("%s buildEntry without apiKey omits headers", (name) => {
      const agent = getAgent(name);
      const entry = agent.mcp.buildEntry({ mode: "api-key" }, "http");
      expect(entry).not.toHaveProperty("headers");
    });
  });

  describe("stdio buildEntry", () => {
    const apiKeyAuth: AuthOptions = { mode: "api-key", apiKey: "sk-test-stdio" };
    const oauthAuth: AuthOptions = { mode: "oauth" };

    test("claude stdio entry uses npx command with --api-key in args", () => {
      const entry = getAgent("claude").mcp.buildEntry(apiKeyAuth, "stdio");
      expect(entry).toEqual({
        command: "npx",
        args: ["-y", "@upstash/genrtl-mcp", "--api-key", "sk-test-stdio"],
      });
    });

    test("cursor stdio entry uses npx command with --api-key in args", () => {
      const entry = getAgent("cursor").mcp.buildEntry(apiKeyAuth, "stdio");
      expect(entry).toEqual({
        command: "npx",
        args: ["-y", "@upstash/genrtl-mcp", "--api-key", "sk-test-stdio"],
      });
    });

    test("opencode stdio entry uses type:local with array command", () => {
      const entry = getAgent("opencode").mcp.buildEntry(apiKeyAuth, "stdio");
      expect(entry).toEqual({
        type: "local",
        command: ["npx", "-y", "@upstash/genrtl-mcp", "--api-key", "sk-test-stdio"],
        enabled: true,
      });
    });

    test("codex stdio entry uses npx command with --api-key in args", () => {
      const entry = getAgent("codex").mcp.buildEntry(apiKeyAuth, "stdio");
      expect(entry).toEqual({
        command: "npx",
        args: ["-y", "@upstash/genrtl-mcp", "--api-key", "sk-test-stdio"],
      });
    });

    test("gemini stdio entry uses npx command with --api-key in args", () => {
      const entry = getAgent("gemini").mcp.buildEntry(apiKeyAuth, "stdio");
      expect(entry).toEqual({
        command: "npx",
        args: ["-y", "@upstash/genrtl-mcp", "--api-key", "sk-test-stdio"],
      });
    });

    test.each(ALL_AGENT_NAMES)("%s stdio entry omits --api-key for oauth mode", (name) => {
      const entry = getAgent(name).mcp.buildEntry(oauthAuth, "stdio");
      const args = (entry.args ?? entry.command) as string[];
      expect(args).not.toContain("--api-key");
      expect(args).toContain("@upstash/genrtl-mcp");
    });

    test("codex stdio entry serializes to TOML correctly", () => {
      const block = buildTomlServerBlock(
        "genrtl",
        getAgent("codex").mcp.buildEntry(apiKeyAuth, "stdio")
      );
      expect(block).toContain("[mcp_servers.genrtl]");
      expect(block).toContain('command = "npx"');
      expect(block).toContain('args = ["-y","@upstash/genrtl-mcp","--api-key","sk-test-stdio"]');
      expect(block).not.toContain("http_headers");
    });
  });

  describe("isStdioGenRTLEntry", () => {
    test("detects standard command/args stdio entry", () => {
      expect(
        isStdioGenRTLEntry({
          command: "npx",
          args: ["-y", "@upstash/genrtl-mcp", "--api-key", "k"],
        })
      ).toBe(true);
    });

    test("detects entry with @latest specifier", () => {
      expect(
        isStdioGenRTLEntry({ command: "npx", args: ["-y", "@upstash/genrtl-mcp@latest"] })
      ).toBe(true);
    });

    test("detects entry with pinned version", () => {
      expect(
        isStdioGenRTLEntry({ command: "npx", args: ["-y", "@upstash/genrtl-mcp@2.0.0"] })
      ).toBe(true);
    });

    test("detects OpenCode array-command form", () => {
      expect(
        isStdioGenRTLEntry({
          type: "local",
          command: ["npx", "-y", "@upstash/genrtl-mcp@latest"],
          enabled: true,
        })
      ).toBe(true);
    });

    test("returns false for HTTP entry", () => {
      expect(isStdioGenRTLEntry({ url: "https://genrtl.com/api/mcp" })).toBe(false);
    });

    test("returns false for unrelated stdio package", () => {
      expect(isStdioGenRTLEntry({ command: "npx", args: ["-y", "@some-other/package"] })).toBe(
        false
      );
    });

    test("returns false for null/undefined", () => {
      expect(isStdioGenRTLEntry(null)).toBe(false);
      expect(isStdioGenRTLEntry(undefined)).toBe(false);
    });
  });

  describe("patchStdioApiKey", () => {
    test("preserves @latest package specifier", () => {
      const patched = patchStdioApiKey(
        { command: "npx", args: ["-y", "@upstash/genrtl-mcp@latest"] },
        "new-key"
      );
      expect(patched).toEqual({
        command: "npx",
        args: ["-y", "@upstash/genrtl-mcp@latest", "--api-key", "new-key"],
      });
    });

    test("preserves pinned version specifier", () => {
      const patched = patchStdioApiKey(
        { command: "npx", args: ["-y", "@upstash/genrtl-mcp@2.0.0"] },
        "new-key"
      );
      expect(patched.args).toEqual(["-y", "@upstash/genrtl-mcp@2.0.0", "--api-key", "new-key"]);
    });

    test("replaces an existing --api-key value", () => {
      const patched = patchStdioApiKey(
        {
          command: "npx",
          args: ["-y", "@upstash/genrtl-mcp@latest", "--api-key", "OLD"],
        },
        "NEW"
      );
      expect(patched.args).toEqual(["-y", "@upstash/genrtl-mcp@latest", "--api-key", "NEW"]);
    });

    test("removes --api-key when new key is undefined (oauth)", () => {
      const patched = patchStdioApiKey(
        { command: "npx", args: ["-y", "@upstash/genrtl-mcp", "--api-key", "OLD"] },
        undefined
      );
      expect(patched.args).toEqual(["-y", "@upstash/genrtl-mcp"]);
    });

    test("preserves other args (e.g. --debug) untouched", () => {
      const patched = patchStdioApiKey(
        {
          command: "npx",
          args: ["-y", "@upstash/genrtl-mcp", "--debug", "--api-key", "OLD"],
        },
        "NEW"
      );
      expect(patched.args).toEqual(["-y", "@upstash/genrtl-mcp", "--debug", "--api-key", "NEW"]);
    });

    test("patches OpenCode array-command form", () => {
      const patched = patchStdioApiKey(
        {
          type: "local",
          command: ["npx", "-y", "@upstash/genrtl-mcp@latest", "--api-key", "OLD"],
          enabled: true,
        },
        "NEW"
      );
      expect(patched).toEqual({
        type: "local",
        command: ["npx", "-y", "@upstash/genrtl-mcp@latest", "--api-key", "NEW"],
        enabled: true,
      });
    });

    test("preserves unrelated top-level fields", () => {
      const patched = patchStdioApiKey(
        { command: "npx", args: ["-y", "@upstash/genrtl-mcp"], cwd: "/custom" },
        "NEW"
      );
      expect(patched.cwd).toBe("/custom");
    });
  });

  describe("readTomlServerEntry", () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = join(tmpdir(), `grtl-test-${Date.now()}`);
      await mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    test("returns undefined for missing file", async () => {
      expect(await readTomlServerEntry(join(tempDir, "nope.toml"), "genrtl")).toBeUndefined();
    });

    test("returns undefined for missing section", async () => {
      const path = join(tempDir, "config.toml");
      await writeFile(path, '[mcp_servers.other]\nurl = "https://other.com"\n', "utf-8");
      expect(await readTomlServerEntry(path, "genrtl")).toBeUndefined();
    });

    test("parses string and array values from a stdio block", async () => {
      const path = join(tempDir, "config.toml");
      await writeFile(
        path,
        '[mcp_servers.genrtl]\ncommand = "npx"\nargs = ["-y", "@upstash/genrtl-mcp@latest", "--api-key", "OLD"]\n',
        "utf-8"
      );
      const entry = await readTomlServerEntry(path, "genrtl");
      expect(entry).toEqual({
        command: "npx",
        args: ["-y", "@upstash/genrtl-mcp@latest", "--api-key", "OLD"],
      });
    });

    test("ignores http_headers sub-table", async () => {
      const path = join(tempDir, "config.toml");
      await writeFile(
        path,
        '[mcp_servers.genrtl]\ntype = "http"\nurl = "https://genrtl.com/api/mcp"\n\n[mcp_servers.genrtl.http_headers]\nAuthorization = "Bearer k"\n',
        "utf-8"
      );
      const entry = await readTomlServerEntry(path, "genrtl");
      expect(entry).toEqual({ type: "http", url: "https://genrtl.com/api/mcp" });
    });

    test("round-trips through patchStdioApiKey + appendTomlServer", async () => {
      const path = join(tempDir, "config.toml");
      await writeFile(
        path,
        '[mcp_servers.genrtl]\ncommand = "npx"\nargs = ["-y", "@upstash/genrtl-mcp@latest", "--api-key", "OLD"]\n',
        "utf-8"
      );
      const existing = await readTomlServerEntry(path, "genrtl");
      expect(existing).toBeDefined();
      expect(isStdioGenRTLEntry(existing)).toBe(true);
      const patched = patchStdioApiKey(existing!, "NEW");
      await appendTomlServer(path, "genrtl", patched);
      const content = await readFile(path, "utf-8");
      expect(content).toContain("@upstash/genrtl-mcp@latest");
      expect(content).toContain('"--api-key","NEW"');
      expect(content).not.toContain('"OLD"');
    });
  });
});
