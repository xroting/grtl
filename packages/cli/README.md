# grtl

Command-line client for the GenRTL RTL engineering knowledge service.

## Requirements

- Node.js 20.12 or newer
- A GenRTL API key

## Installation

```bash
npm install --global grtl
```

Set the API key in your environment:

```bash
export GRTL_API_KEY="gtr_live_your_api_key"
```

PowerShell:

```powershell
$env:GRTL_API_KEY = "gtr_live_your_api_key"
```

`GENRTL_API_KEY` is also supported.

## Knowledge Tools

The CLI exposes the same four tools as the hosted GenRTL MCP server:

```bash
grtl genrtl_knowledge_search "How should this AXI stream handle backpressure?"
grtl genrtl_spec2rtl_search "Implement an APB register block with byte enables"
grtl genrtl_verification_search "Build a self-checking testbench for an async FIFO"
grtl genrtl_debug_search "Explain this Vivado CDC warning and suggest a safe fix"
```

Short aliases are available:

```bash
grtl knowledge-search "..."
grtl spec2rtl-search "..."
grtl verification-search "..."
grtl debug-search "..."
```

Search options include `--type`, `--domain`, `--tool`, `--tool-version`,
`--error-type`, `--severity`, `--interface`, `--target`, `--tag`, `--top-k`,
`--min-score`, `--workspace-id`, and `--json`.

Example:

```bash
grtl debug-search "FSM hangs after reset" \
  --tool Vivado \
  --target fpga \
  --tag reset fsm \
  --top-k 8 \
  --json
```

## Agent Setup

Configure the hosted HTTP MCP endpoint for a supported coding agent:

```bash
grtl setup --cursor
grtl setup --codex --project
grtl setup --claude --opencode
```

Supported agent flags are `--claude`, `--cursor`, `--codex`, `--opencode`,
`--gemini`, and `--antigravity`. Without a flag, `grtl setup` presents an
interactive selection.

The API key is written to the selected agent's MCP configuration because the
agent must send it as a Bearer token. Protect that configuration file and do
not commit project-level MCP configuration containing a real key.

The default endpoint is:

```text
https://www.genrtl.com/api/mcp
```

Use `--base-url` for another deployment:

```bash
grtl --base-url http://localhost:3005 setup --cursor --project
grtl --base-url http://localhost:3005 debug-search "compile error"
```

## Development

```bash
pnpm install
pnpm --filter grtl lint:check
pnpm --filter grtl typecheck
pnpm --filter grtl test
pnpm --filter grtl build
```

This project is derived from Upstash Context7 and retains its MIT license.
