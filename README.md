# grtl

**AI RTL agents are only as good as the hardware knowledge they can access.**

`grtl` connects your AI coding assistant to the GenRTL knowledge service — a domain-specific RTL knowledge base for Verilog, SystemVerilog, FPGA, ASIC, lint, CDC, synthesis, compile errors, reusable CBB components, and real-world RTL bug patterns.

Use it with Cursor and other MCP-compatible AI coding tools.

```bash
npm install -g grtl
grtl setup
```

Then ask your AI assistant to use GenRTL knowledge while designing, reviewing, or debugging RTL.

---

## ❌ Without grtl

General-purpose LLMs often know how to write code, but they do not reliably understand your project-specific RTL design rules, toolchain errors, company CBB libraries, or silicon-proven hardware patterns.

You get:

* ❌ Generic Verilog/SystemVerilog answers that ignore your design methodology
* ❌ Hallucinated RTL fixes that compile but break timing, CDC, or reset behavior
* ❌ Weak explanations for synthesis, lint, simulation, and CDC errors
* ❌ No access to your reusable CBB/component knowledge
* ❌ No memory of typical bugs already solved by your team
* ❌ Time wasted copying error logs, tool messages, and design rules into prompts
* ❌ AI suggestions that look plausible but are unsafe for FPGA/ASIC implementation

---

## ✅ With grtl

`grtl` connects your AI coding agent to the GenRTL knowledge service through MCP.

Your AI assistant can retrieve domain-specific, up-to-date RTL knowledge directly inside the coding workflow.

You get:

* ✅ RTL-aware answers grounded in GenRTL knowledge bases
* ✅ Better compile, synthesis, lint, and CDC error explanations
* ✅ Access to reusable CBB/component design knowledge
* ✅ Typical RTL bug patterns and proven fixes
* ✅ More accurate Verilog/SystemVerilog debugging
* ✅ Safer AI-assisted FPGA/ASIC design reviews
* ✅ Less prompt copy-paste, more agentic hardware design workflow

Instead of asking a generic LLM:

```text
Why does this Verilog code fail?
```

you can ask:

```text
Use GenRTL knowledge to explain this compile error and suggest a safe RTL fix.
```

---

## What is grtl?

`grtl` is a CLI and MCP setup tool for GenRTL.

It helps you install and configure the GenRTL MCP server in local AI coding tools such as Cursor.

The GenRTL MCP server exposes RTL knowledge tools to your AI assistant, so the agent can search specialized knowledge bases during coding, review, and debugging.

---

## What can GenRTL knowledge include?

GenRTL knowledge can be organized into multiple hardware design knowledge bases:

* CBB/component library
* Compile error knowledge base
* Synthesis error and warning knowledge base
* Typical RTL bug knowledge base
* Lint rule knowledge base
* CDC rule knowledge base
* Reset design knowledge
* FPGA/ASIC design methodology
* Verilog/SystemVerilog coding rules
* Simulation and testbench debugging knowledge
* Internal design guidelines
* Project-specific hardware documentation

---

## Installation

Install globally with npm:

```bash
npm install -g grtl
```

Or run directly with npx:

```bash
npx grtl setup
```

Check installation:

```bash
grtl --version
```

---

## Quick Start

Run:

```bash
grtl setup
```

`grtl setup` will help configure the GenRTL MCP server for your local AI coding tool.

For Cursor, it generates or updates an MCP configuration similar to:

```json
{
  "mcpServers": {
    "genrtl-knowledge": {
      "url": "https://www.genrtl.com/api/mcp",
      "headers": {
        "Authorization": "Bearer gtr_live_your_api_key_here"
      }
    }
  }
}
```

After setup, restart Cursor or reload MCP servers from Cursor settings.

---

## Manual Cursor Setup

If you prefer manual configuration, add this MCP server to Cursor:

```json
{
  "mcpServers": {
    "genrtl-knowledge": {
      "url": "https://www.genrtl.com/api/mcp",
      "headers": {
        "Authorization": "Bearer gtr_live_your_api_key_here"
      }
    }
  }
}
```

Replace `gtr_live_your_api_key_here` with your GenRTL API key.

---

## Usage Examples

### Compile error fixing

Ask your AI coding assistant:

```text
Use GenRTL knowledge to explain this Verilog compile error and provide a safe fix.
```

### Lint warning review

```text
Use GenRTL lint knowledge to explain these warnings. Tell me which ones must be fixed and which ones may be waived.
```

### CDC review

```text
Use GenRTL CDC knowledge to review this async FIFO and identify unsafe clock-domain crossings.
```

### CBB/component reuse

```text
Search GenRTL CBB knowledge for a reusable AXI-stream FIFO component.
```

### RTL bug diagnosis

```text
Use GenRTL typical bug knowledge to analyze why this FSM may hang after reset.
```

### Synthesis warning explanation

```text
Use GenRTL synthesis knowledge to explain this inferred latch warning and suggest a hardware-safe rewrite.
```

---

## Commands

### `grtl setup`

Configure GenRTL MCP integration.

```bash
grtl setup
```

Optional:

```bash
grtl setup --client cursor
```

---

### `grtl login`

Save your GenRTL API key locally.

```bash
grtl login
```

You can also provide the API key through an environment variable:

```bash
export GRTL_API_KEY=gtr_live_your_api_key_here
```

Windows PowerShell:

```powershell
$env:GRTL_API_KEY="gtr_live_your_api_key_here"
```

