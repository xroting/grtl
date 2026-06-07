import { afterEach, describe, expect, test } from "vitest";

import {
  ALL_AGENT_NAMES,
  getAgent,
  setMcpBaseUrl,
  type HttpAuthOptions,
} from "../setup/http-agents.js";

describe("public HTTP MCP agent configurations", () => {
  const literalAuth: HttpAuthOptions = { apiKey: "gtr_test" };

  afterEach(() => {
    setMcpBaseUrl("https://www.genrtl.com");
  });

  test("all supported agents use the hosted MCP endpoint and bearer authentication", () => {
    for (const name of ALL_AGENT_NAMES) {
      const entry = getAgent(name).mcp.buildEntry(literalAuth);
      const endpoint = entry.url ?? entry.httpUrl ?? entry.serverUrl;
      expect(endpoint).toBe("https://www.genrtl.com/api/mcp");
      expect(entry.headers).toEqual({ Authorization: "Bearer gtr_test" });
    }
  });

  test("Codex uses its bearer token environment variable setting when available", () => {
    const entry = getAgent("codex").mcp.buildEntry({
      apiKey: "gtr_test",
      apiKeyEnvVar: "GRTL_API_KEY",
    });

    expect(entry).toEqual({
      type: "http",
      url: "https://www.genrtl.com/api/mcp",
      bearer_token_env_var: "GRTL_API_KEY",
    });
  });

  test("normalizes custom deployment URLs", () => {
    setMcpBaseUrl("http://localhost:3005/");
    expect(getAgent("cursor").mcp.buildEntry(literalAuth).url).toBe(
      "http://localhost:3005/api/mcp"
    );

    setMcpBaseUrl("http://localhost:3005/api/mcp");
    expect(getAgent("gemini").mcp.buildEntry(literalAuth).httpUrl).toBe(
      "http://localhost:3005/api/mcp"
    );
  });
});
