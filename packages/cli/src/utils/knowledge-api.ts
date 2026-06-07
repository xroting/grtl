import { VERSION } from "../constants.js";
import type {
  GenrtlKnowledgeToolName,
  KnowledgeSearchInput,
  KnowledgeSearchResponse,
} from "../types.js";

let baseUrl = "https://genrtl.com";

export function setBaseUrl(url: string): void {
  baseUrl = url.replace(/\/+$/, "");
}

function getMcpEndpoint(): string {
  return baseUrl.endsWith("/api/mcp") ? baseUrl : `${baseUrl}/api/mcp`;
}

function getApiKey(): string | undefined {
  return [process.env.GRTL_API_KEY, process.env.GENRTL_API_KEY]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value));
}

function validateApiKey(apiKey: string): void {
  if (!/^gtr_(?:live|test)_[A-Za-z0-9_-]{32,128}$/.test(apiKey)) {
    throw new Error(
      "Invalid GenRTL API key format. Use the full key shown once when it was created; it must start with gtr_live_ or gtr_test_."
    );
  }
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

function getStructuredMcpError(content: unknown): { error?: string; code?: string } | undefined {
  if (!content || typeof content !== "object") return undefined;
  const errorContent = content as { error?: unknown; code?: unknown };
  return {
    error: typeof errorContent.error === "string" ? errorContent.error : undefined,
    code: typeof errorContent.code === "string" ? errorContent.code : undefined,
  };
}

export async function callGenrtlKnowledgeTool(
  toolName: GenrtlKnowledgeToolName,
  input: KnowledgeSearchInput
): Promise<KnowledgeSearchResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Authentication required. Set GRTL_API_KEY or GENRTL_API_KEY.");
  }
  validateApiKey(apiKey);

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
      structuredContent?: KnowledgeSearchResponse | { error?: string; code?: string };
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
    const structuredError = getStructuredMcpError(result.structuredContent);
    const message =
      structuredError?.error ||
      getMcpErrorMessage(result.content) ||
      "GenRTL knowledge search failed.";
    throw new Error(structuredError?.code ? `${message} (${structuredError.code})` : message);
  }
  if (!result.structuredContent) {
    throw new Error("GenRTL MCP response did not include structured knowledge results.");
  }
  return result.structuredContent as KnowledgeSearchResponse;
}
