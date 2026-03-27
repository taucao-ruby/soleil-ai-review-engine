# Architecture

## What this platform is today

Soleil is a graph-powered code intelligence platform. It indexes any git repository into a knowledge graph, then exposes that graph for querying via CLI commands, an MCP server (stdio or HTTP), and a web UI. It is not yet published to npm as a public registry package.

## Package shape

| Package | Responsibility |
|---------|---------------|
| `soleil-ai-review-engine/` (published as `soleil-engine-cli`) | CLI, MCP server, analysis engine, HTTP API — all in one package |
| `soleil-ai-review-engine-web/` | React/Vite web UI — connects to engine over HTTP, no engine runtime |
| `soleil-ai-review-engine-claude-plugin/` | Claude Code hook integration |
| `soleil-ai-review-engine-cursor-integration/` | Cursor IDE integration |
| `soleil-ai-review-engine-test-setup/` | Shared test fixtures and setup |

## Runtime boundaries

| Process       | Port | Role                        |
|---------------|------|-----------------------------|
| Web app       | 5173 | UI shell, no engine runtime |
| Engine server | 4747 | Analysis API, CLI runtime   |

The web app connects to the engine at `http://localhost:4747` (hardcoded default in `useBackend.ts` and `backend.ts`, configurable via the Settings panel). The web app has no knowledge-graph runtime of its own.

## What is intentionally NOT extracted yet

- **engine-core** — graph ingestion and analysis logic is co-located with the CLI in `soleil-engine-cli`; extraction would require a stable internal API boundary that does not yet exist
- **engine-server** — HTTP/MCP server layer is co-located with the CLI; no justification to separate until the server contract stabilizes
- **skill-sdk** — skill file generation is a CLI feature; no external consumers yet
- **skill-pack-soleil-*** — no skill pack packaging infrastructure exists; deferred until there are third-party skill authors

## Dependency direction (DAG)

```
soleil-ai-review-engine-web  →  soleil-engine-cli (HTTP at runtime, no build dependency)
soleil-engine-cli             →  (no internal packages; all code is co-located)
soleil-ai-review-engine-claude-plugin  →  (reads index written by soleil-engine-cli)
soleil-ai-review-engine-cursor-integration  →  (reads index written by soleil-engine-cli)
```
