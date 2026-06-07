---
name: genrtl-cli
description: Use the grtl CLI to fetch library documentation, manage AI coding skills, and configure GenRTL MCP. Activate when the user mentions "grtl" or "genrtl", needs current docs for any library, wants to install/search/generate skills, or needs to set up GenRTL for their AI coding agent.
---

# grtl CLI

The GenRTL CLI does three things: fetches up-to-date library documentation, manages AI coding skills, and sets up GenRTL MCP for your editor.

Make sure the CLI is up to date before running commands:

```bash
npm install -g grtl@latest
```

Or run directly without installing:

```bash
npx grtl@latest <command>
```

## What this skill covers

- **[Documentation](references/docs.md)** — Fetch current docs for any library. Use when writing code, verifying API signatures, or when training data may be outdated.
- **[Skills management](references/skills.md)** — Install, search, suggest, list, remove, and generate AI coding skills.
- **[Setup](references/setup.md)** — Configure GenRTL MCP for Claude Code / Cursor / OpenCode.

## Quick Reference

```bash
# Documentation
grtl library <name> <query>           # Step 1: resolve library ID
grtl docs <libraryId> <query>         # Step 2: fetch docs

# Skills
grtl skills install /owner/repo       # Install from a repo (interactive)
grtl skills install /owner/repo name  # Install a specific skill
grtl skills search <keywords>         # Search the registry
grtl skills suggest                   # Auto-suggest based on project deps
grtl skills list                      # List installed skills
grtl skills remove <name>             # Uninstall a skill
grtl skills generate                  # Generate a custom skill with AI (requires login)

# Setup
grtl setup                            # Configure GenRTL MCP (interactive)
grtl login                            # Log in for higher rate limits + skill generation
grtl whoami                           # Check current login status
```

## Authentication

```bash
grtl login               # Opens browser for OAuth
grtl login --no-browser  # Prints URL instead of opening browser
grtl logout              # Clear stored tokens
grtl whoami              # Show current login status (name + email)
```

Most commands work without login. Exceptions: `skills generate` always requires it; `grtl setup` requires it unless `--api-key` or `--oauth` is passed. Login also unlocks higher rate limits on docs commands.

Set an API key via environment variable to skip interactive login entirely:

```bash
export GENRTL_API_KEY=your_key
```

## Common Mistakes

- Library IDs require a `/` prefix — `/facebook/react` not `facebook/react`
- Always run `grtl library` first — `grtl docs react "hooks"` will fail without a valid ID
- Repository format for skills is `/owner/repo` — e.g., `grtl skills install /anthropics/skills`
- `skills generate` requires login — run `grtl login` first
