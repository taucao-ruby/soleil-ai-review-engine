# soleil-ai-review-engine-Web — Architecture Truth Map

All facts labeled as **[CONFIRMED]** are verified from source code. Items labeled **[INFERRED]** are reasonable conclusions from available evidence. Items labeled **[NOT VERIFIABLE]** cannot be confirmed from this repository alone.

---

## Architecture Summary

soleil-ai-review-engine-Web is a **client-heavy SPA** built with React 18, Vite 8, and TypeScript in strict mode. It runs a complete code analysis pipeline in the browser: file extraction → Tree-sitter AST parsing → knowledge graph construction → WASM graph database (LadybugDB) → client-side ML embeddings (HuggingFace Transformers) → LLM-powered agentic chat. The app deploys to Vercel as a static SPA with a single Vercel Serverless Function (`api/proxy.ts`) for CORS proxying git operations. **[CONFIRMED]**

---

## Layer Diagram

```
┌────────────────────────────────────────────────────────┐
│                    PRESENTATION                        │
│  App.tsx → DropZone | LoadingOverlay | GraphCanvas     │
│            Header | RightPanel | FileTreePanel         │
│            SettingsPanel | CodeReferencesPanel          │
│            ProcessFlowModal | StatusBar | QueryFAB     │
├────────────────────────────────────────────────────────┤
│                   STATE MANAGEMENT                     │
│  useAppState.tsx (single Context, ~60 state values)    │
│  useSigma.ts | useBackend.ts | useSettings.ts         │
├────────────────────────────────────────────────────────┤
│                   WEB WORKER BOUNDARY                  │
│  ingestion.worker.ts (Comlink bridge)                  │
├────────────────────────────────────────────────────────┤
│                    CORE (in Worker)                     │
│  ingestion/  → Pipeline, parsing, call resolution      │
│  graph/      → KnowledgeGraph data structure           │
│  embeddings/ → HuggingFace transformer pipeline        │
│  llm/        → Agent, tools, settings, context         │
│  lbug/       → LadybugDB WASM adapter                 │
│  search/     → BM25 index, hybrid search, RRF         │
│  tree-sitter/→ Parser loading                          │
├────────────────────────────────────────────────────────┤
│                    SERVICES                             │
│  server-connection.ts → Remote soleil-ai-review-engine server API     │
│  backend.ts          → Local backend REST client       │
│  git-clone.ts        → isomorphic-git browser clone    │
│  zip.ts              → JSZip extraction                │
├────────────────────────────────────────────────────────┤
│                  EXTERNAL SYSTEMS                      │
│  Vercel (hosting + serverless proxy)                   │
│  GitHub API (via CORS proxy for git clone)             │
│  LLM Providers (OpenAI, Azure, Gemini, Anthropic,     │
│                  Ollama, OpenRouter)                    │
│  soleil-ai-review-engine Server (optional, pre-indexed repos)         │
└────────────────────────────────────────────────────────┘
```

---

## Module Responsibilities

| Module | Responsibility | Key Files | Size |
|--------|---------------|-----------|------|
| `components/` | React presentation layer | 18 files | ~200KB |
| `hooks/` | State management, app logic | `useAppState.tsx` (44KB), `useSigma.ts` (22KB) | ~72KB |
| `core/ingestion/` | AST parsing, graph construction, community detection | 13 files | ~130KB |
| `core/llm/` | LLM agent, tools, settings, context | `tools.ts` (65KB), `agent.ts` (21KB) | ~107KB |
| `core/graph/` | Knowledge graph types and factory | `types.ts`, `graph.ts` | ~3KB |
| `core/embeddings/` | Client-side ML embedding pipeline | 5 files | ~25KB |
| `core/search/` | BM25 + hybrid search with RRF | 3 files | ~15KB |
| `core/lbug/` | LadybugDB WASM adapter | 3 files | ~12KB |
| `services/` | External API clients | 4 files | ~20KB |
| `workers/` | Web Worker for background processing | `ingestion.worker.ts` (31KB) | ~31KB |
| `lib/` | Constants, graph adapter, mermaid generator | 4 files | ~24KB |
| `config/` | Ignore rules, supported languages | 2 files | ~6KB |
| `vendor/leiden/` | Community detection algorithm | 1 directory | [NOT MEASURED] |

