---
name: find-genrtl-knowledge
description: Search GenRTL for grounded RTL design, specification planning, verification, compile/synthesis diagnostics, debugging, and coding style knowledge.
---

# GenRTL Knowledge Search

Use one CLI command per task:

```bash
grtl knowledge-search "<cross-domain RTL question>"
grtl spec2rtl-search "<specification or RTL design question>"
grtl spec2plan-search "<specification that needs an implementation plan>"
grtl verification-search "<testbench or verification question>"
grtl compile-search "<lint, CDC, compile, synthesis, implementation, or simulator diagnostic>"
grtl debug-search "<issue description, erroneous code, solution, or corrected RTL question>"
```

Useful options:

```bash
--domain <domain>
--tool <tool>
--tool-version <version>
--error-type <type>
--severity <severity>
--interface <interface>
--target <fpga|asic|both>
--tag <tag...>
--top-k <1-20>
--min-score <0-1>
--json
```

Use the user's full engineering question. Do not send credentials, API keys,
personal data, or proprietary source code. If authentication fails, request a
valid `GRTL_API_KEY`.
