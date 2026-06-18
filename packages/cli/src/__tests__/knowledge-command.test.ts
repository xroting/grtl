import { afterEach, describe, expect, test, vi } from "vitest";
import { Command } from "commander";

import { buildKnowledgeSearchInput, registerKnowledgeCommands } from "../commands/knowledge.js";
import { callGenrtlKnowledgeTool, setBaseUrl } from "../utils/knowledge-api.js";

describe("GenRTL knowledge commands", () => {
  const validTestKey = `gtr_test_${"a".repeat(43)}`;

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GRTL_API_KEY;
    delete process.env.GENRTL_API_KEY;
    setBaseUrl("https://genrtl.com");
  });

  test("maps CLI options to the MCP tool input schema", () => {
    expect(
      buildKnowledgeSearchInput("debug an async FIFO", {
        type: ["debug"],
        tool: "Vivado",
        toolVersion: "2025.1",
        target: "fpga",
        tag: ["cdc", "fifo"],
        topK: 8,
        minScore: 0.2,
        workspaceId: "workspace-1",
      })
    ).toEqual({
      query: "debug an async FIFO",
      filters: {
        types: ["debug"],
        tool: "Vivado",
        tool_version: "2025.1",
        target: "fpga",
        tags: ["cdc", "fifo"],
      },
      top_k: 8,
      min_score: 0.2,
      workspace_id: "workspace-1",
    });
  });

  test("accepts the Spec2Plan knowledge type", () => {
    expect(
      buildKnowledgeSearchInput("plan an AXI stream implementation", {
        type: ["spec2plan"],
      })
    ).toEqual({
      query: "plan an AXI stream implementation",
      filters: { types: ["spec2plan"] },
    });
  });

  test("accepts Compile, Debug, and Coding Style knowledge types", () => {
    expect(
      buildKnowledgeSearchInput("find coding and debug guidance", {
        type: ["compile", "debug", "coding_style"],
      })
    ).toEqual({
      query: "find coding and debug guidance",
      filters: { types: ["compile", "debug", "coding_style"] },
    });
  });

  test("registers the Spec2Plan tool name and short alias", () => {
    const program = new Command();
    registerKnowledgeCommands(program);

    const command = program.commands.find((item) => item.name() === "genrtl_spec2plan_search");
    expect(command?.aliases()).toContain("spec2plan-search");
  });

  test("registers the Compile tool name and short alias", () => {
    const program = new Command();
    registerKnowledgeCommands(program);

    const command = program.commands.find((item) => item.name() === "genrtl_compile_search");
    expect(command?.aliases()).toContain("compile-search");
  });

  test("calls the requested MCP tool and returns structured content", async () => {
    process.env.GRTL_API_KEY = `  ${validTestKey}  `;
    const structuredContent = {
      summary: "One match",
      matched_cards: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: { content: [], structuredContent },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      callGenrtlKnowledgeTool("genrtl_debug_search", { query: "CDC warning" })
    ).resolves.toEqual(structuredContent);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://genrtl.com/api/mcp",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${validTestKey}`,
          "MCP-Protocol-Version": "2025-06-18",
        }),
      })
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const requestBody = JSON.parse(String(request.body));
    expect(requestBody).toEqual({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "genrtl_debug_search",
        arguments: {
          query: "CDC warning",
          idempotency_key: expect.any(String),
        },
      },
    });
    expect(requestBody.params.arguments.idempotency_key).toHaveLength(36);
  });

  test("calls the Spec2Plan MCP tool", async () => {
    process.env.GRTL_API_KEY = validTestKey;
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: { content: [], structuredContent: { summary: "Plan", matched_cards: [] } },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await callGenrtlKnowledgeTool("genrtl_spec2plan_search", { query: "Plan an APB block" });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body)).params.name).toBe("genrtl_spec2plan_search");
  });

  test("rejects a truncated API key before sending a request", async () => {
    process.env.GENRTL_API_KEY = "gtr_live_truncated...";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      callGenrtlKnowledgeTool("genrtl_spec2rtl_search", { query: "AD7606 controller" })
    ).rejects.toThrow("Invalid GenRTL API key format");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("includes the backend authentication error code", async () => {
    process.env.GRTL_API_KEY = validTestKey;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            result: {
              isError: true,
              content: [{ type: "text", text: "Invalid or revoked API key" }],
              structuredContent: {
                error: "Invalid or revoked API key",
                code: "INVALID_API_KEY",
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    await expect(
      callGenrtlKnowledgeTool("genrtl_debug_search", { query: "CDC warning" })
    ).rejects.toThrow("Invalid or revoked API key (INVALID_API_KEY)");
  });
});
