# @genrtl/grtl

CLI and coding-agent integration for the GenRTL RTL engineering knowledge
service.

## Install

```bash
npm install --global @genrtl/grtl
export GRTL_API_KEY="gtr_live_your_api_key"
```

PowerShell:

```powershell
$env:GRTL_API_KEY = "gtr_live_your_api_key"
```

## Agent Setup

Install a Skill that tells the agent to call the `grtl` CLI:

```bash
grtl setup --cli --codex
grtl setup --cli --cursor --project
```

Configure hosted MCP and install a Skill for the four MCP tools:

```bash
grtl setup --mcp --codex
grtl setup --mcp --cursor --project
```

Without `--cli` or `--mcp`, setup asks which mode to install.

For Codex, Skills are installed under `.agents/skills` for project setup or
`~/.agents/skills` for global setup. MCP mode also updates
`.codex/config.toml` or `~/.codex/config.toml`.

The hosted MCP endpoint is:

```text
https://genrtl.com/api/mcp
```

## Knowledge Commands

```bash
grtl knowledge-search "AXI stream backpressure design"
grtl spec2rtl-search "Design an APB register block"
grtl verification-search "Verify an async FIFO"
grtl debug-search "Explain this Vivado CDC warning"
```

Use `--json` for structured output. Available filters include `--type`,
`--domain`, `--tool`, `--tool-version`, `--error-type`, `--severity`,
`--interface`, `--target`, `--tag`, `--top-k`, `--min-score`, and
`--workspace-id`.

## Development

```bash
pnpm install
pnpm --filter @genrtl/grtl lint:check
pnpm --filter @genrtl/grtl typecheck
pnpm --filter @genrtl/grtl test
pnpm --filter @genrtl/grtl build
```