---

## Bootstrap Sequence

**[CONFIRMED]** from `main.tsx` → `App.tsx` → `useAppState.tsx`:

1. `main.tsx`: Polyfill `globalThis.Buffer` for isomorphic-git, mount React app
2. `App.tsx`: Render `AppStateProvider` → `AppContent`
3. `AppStateProvider`: Initialize ~30 state variables, create Web Worker (`ingestion.worker.ts`), wrap with Comlink
4. `AppContent`: Check `?server` query param. If present, auto-connect to server (remove param from URL, transition to loading → exploring)
5. If no query param: show `DropZone` (onboarding view)
6. On repo load (any method): set graph, file contents, transition to `exploring` view, conditionally initialize LLM agent, auto-start embeddings (WebGPU → WASM fallback)

---

## External Dependencies and Assumed Contracts

### Inside This Repo **[CONFIRMED]**
- Client-side code analysis pipeline (Tree-sitter → graph → LadybugDB → embeddings)
- Multi-provider LLM agent with 7 tools (search, cypher, grep, read, overview, explore, impact)
- Vercel serverless CORS proxy for git operations
- Three repo loading methods: ZIP upload, GitHub clone, server connection

### Assumed from Outside **[INFERRED/PARTIAL EVIDENCE]**
- **soleil-ai-review-engine CLI/Server** — `services/server-connection.ts` and `services/backend.ts` assume a REST API at `/api/repos`, `/api/graph`, `/api/query`, `/api/search`, `/api/file`, `/api/processes`, `/api/process`, `/api/clusters`, `/api/cluster`. The server schema is inferred from response handling but not validated with Zod or a shared contract.
- **LLM Provider APIs** — Assumed to follow OpenAI/Anthropic/Google standard API contracts via LangChain abstractions.

### Cannot Be Concluded **[NOT VERIFIABLE]**
- Server-side security posture (authentication, authorization, rate limiting)
- Whether the soleil-ai-review-engine server validates Cypher queries before execution
- Production deployment configuration beyond `vercel.json`
- User authentication/authorization model (none visible — the app is open)

---

## Coupling Hotspots

| Hotspot | Evidence | Risk |
|---------|----------|------|
| `useAppState.tsx` | Every component imports from this single context | Any state change affects all consumers. Untestable in isolation. |
| `ingestion.worker.ts` | 899 lines combining pipeline orchestration, embedding, search, agent, and enrichment | Worker is a god-module mirroring the main-thread god-hook |
| `tools.ts` | 1504 lines with all 7 LLM tools inline | Cypher queries, search logic, and impact analysis tightly coupled |
| `App.tsx` → 3 load handlers | `handleFileSelect`, `handleGitClone`, `handleServerConnect` share ~80% of logic | Duplication across 3 nearly-identical code paths |

---

## Ambiguous / Undocumented Boundaries

1. **`services/backend.ts` vs `services/server-connection.ts`** — Both provide HTTP clients for the soleil-ai-review-engine server with overlapping functionality (both have `fetchRepos`, `fetchGraph`). `backend.ts` uses `backendUrl` module state with a setter; `server-connection.ts` takes URL as a parameter. **[CONFIRMED but undocumented]** — these appear to be two generations of the same abstraction.

2. **Worker-based vs main-thread agent** — `initializeAgent` in `useAppState.tsx` calls `api.initializeAgent()` on the worker, but the agent itself uses LangChain which makes HTTP calls from the worker thread. There's also `initializeBackendAgent` on the worker for server-backed mode. The decision of which mode to use is implicit. **[CONFIRMED]**

3. **Embedding lifecycle** — `startEmbeddings` is fire-and-forget with WebGPU→WASM fallback. The embedding status is tracked in both the worker (`isEmbeddingComplete` flag) and main thread (`embeddingStatus` state). These could diverge. **[CONFIRMED]**

4. **`vendor/leiden/`** — Contains community detection algorithm. Its integration path and how it relates to `core/ingestion/community-processor.ts` is not documented. **[PARTIAL EVIDENCE]**
