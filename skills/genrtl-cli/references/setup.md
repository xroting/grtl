# Setup

## grtl setup

One-time command to configure GenRTL for your AI coding agent. MCP server + Skill is the default setup mode:

- **MCP server** — registers the GenRTL MCP server so the agent can call tools natively
- **CLI + Skills** — installs a `find-docs` skill that guides the agent to use `grtl` CLI commands (no MCP required)

```bash
grtl setup                     # Interactive — uses MCP mode by default, then prompts for agent/install target
grtl setup --mcp               # MCP server mode (default)
grtl setup --cli               # Skip prompt, use CLI + Skills mode

# MCP mode — target a specific agent
grtl setup --claude            # Claude Code only
grtl setup --cursor            # Cursor only
grtl setup --opencode          # OpenCode only

# CLI + Skills mode — target a specific install location
grtl setup --cli --claude      # Claude Code (~/.claude/skills)
grtl setup --cli --cursor      # Cursor (~/.cursor/skills)
grtl setup --cli --universal   # Universal (~/.agents/skills)
grtl setup --cli --antigravity # Antigravity (~/.config/agent/skills)

grtl setup --project           # Configure current project instead of globally
grtl setup --yes               # Skip confirmation prompts
```

**Authentication options:**

```bash
grtl setup --api-key YOUR_KEY  # Use an existing API key (both MCP and CLI + Skills mode)
grtl setup --oauth             # OAuth endpoint — MCP mode only (IDE handles the auth flow)
```

Without `--api-key` or `--oauth`, setup opens a browser for OAuth login. MCP mode additionally generates a new API key after login. `--oauth` is MCP-only.

**What gets written — MCP mode:**

- MCP server entry in the agent's config file (`.mcp.json` for Claude, `.cursor/mcp.json` for Cursor, `.opencode.json` for OpenCode)
- A GenRTL rule file instructing the agent to use GenRTL for library docs
- A `genrtl-mcp` skill in the agent's skills directory

**What gets written — CLI + Skills mode:**

- A `find-docs` skill in the chosen agent's skills directory, guiding the agent to use `grtl library` and `grtl docs` commands
