# Upstash GenRTL SDK

> ⚠️ **Work in Progress**: This SDK is currently under active development. The API is subject to change and may introduce breaking changes in future releases.

`@upstash/genrtl-sdk` is an HTTP/REST based client for TypeScript, built on top of the [GenRTL API](https://genrtl.com).

## Why GenRTL?

LLMs rely on outdated or generic training data about the libraries you use. This leads to:

- Code examples based on year-old training data
- Hallucinated APIs that don't exist
- Generic answers for old package versions

GenRTL solves this by providing up-to-date, version-specific documentation and code examples directly from the source. Use this SDK to:

- Build AI agents with accurate, current documentation context
- Create RAG pipelines with reliable library documentation
- Power code generation tools with real API references

## Quick Start

### Install

```bash
npm install @upstash/genrtl-sdk
```

### Get API Key

Get your API key from [GenRTL](https://genrtl.com)

## Basic Usage

```ts
import { GenRTL } from "@upstash/genrtl-sdk";

const client = new GenRTL({
  apiKey: "<GENRTL_API_KEY>",
});

// Search for libraries
const libraries = await client.searchLibrary(
  "I need to build a UI with components",
  "react"
);
console.log(libraries[0].id); // "/facebook/react"

// Get documentation as JSON array (default)
const docs = await client.getContext("How do I use hooks?", "/facebook/react");
console.log(docs[0].title, docs[0].content);

// Get documentation context as plain text
const context = await client.getContext(
  "How do I use hooks?",
  "/facebook/react",
  { type: "txt" }
);
console.log(context);
```

## Configuration

### Environment Variables

You can set your API key via environment variable:

```sh
GENRTL_API_KEY=grtlsk-...
```

Then initialize without options:

```ts
const client = new GenRTL();
```

## Docs

See the [documentation](https://genrtl.com/docs/sdks/ts/getting-started) for details.

## Contributing

### Running tests

```sh
pnpm test
```

### Building

```sh
pnpm build
```
