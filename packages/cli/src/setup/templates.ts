const GITHUB_RAW_URLS = ["https://raw.githubusercontent.com/xroting/grtl/main/rules"];

const FALLBACK_MCP = `Use GenRTL MCP tools for grounded RTL engineering knowledge.

Choose one tool:
- \`genrtl_knowledge_search\` for cross-domain RTL questions
- \`genrtl_spec2rtl_search\` for requirements and RTL design
- \`genrtl_verification_search\` for testbenches and verification
- \`genrtl_debug_search\` for lint, CDC, compile, synthesis, and RTL bugs

Pass the complete engineering question in \`query\`. Add filters only when useful.`;

const FALLBACK_CLI = `Use the \`grtl\` CLI for grounded RTL engineering knowledge.

Choose one command:
- \`npx grtl@latest knowledge-search "<query>"\`
- \`npx grtl@latest spec2rtl-search "<query>"\`
- \`npx grtl@latest verification-search "<query>"\`
- \`npx grtl@latest debug-search "<query>"\`

Pass the complete engineering question. Add filters such as \`--tool\`,
\`--tool-version\`, \`--target\`, \`--interface\`, or \`--tag\` when known.
If authentication fails, set \`GRTL_API_KEY\`.`;

const CURSOR_FRONTMATTER = `---\nalwaysApply: true\n---\n\n`;
const CODEX_CLI_SANDBOX_GUIDANCE = `Run GenRTL CLI requests outside Codex's default sandbox. If a GenRTL CLI command fails with DNS or network errors such as ENOTFOUND, host resolution failures, or fetch failed, rerun it outside the sandbox instead of retrying inside the sandbox.`;

export type RuleMode = "mcp" | "cli";

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
