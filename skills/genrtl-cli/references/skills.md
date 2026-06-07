# Skills Commands

Manage AI coding skills from the GenRTL registry. Skills are Markdown files that teach AI coding agents best practices, patterns, and workflows for specific libraries or tasks.

## Install

Install skills from any GitHub repository. Repository format is always `/owner/repo`.

```bash
grtl skills install /anthropics/skills           # Interactive — pick from a list
grtl skills install /anthropics/skills pdf        # Install a specific skill by name
grtl skills install /anthropics/skills --all      # Install everything without prompting
```

Target a specific IDE with a flag:
```bash
grtl skills install /anthropics/skills pdf --claude     # Claude Code only
grtl skills install /anthropics/skills pdf --cursor     # Cursor only
grtl skills install /anthropics/skills pdf --universal  # Universal (.agents/skills/)
grtl skills install /anthropics/skills --all --global   # All skills, global install
```

Alias: `grtl si /anthropics/skills pdf`

## Search

Find skills across the entire registry by keyword. Shows an interactive list with install counts and trust scores. Select to install.

```bash
grtl skills search pdf
grtl skills search typescript testing
grtl skills search react nextjs
```

Alias: `grtl ss pdf`

## Suggest

Auto-detects your project dependencies and recommends relevant skills from the registry.

```bash
grtl skills suggest           # Scan current project, install to project
grtl skills suggest --global  # Install suggestions globally
grtl skills suggest --claude  # Target Claude Code only
```

Reads `package.json`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`. Falls back to suggesting `grtl skills search` if no dependencies are detected.

Alias: `grtl ssg`

## Generate (AI-powered)

Generate a custom skill tailored to your stack using AI. **Requires login.**

```bash
grtl skills generate
grtl skills generate --claude   # Install directly to Claude Code
grtl skills generate --global   # Install to global skills
```

Interactive flow:
1. Describe the expertise you want (e.g., "OAuth authentication with NextAuth.js")
2. Select relevant libraries from search results
3. Answer 3 clarifying questions to focus the skill
4. Review the generated skill, request changes if needed
5. Choose where to install it

**Limits:** Free accounts get 6 generations/week, Pro accounts get 10.

Aliases: `grtl skills gen`, `grtl skills g`

## List

Show all installed skills for the current project or globally.

```bash
grtl skills list                  # Current project (all detected IDEs)
grtl skills list --claude         # Claude Code only
grtl skills list --global         # Global skills
grtl skills list --global --claude # Global Claude Code skills
```

## Remove

Uninstall a skill by name.

```bash
grtl skills remove pdf
grtl skills remove pdf --claude   # From Claude Code only
grtl skills remove pdf --global   # From global skills
```

Aliases: `grtl skills rm`, `grtl skills delete`

## Info

Browse all skills in a repository without installing — useful for previewing what's available.

```bash
grtl skills info /anthropics/skills
```

Output shows each skill name, description, and URL, plus quick install commands.

## IDE Flags

All skills commands accept these flags to target a specific AI coding assistant:

| Flag | Directory | Used by |
|------|-----------|---------|
| `--universal` | `.agents/skills/` | Amp, Codex, Gemini CLI, OpenCode, GitHub Copilot |
| `--claude` | `.claude/skills/` | Claude Code |
| `--cursor` | `.cursor/skills/` | Cursor |
| `--antigravity` | `.agent/skills/` | Antigravity |

Without a flag, the CLI prompts you to select one or more targets interactively.

Add `--global` to any flag to install in your home directory instead of the current project.
