---
name: find-genrtl-knowledge
description: Search GenRTL MCP for grounded RTL design, specification planning, verification, compile/synthesis diagnostics, debugging, and coding style knowledge.
---

Use GenRTL MCP tools for knowledge retrieval. Do not use CLI commands for
knowledge search, CBB search, or CBB detail lookup.

Choose exactly one MCP tool based on the task:

- `genrtl_knowledge_search` for cross-domain RTL questions.
- `genrtl_spec2rtl_search` for specification or RTL design questions.
- `genrtl_spec2plan_search` for specifications that need implementation plans.
- `genrtl_verification_search` for testbench or verification questions.
- `genrtl_compile_search` for lint, CDC, compile, synthesis, implementation, or simulator diagnostics.
- `genrtl_debug_search` for issue descriptions, erroneous code, solutions, and corrected RTL.

Pass the user's complete engineering question in `query`. Add filters only when
known and useful.
