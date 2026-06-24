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

Configure hosted MCP and install the MCP-oriented Skill for your coding agent:

```bash
grtl setup --codex
grtl setup --cursor --project
```

MCP + Skill is the default setup mode. Use `--cli` only when you explicitly want
the CLI-only Skill. Knowledge retrieval, CBB search, and CBB detail lookup are
supported through MCP tools only, not through CLI commands.

Installing a newer npm package does not modify Skills already written to an
agent configuration directory. Run setup again after an upgrade to refresh the
Skill.

For Codex, Skills are installed under `.agents/skills` for project setup or
`~/.agents/skills` for global setup. MCP mode also updates
`.codex/config.toml` or `~/.codex/config.toml`.

The hosted MCP endpoint is:

```text
https://genrtl.com/api/mcp
```

## CBB Installation

Install an exact reusable RTL CBB version into the current project:

```bash
grtl cbb install cbb_uart@1.2.0
grtl cbb install cbb_uart@1.2.0 --target rtl/vendor/uart
```

The command calls the hosted `genrtl_cbb_acquire` MCP tool with
`GRTL_API_KEY`, downloads the short-lived ZIP artifact, verifies its size and
SHA-256, safely extracts it, and atomically installs it. The default target is
`rtl/cbb/<cbb_id>_<version>`.

Installed packages are recorded in `.genrtl/cbb-lock.json`. Existing targets
are left untouched unless `--force` is provided; replacement occurs only after
the new archive has been fully verified and extracted. Use `--json` for
machine-readable output.

## Development

```bash
pnpm install
pnpm --filter @genrtl/grtl lint:check
pnpm --filter @genrtl/grtl typecheck
pnpm --filter @genrtl/grtl test
pnpm --filter @genrtl/grtl build
```
