import { Command, InvalidArgumentError } from "commander";
import pc from "picocolors";
import ora from "ora";

import { callGenrtlKnowledgeTool } from "../utils/knowledge-api.js";
import { log } from "../utils/logger.js";
import { trackEvent } from "../utils/tracking.js";
import type {
  GenrtlKnowledgeToolName,
  KnowledgeMatch,
  KnowledgeSearchInput,
  KnowledgeSearchResponse,
} from "../types.js";

const isTTY = process.stdout.isTTY;

interface KnowledgeCommandOptions {
  type?: string[];
  domain?: string;
  tool?: string;
  toolVersion?: string;
  errorType?: string;
  severity?: string;
  interface?: string;
  target?: "fpga" | "asic" | "both";
  tag?: string[];
  topK?: number;
  minScore?: number;
  workspaceId?: string;
  json?: boolean;
}

const TOOL_COMMANDS: Array<{
  name: GenrtlKnowledgeToolName;
  alias: string;
  description: string;
}> = [
  {
    name: "genrtl_knowledge_search",
    alias: "knowledge-search",
    description: "Search all approved GenRTL knowledge cards",
  },
  {
    name: "genrtl_spec2rtl_search",
    alias: "spec2rtl-search",
    description: "Search Spec2RTL knowledge cards",
  },
  {
    name: "genrtl_verification_search",
    alias: "verification-search",
    description: "Search verification and testbench knowledge cards",
  },
  {
    name: "genrtl_debug_search",
    alias: "debug-search",
    description: "Search lint, CDC, compile, synthesis, and RTL debug knowledge cards",
  },
];

function parseInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new InvalidArgumentError("Expected an integer.");
  }
  return parsed;
}

function parseNumber(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new InvalidArgumentError("Expected a number.");
  }
  return parsed;
}

export function buildKnowledgeSearchInput(
  query: string,
  options: KnowledgeCommandOptions
): KnowledgeSearchInput {
  if (options.topK !== undefined && (options.topK < 1 || options.topK > 20)) {
    throw new InvalidArgumentError("--top-k must be between 1 and 20.");
  }
  if (options.minScore !== undefined && (options.minScore < 0 || options.minScore > 1)) {
    throw new InvalidArgumentError("--min-score must be between 0 and 1.");
  }
  if (options.target && !["fpga", "asic", "both"].includes(options.target)) {
    throw new InvalidArgumentError("--target must be fpga, asic, or both.");
  }

  const filters: NonNullable<KnowledgeSearchInput["filters"]> = {};
  if (options.type?.length) {
    const allowed = new Set(["spec2rtl", "verification", "debug"]);
    const invalid = options.type.find((type) => !allowed.has(type));
    if (invalid) {
      throw new InvalidArgumentError(`Invalid knowledge type: ${invalid}`);
    }
    filters.types = options.type as NonNullable<KnowledgeSearchInput["filters"]>["types"];
  }
  if (options.domain) filters.domain = options.domain;
  if (options.tool) filters.tool = options.tool;
  if (options.toolVersion) filters.tool_version = options.toolVersion;
  if (options.errorType) filters.error_type = options.errorType;
  if (options.severity) filters.severity = options.severity;
  if (options.interface) filters.interface = options.interface;
  if (options.target) filters.target = options.target;
  if (options.tag?.length) filters.tags = options.tag;

  return {
    query,
    ...(Object.keys(filters).length > 0 ? { filters } : {}),
    ...(options.topK !== undefined ? { top_k: options.topK } : {}),
    ...(options.minScore !== undefined ? { min_score: options.minScore } : {}),
    ...(options.workspaceId ? { workspace_id: options.workspaceId } : {}),
  };
}

function formatMatch(match: KnowledgeMatch, index: number): string {
  const lines = [
    `${pc.dim(`${index + 1}.`)} ${pc.bold(match.title)} ${pc.cyan(`[${match.type}]`)}`,
    `   ${pc.dim(`Confidence: ${Math.round(match.confidence * 100)}%`)}`,
    `   ${match.summary}`,
  ];
  if (match.root_cause) lines.push(`   ${pc.bold("Root cause:")} ${match.root_cause}`);
  if (match.fix_strategy?.length) {
    lines.push(`   ${pc.bold("Fix strategy:")} ${match.fix_strategy.join("; ")}`);
  }
  if (match.code_example) {
    lines.push("", "```systemverilog", match.code_example, "```");
  }
  if (match.recommended_next_action) {
    lines.push(`   ${pc.bold("Next:")} ${match.recommended_next_action}`);
  }
  return lines.join("\n");
}

async function searchCommand(
  toolName: GenrtlKnowledgeToolName,
  query: string,
  options: KnowledgeCommandOptions
): Promise<void> {
  trackEvent("command", { name: toolName });
  const spinner = isTTY ? ora("Searching GenRTL knowledge...").start() : null;
  try {
    const input = buildKnowledgeSearchInput(query, options);
    const result = await callGenrtlKnowledgeTool(toolName, input);
    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    printKnowledgeResult(result);
  } catch (err) {
    spinner?.fail(`Error: ${err instanceof Error ? err.message : String(err)}`);
    if (!spinner) log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

function printKnowledgeResult(result: KnowledgeSearchResponse): void {
  log.blank();
  log.plain(pc.bold(result.summary));
  log.blank();

  if (result.matched_cards.length === 0) {
    log.warn("No matching GenRTL knowledge cards were found.");
  } else {
    result.matched_cards.forEach((match, index) => {
      log.plain(formatMatch(match, index));
      log.blank();
    });
  }
  if (result.recommended_next_action) {
    log.plain(`${pc.bold("Recommended next action:")} ${result.recommended_next_action}`);
    log.blank();
  }
}

function addSearchOptions(command: Command): Command {
  return command
    .argument("<query>", "Natural-language RTL engineering question or diagnostic")
    .option("--type <type...>", "Knowledge types: spec2rtl, verification, debug")
    .option("--domain <domain>", "Filter by engineering domain")
    .option("--tool <tool>", "Filter by EDA tool")
    .option("--tool-version <version>", "Filter by EDA tool version")
    .option("--error-type <type>", "Filter by error type")
    .option("--severity <severity>", "Filter by severity")
    .option("--interface <interface>", "Filter by hardware interface")
    .option("--target <target>", "Filter by target: fpga, asic, or both")
    .option("--tag <tag...>", "Filter by one or more tags")
    .option("--top-k <count>", "Maximum results (1-20)", parseInteger)
    .option("--min-score <score>", "Minimum similarity score (0-1)", parseNumber)
    .option("--workspace-id <id>", "GenRTL workspace ID")
    .option("--json", "Output the structured MCP result as JSON");
}

export function registerKnowledgeCommands(program: Command): void {
  for (const tool of TOOL_COMMANDS) {
    const command = program.command(tool.name).alias(tool.alias).description(tool.description);
    addSearchOptions(command).action(async (query: string, options: KnowledgeCommandOptions) => {
      await searchCommand(tool.name, query, options);
    });
  }
}