---

### GenRTL knowledge search

The CLI exposes the same four tools as the GenRTL MCP server:

```bash
grtl knowledge-search "How should AXI stream backpressure be implemented?"
grtl spec2rtl-search "Implement an APB register block with byte enables"
grtl verification-search "Create a self-checking async FIFO testbench"
grtl debug-search "Explain this Vivado CDC warning and suggest a safe fix"
```

The exact MCP tool names are also valid CLI commands:

```bash
grtl genrtl_knowledge_search "<query>"
grtl genrtl_spec2rtl_search "<query>"
grtl genrtl_verification_search "<query>"
grtl genrtl_debug_search "<query>"
```

Use `--json` for structured output. Filters include `--domain`, `--tool`,
`--tool-version`, `--error-type`, `--severity`, `--interface`, `--target`,
`--tag`, `--top-k`, `--min-score`, and `--workspace-id`.

---

## Remote MCP Mode

Recommended for Cursor:

```json
{
  "mcpServers": {
    "genrtl-knowledge": {
      "url": "https://www.genrtl.com/api/mcp",
      "headers": {
        "Authorization": "Bearer gtr_live_your_api_key_here"
      }
    }
  }
}
```

Use remote MCP mode when:

* You want the simplest setup
* Your GenRTL MCP server is already deployed
* You do not need to run a local bridge process

---

## Authentication

GenRTL uses Bearer token authentication:

```http
Authorization: Bearer gtr_live_your_api_key_here
```

You can configure your token through:

1. `grtl setup`
2. `grtl login`
3. `GRTL_API_KEY` environment variable
4. Manual MCP configuration

Do not commit API keys to Git.

---

## Example Agent Workflow

Without GenRTL knowledge:

```text
User: Fix this CDC issue.
AI: You can use two flip-flops.
```

With GenRTL knowledge:

```text
User: Use GenRTL CDC knowledge to review this module.

AI:
- This signal is multi-bit and cannot be synchronized with independent two-flop synchronizers.
- Use a handshake, async FIFO, or Gray-coded pointer depending on the transfer type.
- The reset release should also be checked across both clock domains.
- Here is a safer RTL rewrite...
```

---

## Why grtl matters for hardware engineers

Software coding agents can often rely on public package documentation.

RTL design is different.

Hardware design knowledge is often hidden in:

* Internal design guidelines
* Reusable IP/CBB libraries
* Lint waiver rules
* CDC methodology documents
* Synthesis tool error histories
* Simulation debug notes
* Project-specific architecture decisions
* Past silicon bug reports

`grtl` brings this knowledge into the AI agent workflow.

The goal is not just to generate Verilog.

The goal is to help AI agents generate, review, and debug RTL with hardware engineering context.

---

## Troubleshooting

### `grtl: command not found`

Make sure the package is installed globally:

```bash
npm install -g grtl
```

Check npm global binary path:

```bash
npm bin -g
```

---

### Missing API key

Set your API key:

```bash
export GRTL_API_KEY=gtr_live_your_api_key_here
```

Or run:

```bash
grtl login
```

---

### Cursor does not show GenRTL tools

Check:

1. Cursor MCP configuration is valid JSON
2. The MCP server name is `genrtl-knowledge`
3. The API key is valid
4. Cursor has been restarted or MCP servers have been reloaded
5. `https://www.genrtl.com/api/mcp` is reachable from your machine

---

### Network or proxy issue

If you are behind a proxy:

```bash
export HTTPS_PROXY=http://127.0.0.1:7890
export HTTP_PROXY=http://127.0.0.1:7890
```

Windows PowerShell:

```powershell
$env:HTTPS_PROXY="http://127.0.0.1:7890"
$env:HTTP_PROXY="http://127.0.0.1:7890"
```

---

## Security Notes

* Keep your GenRTL API key private
* Do not paste API keys into public issues or screenshots
* Do not commit `.grtl/config.json`
* Use different API keys for development and production
* Rotate keys if they are exposed

---

## Development

Clone the repository:

```bash
git clone https://github.com/genrtl/grtl.git
cd grtl
```

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Link locally:

```bash
npm link
```

Test:

```bash
grtl --version
grtl --help
grtl debug-search --help
```

---

## Recommended package.json

```json
{
  "name": "grtl",
  "version": "0.1.0",
  "description": "GenRTL CLI and MCP setup tool for RTL knowledge retrieval",
  "type": "module",
  "bin": {
    "grtl": "./dist/cli.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli.ts",
    "prepublishOnly": "npm run build"
  },
  "engines": {
    "node": ">=18"
  },
  "license": "MIT"
}
```

Your CLI entry file should start with:

```javascript
#!/usr/bin/env node
```

---

## Publishing

Preview package contents:

```bash
npm pack --dry-run
```

Publish:

```bash
npm publish
```

If using a scoped package:

```bash
npm publish --access public
```

Users can install it with:

```bash
npm install -g @genrtl/grtl
```

The command can still be:

```bash
grtl setup
```

as long as the package `bin` field maps `grtl` to your CLI entry file.

---

## License

MIT

---

## About GenRTL

GenRTL is an AI-powered RTL design environment for FPGA and ASIC engineers.

It helps hardware engineers with:

* RTL generation
* Verilog/SystemVerilog debugging
* Compile error fixing
* Lint and CDC analysis
* Reusable component discovery
* AI-assisted FPGA/ASIC development
* Domain-specific hardware design knowledge retrieval
