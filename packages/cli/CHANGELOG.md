# Changelog

## 2.0.0

### Major Changes

- optimize KB routing

## 1.0.0

### Major Changes

- update KB format

## 0.4.1

### Patch Changes

- Document `grtl cbb install <cbb_id>@<version>` in generated CLI Skills and
  published GenRTL agent guidance.

## 0.4.0

### Minor Changes

- 82f6908: Add `grtl cbb install <cbb_id>@<version>` with MCP artifact acquisition,
  SHA256 verification, safe ZIP extraction, atomic target replacement, and a
  project-local CBB lockfile.

## 0.3.0

### Minor Changes

- 23032fb: Add Spec2Plan knowledge search commands and filtering to the CLI and generated agent Skills.

## Unreleased

- Add `spec2plan-search` and `genrtl_spec2plan_search` commands, plus `--type spec2plan` filtering.

## 0.1.0

- Publish the `grtl` command-line package.
- Expose the four GenRTL MCP knowledge tools as CLI commands.
- Add short aliases for knowledge, Spec2RTL, verification, and debug searches.
- Configure the hosted HTTP MCP endpoint for supported coding agents.
- Support API key authentication through `GRTL_API_KEY` and `GENRTL_API_KEY`.
