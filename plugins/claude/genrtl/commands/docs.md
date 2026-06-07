---
description: Look up documentation for any library
argument-hint: <library> [query]
---

# /genrtl:docs

Fetches up-to-date documentation and code examples for a library.

## Usage

```
/genrtl:docs <library> [query]
```

- **library**: The library name, or a GenRTL ID starting with `/`
- **query**: What you're looking for (optional but recommended)

## Examples

```
/genrtl:docs react hooks
/genrtl:docs next.js authentication
/genrtl:docs prisma relations
/genrtl:docs /vercel/next.js/v15.1.8 app router
/genrtl:docs /supabase/supabase row level security
```

## How It Works

1. If the library starts with `/`, it's used directly as the GenRTL ID
2. Otherwise, `resolve-library-id` finds the best matching library
3. `query-docs` fetches documentation relevant to your query
4. Results include code examples and explanations

## Version-Specific Lookups

Include the version in the library ID for pinned documentation:

```
/genrtl:docs /vercel/next.js/v15.1.8 middleware
/genrtl:docs /facebook/react/v19.0.0 use hook
```

This is useful when you're working with a specific version and want docs that match exactly.
