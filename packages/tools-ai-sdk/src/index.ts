// Agents
export { GenRTLAgent, type GenRTLAgentConfig } from "@agents";

// Tools
export { resolveLibraryId, queryDocs, type GenRTLToolsConfig } from "@tools";

// Prompts
export {
  SYSTEM_PROMPT,
  AGENT_PROMPT,
  RESOLVE_LIBRARY_ID_DESCRIPTION,
  QUERY_DOCS_DESCRIPTION,
} from "@prompts";

// Re-export useful types from SDK
export type {
  GenRTLConfig,
  Library,
  Documentation,
  GetContextOptions,
} from "@upstash/genrtl-sdk";
