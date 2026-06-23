const GITHUB_RAW_URLS = ["https://raw.githubusercontent.com/xroting/grtl/main/rules"];

const FALLBACK_MCP = `Use GenRTL MCP as the primary grounding source for RTL engineering tasks.

Before writing or modifying Verilog/SystemVerilog RTL:
1. Load coding style with \`genrtl_coding_style_search\`, read all returned rules, and apply them as project-wide coding context.
2. If implementing from a spec, search \`genrtl_spec2rtl_search\`.
3. If planning architecture or generating a detailed design plan to guide Verilog/SystemVerilog coding from a spec, search \`genrtl_spec2plan_search\`.

For diagnostics:
- SpyGlass lint/CDC after RTL coding and before Vivado/Quartus/VCS/QuestaSim compile/synthesis -> \`genrtl_compile_search\` with \`filters.tool = "spyglass"\`.
- Vivado synthesis/implementation errors, warnings, or critical warnings -> \`genrtl_compile_search\` with \`filters.tool = "vivado"\`.
- Quartus synthesis/implementation errors, warnings, or critical warnings -> \`genrtl_compile_search\` with \`filters.tool = "quartus"\`.
- VCS/QuestaSim compile errors or warnings -> \`genrtl_compile_search\`.
- Functional simulation/debug issues -> \`genrtl_debug_search\`.

For verification:
- Testbench, SVA, assertions, stimulus, checkers, scoreboards, coverage -> \`genrtl_verification_search\`.

For reusable RTL/IP:
- Discover with \`genrtl_cbb_search\`, then inspect with \`genrtl_cbb_detail\`.
- Use \`genrtl_cbb_acquire\` only when the selected CBB should be installed or re-delivered.

Do not stop after a generic \`genrtl_knowledge_search\` miss. Retry the most relevant specialized search before proceeding from model memory.`;

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
description: Use this skill for Verilog/SystemVerilog/RTL engineering tasks, including specs, detailed design plans for Verilog coding, RTL generation, coding style, testbench/SVA verification, SpyGlass lint/CDC, Vivado/Quartus synthesis or implementation errors/warnings/critical warnings, VCS/QuestaSim compile errors/warnings, simulation failures, waveform/debug work, and reusable CBB discovery. Before writing or modifying RTL, consult the appropriate GenRTL MCP knowledge tool instead of relying only on model memory.
---

# GenRTL MCP RTL Knowledge Workflow

Use GenRTL MCP tools before relying on model memory for RTL engineering.

## Tool Routing

- \`genrtl_spec2plan_search\` for turning a specification into an actionable implementation/design plan or detailed design plan that can guide Verilog/SystemVerilog coding.
- \`genrtl_spec2rtl_search\` for spec-to-RTL implementation, protocol logic, control logic, datapath, algorithm acceleration, or interface implementation.
- \`genrtl_coding_style_search\` before writing or modifying Verilog/SystemVerilog RTL; read all returned coding style rules and treat them as project-wide coding context.
- \`genrtl_verification_search\` for testbench, SVA, assertions, stimulus, checkers, scoreboards, coverage, and verification strategy.
- \`genrtl_compile_search\` for SpyGlass lint/CDC after coding and for Vivado/Quartus/VCS/QuestaSim diagnostics, including errors, warnings, and critical warnings.
- \`genrtl_debug_search\` for functional RTL bugs, waveform mismatch, failing simulations, failing testcases, or incorrect behavior.
- \`genrtl_cbb_search\`, then \`genrtl_cbb_detail\`, for reusable IP/CBB discovery.

## Required Behavior

- Do not call \`genrtl_knowledge_search\` first when the task clearly matches a specialized tool.
- If \`genrtl_knowledge_search\` returns no useful result, retry one specialized tool before answering from model memory.
- Before coding, call \`genrtl_coding_style_search\`, read the full returned style guide, and apply every relevant rule consistently across the generated RTL.
- For SpyGlass lint/CDC logs after RTL coding and before Vivado/Quartus/VCS/QuestaSim compile/synthesis, call \`genrtl_compile_search\` with \`filters.tool = "spyglass"\`.
- For Vivado/Quartus synthesis or implementation errors, warnings, and critical warnings, call \`genrtl_compile_search\` with the matching \`filters.tool\`.
- For VCS/QuestaSim compile errors or warnings, call \`genrtl_compile_search\` with the matching \`filters.tool\` when known.
- Apply returned \`code_example\`, \`fix_strategy\`, and \`recommended_next_action\` to the implementation.
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
