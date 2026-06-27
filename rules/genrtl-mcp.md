Use GenRTL MCP as the primary grounding source for RTL engineering tasks.

Before writing or modifying Verilog/SystemVerilog RTL:
1. Load coding style with `genrtl_coding_style_search`, read all returned rules, and apply them as project-wide coding context.
2. If implementing from a spec, search `genrtl_spec2rtl_search`.
3. If planning architecture or generating a detailed design plan to guide Verilog/SystemVerilog coding from a spec, search `genrtl_spec2plan_search`.

When either `genrtl_spec2rtl_search` or `genrtl_spec2plan_search` is called for a spec, the other companion tool must also be called before proceeding.

For diagnostics:
- After RTL coding -> `genrtl_lint_load`; read all returned Lint knowledge card titles, scan the generated/modified RTL for syntax mistakes, lint violations, and CDC risks implied by those titles, then fix obvious issues before compile/synthesis.
- Lint syntax/CDC diagnostics with actual logs -> `genrtl_lint_search`.
- After running Vivado synthesis/implementation, use `genrtl_compile_search` with `filters.tool = "vivado"` to fix errors, warnings, and critical warnings.
- After running Quartus synthesis/implementation, use `genrtl_compile_search` with `filters.tool = "quartus"` to fix errors, warnings, and critical warnings.
- After running VCS/QuestaSim compile, use `genrtl_compile_search` with `filters.tool = "vcs"` or `"questasim"` to fix compile errors and warnings.
- For failing simulations, waveform mismatches, incorrect RTL behavior, or functional code bugs -> `genrtl_debug_search`.

For verification:
- Before building a simulation environment or writing/modifying testbench, SVA, assertions, stimulus, checkers, scoreboards, or coverage -> `genrtl_verification_search`.

For reusable RTL/IP:
- When the user asks for an RTL architecture, implementation strategy, or design plan without requesting RTL code, call `genrtl_cbb_list` first to see which reusable CBB names already exist before proposing a from-scratch design.
- Discover with `genrtl_cbb_search`, then inspect with `genrtl_cbb_detail`.
- Use `genrtl_cbb_acquire` only when the selected CBB should be installed or re-delivered.

Do not stop after a generic `genrtl_knowledge_search` miss. Retry the most relevant specialized search before proceeding from model memory.
Do not treat a small subset of coding-style matches as the complete style guide; `genrtl_coding_style_search` is a load step, and all returned rules must be read before coding.
