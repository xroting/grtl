import { afterEach, describe, expect, test, vi } from "vitest";

import { buildKnowledgeSearchInput } from "../commands/knowledge.js";
import { callGenrtlKnowledgeTool, setBaseUrl } from "../utils/knowledge-api.js";

describe("GenRTL knowledge commands", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GRTL_API_KEY;
    delete process.env.GENRTL_API_KEY;
    setBaseUrl("https://www.genrtl.com");
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

  test("calls the requested MCP tool and returns structured content", async () => {
    process.env.GRTL_API_KEY = "gtr_test_example";
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
      "https://www.genrtl.com/api/mcp",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer gtr_test_example",
          "MCP-Protocol-Version": "2025-06-18",
        }),
      })
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "genrtl_debug_search",
        arguments: { query: "CDC warning" },
      },
    });
  });
});
