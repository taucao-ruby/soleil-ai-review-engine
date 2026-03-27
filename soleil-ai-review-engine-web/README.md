# soleil-ai-review-engine-Web

## What This Is

soleil-ai-review-engine-Web is a browser-based code intelligence tool for exploring repositories as knowledge graphs.
It parses source code, builds graph and search indexes, and exposes structure, relationships, and execution-oriented context through a desktop-first web UI.
The package also includes a multi-provider LLM agent that can operate either against in-browser data or against a soleil-ai-review-engine server.

## Quick Start

Prerequisites: Node 20+, pnpm 10+

```bash
pnpm install
pnpm run dev        # http://localhost:5173
```

The local dev server is Vite.
The proxy endpoint is used only for GitHub-backed clone flows that need controlled cross-origin access.

## Local Port Model

- Vite dev server: `http://localhost:5173`
- Engine HTTP server: `http://127.0.0.1:4747` via `soleil serve --port 4747`
- When the UI asks for a server URL, use the engine server on `4747`, not the Vite dev server on `5173`

## Available Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `pnpm run dev` | Start the Vite development server. |
| `build` | `pnpm run build` | Type-check and produce a production bundle. |
| `test` | `pnpm run test` | Run the Vitest suite once. |
| `test:watch` | `pnpm run test:watch` | Start the interactive Vitest watcher. |
| `lint` | `pnpm run lint` | Run ESLint on `src/`. |
| `typecheck` | `pnpm run typecheck` | Run TypeScript in no-emit mode. |
| `check` | `pnpm run check` | Run lint, typecheck, test, and build in sequence. |
| `preview` | `pnpm run preview` | Serve the production bundle locally. |

## Architecture Overview

soleil-ai-review-engine-Web is a React 18 + Vite SPA with a heavy client-side execution model.
Parsing, graph construction, embeddings, search, and agent tooling sit behind a dedicated Web Worker boundary so the UI thread stays usable during repository analysis.

### Layer Diagram

```text
┌────────────────────────────────────────────────────────┐
│                    PRESENTATION                        │
│  App.tsx → DropZone | LoadingOverlay | GraphCanvas     │
│            Header | RightPanel | FileTreePanel         │
│            SettingsPanel | CodeReferencesPanel         │
│            ProcessFlowModal | StatusBar | QueryFAB     │
├────────────────────────────────────────────────────────┤
│                   STATE MANAGEMENT                     │
│  useAppState.tsx (single Context, ~60 state values)    │
│  useSigma.ts | useBackend.ts | useSettings.ts          │
├────────────────────────────────────────────────────────┤
│                   WEB WORKER BOUNDARY                  │
│  ingestion.worker.ts (Comlink bridge)                  │
├────────────────────────────────────────────────────────┤
│                    CORE (in Worker)                    │
│  ingestion/  → Pipeline, parsing, call resolution      │
│  graph/      → KnowledgeGraph data structure           │
│  embeddings/ → HuggingFace transformer pipeline        │
│  llm/        → Agent, tools, settings, context         │
│  lbug/       → LadybugDB WASM adapter                  │
│  search/     → BM25 index, hybrid search, RRF          │
│  tree-sitter/→ Parser loading                          │
├────────────────────────────────────────────────────────┤
│                    SERVICES                            │
│  server-connection.ts → Remote soleil-ai-review-engine server API     │
│  backend.ts          → Local backend REST client       │
│  git-clone.ts        → isomorphic-git browser clone    │
│  zip.ts              → JSZip extraction                │
├────────────────────────────────────────────────────────┤
│                  EXTERNAL SYSTEMS                      │
│  Vercel (hosting + serverless proxy)                   │
│  GitHub API (via CORS proxy for git clone)             │
│  LLM Providers (OpenAI, Azure, Gemini, Anthropic,      │
│                  Ollama, OpenRouter)                   │
│  soleil-ai-review-engine Server (optional, pre-indexed repos)         │
└────────────────────────────────────────────────────────┘
```

### Runtime Flow

1. `src/main.tsx` mounts the app and applies browser polyfills required by git and WASM dependencies.
2. `src/App.tsx` renders `AppStateProvider` and switches between onboarding, loading, and exploration views.
3. `src/hooks/useAppState.tsx` creates the shared application context and the Comlink connection to `src/workers/ingestion.worker.ts`.
4. Repository input arrives through ZIP upload, GitHub clone, or server connection.
5. The worker parses files with Tree-sitter, builds the knowledge graph, loads LadybugDB, and prepares search indexes.
6. Optional embeddings are generated in-browser with a WebGPU-to-WASM fallback path.
7. The LLM agent uses graph-aware tools from `src/core/llm/tools.ts` to answer questions, run Cypher, and surface impact data.
8. The UI updates graph panels, code references, status indicators, and chat from shared state in `useAppState.tsx`.

### Operating Modes

**Client-side mode.**
All parsing, graph construction, indexing, embeddings, and agent execution happen in the browser and the worker.
This mode keeps repository data local to the current browser session apart from direct calls to user-selected LLM providers and the GitHub proxy path.

