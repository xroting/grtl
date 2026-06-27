---
name: genrtl-mcp
description: Use this skill for Verilog/SystemVerilog/RTL engineering tasks, including specs, detailed design plans for Verilog coding, RTL generation, coding style, testbench/SVA verification, Lint syntax/CDC diagnostics, Vivado/Quartus synthesis or implementation errors/warnings/critical warnings, VCS/QuestaSim compile errors/warnings, simulation failures, waveform/debug work, and reusable CBB discovery. Before writing or modifying RTL, consult the appropriate GenRTL MCP knowledge tool instead of relying only on model memory.
---

# GenRTL MCP RTL Knowledge Workflow

Use GenRTL MCP tools before relying on model memory for RTL engineering.

## Tool Routing

- Spec -> detailed implementation/design plan that can guide Verilog/SystemVerilog coding: use `genrtl_spec2plan_search`.
- Spec -> RTL implementation: use `genrtl_spec2rtl_search`.
- Before writing or modifying RTL: use `genrtl_coding_style_search`, read all returned coding style rules, and apply them as project-wide coding context.
- Simulation environment, testbench, SVA, assertions, stimulus, checkers, scoreboards, coverage, or verification strategy: use `genrtl_verification_search`.
- After coding: use `genrtl_lint_load`, read all returned Lint knowledge card titles, scan the generated/modified RTL for syntax mistakes, lint violations, and CDC risks implied by those titles, then fix obvious issues before compile/synthesis.
- Lint syntax/CDC diagnostics with actual logs: use `genrtl_lint_search`.
- Vivado synthesis/implementation errors, warnings, or critical warnings after running the tool: use `genrtl_compile_search` with `filters.tool = "vivado"` to fix them.
- Quartus synthesis/implementation errors, warnings, or critical warnings after running the tool: use `genrtl_compile_search` with `filters.tool = "quartus"` to fix them.
- VCS/QuestaSim compile errors or warnings after running the tool: use `genrtl_compile_search` with `filters.tool = "vcs"` or `"questasim"` to fix them.
- Functional bug, waveform mismatch, failing simulation, incorrect RTL behavior, or testcase failure: use `genrtl_debug_search`.
- Reusable IP/CBB awareness for design planning: when the user asks for an RTL architecture, implementation strategy, or design plan without requesting RTL code, call `genrtl_cbb_list` first to see which reusable CBB names already exist before proposing a from-scratch design.
- Reusable IP/CBB discovery: use `genrtl_cbb_search`, then `genrtl_cbb_detail`.

## Required Behavior

- Do not call `genrtl_knowledge_search` first when the task clearly matches a specialized tool.
- If `genrtl_knowledge_search` returns no useful result, retry one specialized tool before answering from model memory.
- When using either `genrtl_spec2rtl_search` or `genrtl_spec2plan_search` for a spec, also call the other companion tool before proceeding.
- Before coding, call `genrtl_coding_style_search`, read the full returned style guide, and apply every relevant rule consistently across the generated RTL.
- After coding, call `genrtl_lint_load`, read all returned Lint knowledge card titles, scan the generated/modified RTL for syntax mistakes, lint violations, and CDC risks implied by those titles, then fix obvious issues before compile/synthesis.
- Before building a simulation environment or writing/modifying verification code, call `genrtl_verification_search`.
- After compile/synthesis/implementation tools produce errors, warnings, or critical warnings, call `genrtl_compile_search` with the matching tool filter and use the returned guidance to fix them.
- For simulation failures, waveform mismatches, testcase failures, or functional RTL bugs, call `genrtl_debug_search` and use the returned guidance to fix the bug.
- Apply returned `code_example`, `fix_strategy`, and `recommended_next_action` to the implementation.
- Mention which GenRTL result refs influenced the final design when useful.
