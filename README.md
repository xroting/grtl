# grtl

`grtl` gives AI coding agents access to GenRTL's RTL engineering knowledge in
two supported ways:

1. CLI mode: the agent invokes the installed `grtl` command.
2. MCP mode: the agent invokes the four hosted GenRTL MCP tools.

Both setup modes install an agent Skill that explains when and how to use
GenRTL.

## Installation

Requirements:

- Node.js 20.12 or newer
- A GenRTL API key

```bash
npm install --global @genrtl/grtl
grtl --version
```

Set the API key:

```bash
export GRTL_API_KEY="gtr_live_your_api_key"
```

PowerShell:

```powershell
$env:GRTL_API_KEY = "gtr_live_your_api_key"
```

`GENRTL_API_KEY` is also supported.

## CLI Mode

CLI mode installs a `genrtl-cli` Skill. The Skill instructs the coding agent to
run the four `grtl` search commands directly.

```bash
grtl setup --cli --codex
grtl setup --cli --cursor --project
```

Codex global setup installs:

```text
~/.agents/skills/genrtl-cli/SKILL.md
~/.codex/AGENTS.md
```

Codex project setup installs:

```text
.agents/skills/genrtl-cli/SKILL.md
AGENTS.md
```

The coding agent must inherit `GRTL_API_KEY` or `GENRTL_API_KEY` when it runs.

## MCP Mode

MCP mode configures the hosted MCP endpoint and installs a `genrtl-mcp` Skill.

```bash
grtl setup --mcp --codex
grtl setup --mcp --cursor --project
```

Codex global setup installs or updates:

```text
~/.codex/config.toml
~/.agents/skills/genrtl-mcp/SKILL.md
~/.codex/AGENTS.md
```

Codex project setup installs or updates:

```text
.codex/config.toml
.agents/skills/genrtl-mcp/SKILL.md
AGENTS.md
```

The hosted endpoint is:

```text
https://genrtl.com/api/mcp
```

Do not use `https://www.genrtl.com/api/mcp`; its cross-host redirect can remove
the `Authorization` header.

## Interactive Setup

Run `grtl setup` without a mode to choose CLI or MCP interactively:

```bash
grtl setup
```

Supported agents:

- Claude Code
- Cursor
- OpenCode
- Codex
- Antigravity
- Gemini CLI

Use `--project` for project-local configuration. Without it, setup installs to
the user profile.

## Knowledge Commands

The CLI exposes the same four operations as the MCP server:

```bash
grtl knowledge-search "How should AXI stream backpressure be implemented?"
grtl spec2rtl-search "Design an APB register block with byte enables"
grtl verification-search "Verify an asynchronous FIFO"
grtl debug-search "Explain this Vivado CDC warning"
```

The exact MCP tool names are also valid CLI commands:

```bash
grtl genrtl_knowledge_search "<query>"
grtl genrtl_spec2rtl_search "<query>"
grtl genrtl_verification_search "<query>"
grtl genrtl_debug_search "<query>"
```

Use `--json` for structured output. Filters include:

```text
--type --domain --tool --tool-version --error-type --severity
--interface --target --tag --top-k --min-score --workspace-id
```

Example:

```bash
grtl debug-search "FSM hangs after reset" \
  --tool Vivado \
  --target fpga \
  --tag reset fsm \
  --top-k 8 \
  --json
```

## Codex Verification

After setup, restart Codex and ask:

```text
Use GenRTL to find safe implementation guidance for an AD7606 controller.
```

CLI mode should invoke a `grtl ...-search` command. MCP mode should invoke one
of these tools:

- `genrtl_knowledge_search`
- `genrtl_spec2rtl_search`
- `genrtl_verification_search`
- `genrtl_debug_search`

Verify installed files:

```powershell
Get-ChildItem $HOME\.agents\skills\genrtl-* -Recurse
Get-Content $HOME\.codex\config.toml
Get-Content $HOME\.codex\AGENTS.md
```

## Custom Deployment

Use `--base-url` for another GenRTL deployment:

```bash
grtl --base-url http://localhost:3005 setup --mcp --codex --project
grtl --base-url http://localhost:3005 debug-search "compile error"
```

## Development

```bash
pnpm install
pnpm --filter @genrtl/grtl lint:check
pnpm --filter @genrtl/grtl typecheck
pnpm --filter @genrtl/grtl test
pnpm --filter @genrtl/grtl build
```

This project is derived from Upstash Context7 and retains its MIT license.

## License

MIT
