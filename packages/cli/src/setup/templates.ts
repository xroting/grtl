const GITHUB_RAW_URLS = ["https://raw.githubusercontent.com/xroting/grtl/main/rules"];

const FALLBACK_MCP = `Use GenRTL MCP tools for grounded RTL engineering knowledge.

Choose one tool:
- \`genrtl_knowledge_search\` for cross-domain RTL questions
- \`genrtl_spec2rtl_search\` for requirements and RTL design
- \`genrtl_spec2plan_search\` for implementation planning from a specification
- \`genrtl_verification_search\` for testbenches and verification
- \`genrtl_compile_search\` for lint, CDC, compile, synthesis, implementation, and simulator diagnostics
- \`genrtl_debug_search\` for issue descriptions, erroneous code, solutions, and corrected RTL

Pass the complete engineering question in \`query\`. Add filters only when useful.`;

const FALLBACK_CLI = `Use the \`grtl\` CLI to configure GenRTL MCP and install reusable RTL CBBs.

Knowledge retrieval is available through GenRTL MCP tools only. Do not use CLI
commands for knowledge search, CBB search, or CBB detail lookup.

To install a reusable RTL block into the current project:
- \`npx @genrtl/grtl@latest cbb install <cbb_id>@<version>\`
- Add \`--target <relative-dir>\` only when a non-default install path is needed.

Do not download or extract CBB artifacts manually; the CLI verifies SHA-256 and
rejects unsafe ZIP paths. If authentication fails, set \`GRTL_API_KEY\` or
\`GENRTL_API_KEY\` in the coding agent's environment.`;

const CURSOR_FRONTMATTER = `---\nalwaysApply: true\n---\n\n`;
const CODEX_CLI_SANDBOX_GUIDANCE = `Run GenRTL CLI requests outside Codex's default sandbox. If a GenRTL CLI command fails with DNS or network errors such as ENOTFOUND, host resolution failures, or fetch failed, rerun it outside the sandbox instead of retrying inside the sandbox.`;

export type RuleMode = "mcp" | "cli";

const MCP_SKILL = `---
name: genrtl-mcp
description: Use GenRTL MCP tools for grounded RTL design, verification, compile/synthesis diagnostics, debugging, and coding style knowledge.
---

# GenRTL MCP

Use this skill when an RTL engineering task needs grounded GenRTL knowledge.

Choose exactly one MCP tool:

- \`genrtl_knowledge_search\` for cross-domain RTL questions.
- \`genrtl_spec2rtl_search\` for requirements, protocols, control logic, or algorithm-to-RTL work.
- \`genrtl_spec2plan_search\` for turning a specification into an actionable implementation plan.
- \`genrtl_verification_search\` for testbenches and verification.
- \`genrtl_compile_search\` for lint, CDC, compile, synthesis, implementation, or simulator diagnostics.
- \`genrtl_debug_search\` for issue descriptions, erroneous code, solutions, and corrected RTL.

Pass the complete engineering question in \`query\`. Add \`filters\`, \`top_k\`,
\`min_score\`, or \`workspace_id\` only when useful.
`;

const CLI_SKILL = `---
name: genrtl-cli
description: Use the grtl CLI to configure GenRTL MCP and securely install reusable RTL CBBs.
---

# GenRTL CLI

Use this skill only for GenRTL MCP setup and reusable RTL CBB installation.
Knowledge retrieval, CBB search, and CBB detail lookup are available through
GenRTL MCP tools only, not through CLI commands.

For a CBB selected from GenRTL MCP search results:

- \`grtl cbb install <cbb_id>@<version>\` downloads, verifies, and safely extracts it.
- Add \`--target <relative-dir>\` only when the user requests a specific project path.
- Do not download or extract the artifact manually; the CLI verifies SHA-256 and prevents unsafe ZIP paths.

The CLI requires \`GRTL_API_KEY\` or \`GENRTL_API_KEY\` in its environment.
`;

export function getSkillContent(mode: RuleMode): string {
  return mode === "mcp" ? MCP_SKILL : CLI_SKILL;
}

async function fetchRule(filename: string, fallback: string): Promise<string> {
  for (const base of GITHUB_RAW_URLS) {
    try {
      const res = await fetch(`${base}/${filename}`);
      if (res.ok) return await res.text();
    } catch {
      continue;
    }
  }
  return fallback;
}

export async function getRuleContent(mode: RuleMode, agent: string): Promise<string> {
  const [filename, fallback] =
    mode === "mcp" ? ["genrtl-mcp.md", FALLBACK_MCP] : ["genrtl-cli.md", FALLBACK_CLI];
  let body = await fetchRule(filename, fallback);

  if (mode === "cli" && agent === "codex" && !body.includes(CODEX_CLI_SANDBOX_GUIDANCE)) {
    body = `${body.trimEnd()}\n${CODEX_CLI_SANDBOX_GUIDANCE}\n`;
  }

  return agent === "cursor" ? `${CURSOR_FRONTMATTER}${body}` : body;
}

export function customizeSkillFilesForAgent(
  agent: string,
  skillName: string,
  files: Array<{ path: string; content: string }>
): Array<{ path: string; content: string }> {
  if (agent !== "codex" || skillName !== "find-docs") {
    return files;
  }

  return files.map((file) => {
    if (file.path !== "SKILL.md" || file.content.includes(CODEX_CLI_SANDBOX_GUIDANCE)) {
      return file;
    }

    const marker = "## Step 1: Resolve a Library";
    const guidance = `${CODEX_CLI_SANDBOX_GUIDANCE}\n\n`;

    if (file.content.includes(marker)) {
      return {
        ...file,
        content: file.content.replace(marker, `${guidance}${marker}`),
      };
    }

    const separator = file.content.endsWith("\n") ? "\n" : "\n\n";
    return {
      ...file,
      content: `${file.content}${separator}${CODEX_CLI_SANDBOX_GUIDANCE}\n`,
    };
  });
}
