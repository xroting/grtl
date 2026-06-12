Use the `grtl` CLI when an RTL engineering task needs grounded GenRTL knowledge.

Choose exactly one command based on the task:

- `grtl knowledge-search "<query>"` for cross-domain RTL questions.
- `grtl spec2rtl-search "<query>"` for requirements, protocols, control logic, or algorithm-to-RTL work.
- `grtl spec2plan-search "<query>"` for turning a specification into an actionable implementation plan.
- `grtl verification-search "<query>"` for testbenches and verification.
- `grtl debug-search "<query>"` for lint, CDC, compile, synthesis, or RTL bugs.

Pass the user's complete engineering question. Add filters such as `--tool`,
`--tool-version`, `--target`, `--interface`, or `--tag` when they are known.
Do not include API keys, credentials, proprietary source code, or personal data
in the query.

If authentication fails, ask the user to set `GRTL_API_KEY` or
`GENRTL_API_KEY` in the coding agent's environment.
