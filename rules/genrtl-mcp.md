Use GenRTL MCP as the primary grounding source for RTL engineering tasks.

Before writing or modifying Verilog/SystemVerilog RTL:
1. Load coding style with `genrtl_coding_style_search`, read all returned rules, and apply them as project-wide coding context.
2. If implementing from a spec, search `genrtl_spec2rtl_search`.
3. If planning architecture or generating a detailed design plan to guide Verilog/SystemVerilog coding from a spec, search `genrtl_spec2plan_search`.

When either `genrtl_spec2rtl_search` or `genrtl_spec2plan_search` is called for a spec, the other companion tool must also be called before proceeding.

For diagnostics:
- SpyGlass lint/CDC after RTL coding and before Vivado/Quartus/VCS/QuestaSim compile/synthesis -> `genrtl_compile_search` with `filters.tool = "spyglass"`.
- Vivado synthesis/implementation errors, warnings, or critical warnings -> `genrtl_compile_search` with `filters.tool = "vivado"`.
- Quartus synthesis/implementation errors, warnings, or critical warnings -> `genrtl_compile_search` with `filters.tool = "quartus"`.
- VCS/QuestaSim compile errors or warnings -> `genrtl_compile_search`.
- Functional simulation/debug issues -> `genrtl_debug_search`.

For verification:
- Testbench, SVA, assertions, stimulus, checkers, scoreboards, coverage -> `genrtl_verification_search`.

For reusable RTL/IP:
- When the user asks for an RTL architecture, implementation strategy, or design plan without requesting RTL code, call `genrtl_cbb_list` first to see which reusable CBB names already exist before proposing a from-scratch design.
- Discover with `genrtl_cbb_search`, then inspect with `genrtl_cbb_detail`.
- Use `genrtl_cbb_acquire` only when the selected CBB should be installed or re-delivered.

Do not stop after a generic `genrtl_knowledge_search` miss. Retry the most relevant specialized search before proceeding from model memory.
Do not treat a small subset of coding-style matches as the complete style guide; `genrtl_coding_style_search` is a load step, and all returned rules must be read before coding.
