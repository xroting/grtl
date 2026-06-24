---
name: find-genrtl-knowledge
description: Search GenRTL MCP for grounded RTL design, specification planning, detailed design plans for Verilog coding, RTL implementation, coding style, verification, SpyGlass lint/CDC, Vivado/Quartus synthesis or implementation errors/warnings/critical warnings, VCS/QuestaSim compile errors/warnings, functional debugging, and reusable CBB knowledge.
---

Use GenRTL MCP tools for knowledge retrieval. Do not use CLI commands for
knowledge search, CBB search, or CBB detail lookup.

Prefer specialized MCP tools based on the task:

- `genrtl_spec2plan_search` for specifications that need implementation/design plans, architecture, module breakdown, sequencing, or detailed design plans to guide Verilog/SystemVerilog coding.
- `genrtl_spec2rtl_search` for spec-to-RTL implementation, protocols, control logic, datapath, or interface implementation.
- `genrtl_coding_style_search` before writing or modifying Verilog/SystemVerilog RTL. Treat it as a style-guide load step: read all returned coding style rules and apply them as project-wide coding context.
- `genrtl_verification_search` for testbench, SVA, assertions, stimulus, checkers, scoreboards, coverage, or verification strategy.
- `genrtl_compile_search` for SpyGlass lint/CDC after coding and for Vivado/Quartus/VCS/QuestaSim diagnostics, including errors, warnings, and critical warnings.
- `genrtl_debug_search` for functional bugs, waveform mismatches, failing simulations, failing testcases, or incorrect RTL behavior.
- `genrtl_cbb_list` before producing an RTL architecture, implementation strategy, or design plan without RTL code, so existing reusable CBB names are considered first.
- `genrtl_cbb_search` then `genrtl_cbb_detail` for reusable RTL/IP discovery.
- `genrtl_knowledge_search` only when the RTL task category is unclear.

Do not call `genrtl_knowledge_search` first when a specialized tool clearly applies. If generic search returns no useful result, retry one specialized tool before answering from model memory.
Before coding, call `genrtl_coding_style_search`, read the full returned style guide, and apply every relevant rule consistently across the generated RTL.

Pass the user's complete engineering question in `query`. Add filters only when
known and useful.
