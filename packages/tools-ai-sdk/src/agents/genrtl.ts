import { ToolLoopAgent, type ToolLoopAgentSettings, type ToolSet, stepCountIs } from "ai";
import { resolveLibraryId, queryDocs } from "@tools";
import { AGENT_PROMPT } from "@prompts";

/**
 * Configuration for GenRTL agent.
 */
export interface GenRTLAgentConfig extends ToolLoopAgentSettings<never, ToolSet> {
  /**
   * GenRTL API key. If not provided, uses the GENRTL_API_KEY environment variable.
   */
  apiKey?: string;
}

/**
 * GenRTL documentation search agent
 *
 * The agent follows a multi-step workflow:
 * 1. Resolves library names to GenRTL library IDs
 * 2. Fetches documentation for the resolved library
 * 3. Provides answers with code examples
 *
 * @example
 * ```typescript
 * import { GenRTLAgent } from '@upstash/genrtl-tools-ai-sdk';
 * import { anthropic } from '@ai-sdk/anthropic';
 *
 * const agent = new GenRTLAgent({
 *   model: anthropic('claude-sonnet-4-20250514'),
 *   apiKey: 'your-genrtl-api-key',
 * });
 *
 * const result = await agent.generate({
 *   prompt: 'How do I use React Server Components?',
 * });
 * ```
 */
export class GenRTLAgent extends ToolLoopAgent<never, ToolSet> {
  constructor(config: GenRTLAgentConfig) {
    const {
      model,
      stopWhen = stepCountIs(5),
      instructions,
      apiKey,

      tools,
      ...agentSettings
    } = config;

    const genrtlConfig = { apiKey };

    super({
      ...agentSettings,
      model,
      instructions: instructions || AGENT_PROMPT,
      tools: {
        ...tools,
        resolveLibraryId: resolveLibraryId(genrtlConfig),
        queryDocs: queryDocs(genrtlConfig),
      },
      stopWhen,
    });
  }
}
