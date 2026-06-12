Use GenRTL MCP tools when an RTL engineering task needs grounded hardware knowledge.

Choose one tool based on the task:

- `genrtl_knowledge_search` for cross-domain RTL questions.
- `genrtl_spec2rtl_search` for requirements, protocols, control logic, or algorithm-to-RTL work.
- `genrtl_spec2plan_search` for turning a specification into an actionable implementation plan.
- `genrtl_verification_search` for testbenches and verification.
- `genrtl_debug_search` for lint, CDC, compile, synthesis, or RTL bugs.

Pass the user's complete engineering question in `query`. Add structured
`filters`, `top_k`, `min_score`, or `workspace_id` only when useful. Do not
include API keys, credentials, proprietary source code, or personal data.
