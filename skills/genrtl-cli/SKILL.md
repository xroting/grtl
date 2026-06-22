---
name: genrtl-cli
description: Use the grtl CLI to configure GenRTL MCP and securely install reusable RTL CBBs. Do not use CLI commands for knowledge retrieval, CBB search, or CBB detail lookup; use GenRTL MCP tools for those operations.
---

# grtl CLI

The GenRTL CLI configures GenRTL MCP for editors and installs reusable RTL CBBs.
Knowledge retrieval, CBB search, and CBB detail lookup are intentionally MCP-only.

Make sure the CLI is up to date before running commands:

```bash
npm install -g @genrtl/grtl@latest
```

Or run directly without installing:

```bash
npx @genrtl/grtl@latest <command>
```

## Quick Reference

```bash
# Setup
GRTL_API_KEY=your_key grtl setup --mcp --codex --project
grtl setup --mcp

# Reusable RTL CBBs
grtl cbb install <cbb_id>@<version>
grtl cbb install <cbb_id>@<version> --target rtl/vendor/<name>
```

## CBB Installation

Use `grtl cbb install` only after a CBB has been selected from GenRTL MCP search
results. The CLI downloads, verifies SHA-256, and safely extracts the artifact.

Do not manually download or extract CBB ZIP files.

## Authentication

Set an API key via environment variable:

```bash
export GENRTL_API_KEY=your_key
```

or:

```bash
export GRTL_API_KEY=your_key
```

## Common Mistakes

- Use GenRTL MCP tools, not CLI commands, for knowledge retrieval.
- Use GenRTL MCP tools, not CLI commands, for CBB search or CBB detail lookup.
- Do not manually download or extract CBB ZIP files; `grtl cbb install` verifies SHA-256 and rejects unsafe paths.