**Server-backed mode.**
The app connects to an existing soleil-ai-review-engine server and treats it as the source of graph data, search results, clusters, and process traces.
This mode reduces browser-side analysis work, but it shifts trust to the server API and its query handling because graph and Cypher requests now leave the browser.

### Layer Responsibilities

| Layer | Responsibility | Main files |
| --- | --- | --- |
| Presentation | Render graph, panels, modals, and settings | `src/App.tsx`, `src/components/*` |
| State | Coordinate UI, graph, chat, and worker lifecycle | `src/hooks/useAppState.tsx`, `src/hooks/useSigma.ts` |
| Worker Boundary | Marshal calls between main thread and worker | `src/workers/ingestion.worker.ts` |
| Core | Parse code, build graph, run search, embeddings, and LLM tooling | `src/core/*` |
| Services | Reach GitHub or a soleil-ai-review-engine backend | `src/services/*` |
| External Systems | Hosting, Git provider, model provider, optional server | Vercel, GitHub, LLM APIs, soleil-ai-review-engine Server |

### Key Hotspot Files

| File | Why it is a hotspot | Current concern |
| --- | --- | --- |
| `src/hooks/useAppState.tsx` | Single app-wide context provider and worker orchestrator | 1111-line file with broad rerender blast radius and high coupling across UI, graph, and chat state |
| `src/core/llm/tools.ts` | Houses graph-aware LLM tools and Cypher execution paths | 1500+ lines of tightly coupled tool logic and query assembly |
| `src/workers/ingestion.worker.ts` | Owns parsing, search, embeddings, and agent entry points | Large worker module with multiple responsibilities and limited isolation boundaries |

### Source Layout

| Path | Role |
| --- | --- |
| `src/components/` | Presentation components, panels, overlays, and controls |
| `src/hooks/` | Context and hook-based coordination for app state and Sigma |
| `src/core/ingestion/` | Parsing, graph extraction, enrichment, and clustering pipeline |
| `src/core/graph/` | Knowledge graph types and graph construction helpers |
| `src/core/embeddings/` | Browser-side embedding pipeline and status reporting |
| `src/core/search/` | BM25, hybrid search, and reciprocal-rank fusion |
| `src/core/llm/` | Agent setup, tools, settings, and context building |
| `src/core/lbug/` | LadybugDB WASM adapter and query support |
| `src/services/` | Git clone, ZIP extraction, and server API clients |
| `src/workers/` | Web Worker entry points exposed through Comlink |
| `api/` | Vercel serverless functions used by the web package |
| `docs/review/` | Review findings, architecture map, and remediation material |

## Security Model

The security model is simple and explicit: the browser owns user state, the worker owns analysis and agent execution, and the proxy only relays approved GitHub traffic.
There is no authenticated backend session in this package, so trust boundaries are mostly client-side and request-scoped.

### Proxy (`api/proxy.ts`)

- `api/proxy.ts` is a Vercel Serverless Function used to CORS-proxy Git operations and raw-content fetches to GitHub.
- CORS is origin-restricted to trusted deployment origins and local development origins only.
- The `Authorization` header is forwarded only when the request comes from a trusted origin.
- Upstream hosts are allowlisted to `github.com` and `raw.githubusercontent.com`.
- Requests to any other host are rejected before any upstream fetch is attempted.

### LLM API Key Storage

- Default behavior is session-only storage through `sessionStorage`; keys do not survive a browser restart.
- Persistent storage is opt-in through a user setting that writes to `localStorage`.
- The UI requires explicit user intent and risk acknowledgement before persistent key storage is enabled.
- There is no server-side encryption layer because this app is browser-only and does not have a backend key vault.
- If persistent storage is enabled, XSS or a malicious browser extension can read those keys.

### Cypher Queries

- Cypher node labels are validated against a fixed allowlist before any interpolated query is executed.
- Node IDs and direct string inserts use single-quote escaping before query construction.
- In local mode, LadybugDB runs in browser-side WASM, which keeps query blast radius inside the current browser context.
- In backend mode, Cypher requests are sent to a server, so label validation on the client is the main trust boundary before the request leaves the browser.
- Validation reduces injection risk but does not replace backend authorization, auditing, or query quotas.

### Security Boundaries That Do Not Exist

- No user authentication or authorization.
- No backend secret storage.
- No server-enforced per-user repository isolation inside this package.
- No retry, throttling, or abuse-control layer beyond what upstream services provide.

## Known Limitations

- `src/hooks/useAppState.tsx` is a 1100+ line single-context state provider; decomposition is planned but not yet executed.
- There is no mobile or responsive support; the UI is a desktop-oriented tool.
- LLM stream cancellation stops client-side reading but does not abort the underlying HTTP request.
- The app has no authentication layer; anyone with access to the deployment can use it.
- Build output is large, especially around the worker and LLM-related dependency surface.

## Running Tests

```bash
pnpm run check       # lint + typecheck + test + build
pnpm run test:watch  # interactive test runner
```

As of 2026-03-26, the package test suite passes with 19 tests across 6 files in the local workspace.
Use `pnpm run check` before opening a PR so lint, typecheck, test, and the production build are exercised together.
