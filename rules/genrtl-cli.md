Use the `grtl` CLI only to configure GenRTL MCP or install a reusable CBB into
the user's local project.

Knowledge retrieval, CBB search, and CBB detail lookup are available through
GenRTL MCP tools only. Do not use CLI commands for those operations.

For a CBB selected from GenRTL MCP search results:

- Run `grtl cbb install <cbb_id>@<version>` to download, verify, and safely extract it.
- Add `--target <relative-dir>` only when the user requests a specific project path.
- Do not manually download or extract the ZIP; the CLI verifies SHA-256 and rejects unsafe paths.

If authentication fails, ask the user to set `GRTL_API_KEY` or
`GENRTL_API_KEY` in the coding agent's environment.
