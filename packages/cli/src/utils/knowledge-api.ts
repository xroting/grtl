import { VERSION } from "../constants.js";
import type {
  GenrtlKnowledgeToolName,
  KnowledgeSearchInput,
  KnowledgeSearchResponse,
} from "../types.js";

let baseUrl = "https://www.genrtl.com";

export function setBaseUrl(url: string): void {
  baseUrl = url.replace(/\/+$/, "");
}

function getMcpEndpoint(): string {
  return baseUrl.endsWith("/api/mcp") ? baseUrl : `${baseUrl}/api/mcp`;
}

function getApiKey(): string | undefined {
  return process.env.GRTL_API_KEY || process.env.GENRTL_API_KEY;
}

function getMcpErrorMessage(content: unknown): string | undefined {
  if (!Array.isArray(content)) return undefined;
  const item = content.find(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      "type" in entry &&
      entry.type === "text" &&
      "text" in entry &&
      typeof entry.text === "string"
  ) as { text?: string } | undefined;
  return item?.text;
}

export async function callGenrtlKnowledgeTool(
  toolName: GenrtlKnowledgeToolName,
  input: KnowledgeSearchInput
): Promise<KnowledgeSearchResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Authentication required. Set GRTL_API_KEY or GENRTL_API_KEY.");
  }

  const response = await fetch(getMcpEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "MCP-Protocol-Version": "2025-06-18",
      "X-GenRTL-Source": "cli",
      "X-GenRTL-Client-Version": VERSION,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: toolName, arguments: input },
    }),
  });

  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string; data?: { code?: string } };
    result?: {
      isError?: boolean;
      content?: unknown;
      structuredContent?: KnowledgeSearchResponse;
    };
  } | null;

  if (!response.ok || payload?.error) {
    const message =
      payload?.error?.message || `GenRTL MCP request failed with HTTP ${response.status}`;
    const code = payload?.error?.data?.code;
    throw new Error(code ? `${message} (${code})` : message);
  }

  const result = payload?.result;
  if (!result) throw new Error("GenRTL MCP returned an empty result.");
  if (result.isError) {
    throw new Error(getMcpErrorMessage(result.content) || "GenRTL knowledge search failed.");
  }
  if (!result.structuredContent) {
    throw new Error("GenRTL MCP response did not include structured knowledge results.");
  }
  return result.structuredContent;
}
