# grtl

`grtl` configures AI coding agents for GenRTL MCP and installs reusable RTL
CBB artifacts. Knowledge retrieval, CBB search, and CBB detail lookup are
supported through hosted GenRTL MCP tools only; the CLI no longer exposes search
or detail commands.

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

## CLI Use

The CLI is intentionally limited to agent setup and reusable RTL CBB installation.
It does not provide knowledge search, CBB search, or CBB detail lookup commands.
Use MCP mode for retrieval.

```bash
grtl setup --mcp --codex
grtl cbb install cbb_uart@1.2.0
```

The coding agent or shell must inherit `GRTL_API_KEY` or `GENRTL_API_KEY` when it
runs setup or installs CBBs.

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

Run `grtl setup` without a mode to choose setup options interactively:

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

## Knowledge Retrieval

Knowledge retrieval, CBB search, and CBB detail lookup are MCP-only. Configure
GenRTL MCP for your agent instead of using CLI search commands.

Use `--base-url` for another GenRTL deployment when setting up MCP:

```bash
grtl --base-url http://localhost:3005 setup --mcp --codex --project
```

## Codex Verification

After setup, restart Codex and ask:

```text
Use GenRTL to find safe implementation guidance for an AD7606 controller.
```

The agent should invoke one of these MCP tools:

- `genrtl_knowledge_search`
- `genrtl_spec2rtl_search`
- `genrtl_spec2plan_search`
- `genrtl_verification_search`
- `genrtl_compile_search`
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
