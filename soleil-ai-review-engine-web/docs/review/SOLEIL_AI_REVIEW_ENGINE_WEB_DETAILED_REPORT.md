# soleil-ai-review-engine-Web — Detailed Engineering Review

This document provides the full evidence-grounded analysis for each review phase. Cross-references to finding IDs (GNWEB-XXX) point to [SOLEIL_AI_REVIEW_ENGINE_WEB_FINDINGS_BACKLOG.md](./SOLEIL_AI_REVIEW_ENGINE_WEB_FINDINGS_BACKLOG.md).

---

## Phase 1 — Repository Truth

### Technology Stack **[CONFIRMED]**

| Layer | Technology | Version | Evidence |
|-------|-----------|---------|----------|
| UI Framework | React | 18 | `package.json` line 19 |
| Build Tool | Vite | 8.x | `package.json` line 46 |
| Language | TypeScript | 5.x (strict) | `tsconfig.app.json` line 12 |
| CSS | Tailwind CSS | v4 (via `@theme`) | `index.css` line 6 |
| State | React Context + useState | — | `useAppState.tsx` |
| Graph DB | LadybugDB (WASM) | — | `core/lbug/` |
| Embeddings | HuggingFace Transformers | — | `core/embeddings/` |
| LLM | LangChain + LangGraph | — | `core/llm/` |
| Git | isomorphic-git + LightningFS | — | `services/git-clone.ts` |
| Graph Viz | Sigma.js + Graphology | — | `components/GraphCanvas` |
| Deployment | Vercel | — | `vercel.json` |

### File Count **[CONFIRMED]**

- Source files in `src/`: ~70 TypeScript/TSX files
- Components: 18 React components
- Core modules: 36 files across 7 domains
- Total codebase: ~8,000 lines of application TypeScript
- No test files, no lint config, no CI config

### Build Configuration **[CONFIRMED]**

`vite.config.ts` configures:
- COOP/COEP headers for `SharedArrayBuffer` (LadybugDB WASM)
- `@aspect-js/vite-plugin-wasm` for WASM support
- Worker bundling via `worker: { format: 'es' }`
- Buffer polyfill via `rollup-plugin-polyfill-node`
- External: `ladybugdb-wasm` treated as external for Vercel

---

## Phase 2 — Architecture Assessment

### View State Machine **[CONFIRMED]**

The app has no router. View state is managed by `viewMode` in `useAppState.tsx`:

```
onboarding → loading → exploring
                  ↓
               error → onboarding
```

`viewMode` values: `'onboarding' | 'loading' | 'exploring'`

### Data Flow **[CONFIRMED]**

```
User Input (ZIP/URL/Server)
    ↓
DropZone.tsx
    ↓
App.tsx handler (handleFileSelect | handleGitClone | handleServerConnect)
    ↓
Web Worker (ingestion.worker.ts via Comlink)
    ↓
Pipeline: extract → parse (tree-sitter) → build graph → detect communities → detect processes
    ↓
Load into LadybugDB (WASM)
    ↓
Build BM25 index
    ↓
← Return serialized result to main thread
    ↓
App.tsx: set state, transition to 'exploring', init agent, start embeddings
    ↓
Background: embedding pipeline (WebGPU → WASM fallback)
    ↓
Ready: full agentic chat with 7 tools
```

### Dual-Mode Architecture **[CONFIRMED]**

The app operates in two modes:

1. **Client-side mode** — ZIP/GitHub file → in-browser pipeline → LadybugDB → local embeddings → chat
2. **Server-backed mode** — Connect to soleil-ai-review-engine server → HTTP-backed Cypher, search, and file operations → chat

The agent's `createGraphRAGTools` accepts function references, so the same tool definitions work with both local and HTTP-backed implementations. **[CONFIRMED]** — `initializeBackendAgent` in `ingestion.worker.ts` lines 637-690.

---

## Phase 3 — State Management Deep-Dive

### The God Hook **[CONFIRMED]** (ref: GNWEB-003, GNWEB-009)

`useAppState.tsx` is 1198 lines with a single `AppState` interface exposing ~60 fields:

**State domains mixed in one context:**
- UI state: `viewMode`, `selectedNode`, `showSettings`, `showQuery`, `isRightPanelExpanded`
- Graph data: `graphData`, `sigmaInstance`, `fileContents`, `highlights`, `queryResult`
- Chat: `chatMessages`, `sendChatMessage`, `isSendingChat`, `chatError`, `stopChat`
- Embedding: `embeddingStatus`, `embeddingProgress`
- Agent: `isAgentReady`, `agentProvider`
- Backend: `serverUrl`, `availableRepos`, `selectedRepo`, `switchRepo`

**Re-render impact**: The `value` object is a new object literal on every render (line 1094), meaning every consumer re-renders on ANY state change. No `useMemo`, no context splitting.

---

## Phase 4 — LLM Agent Analysis

### Agent Architecture **[CONFIRMED]**

- `createGraphRAGAgent` uses LangGraph `createReactAgent` with tool nodes
- System prompt includes: graph schema, codebase context (stats, hotspots, clusters), and behavior instructions
- `recursionLimit: 50` — agent can make up to 50 tool calls per conversation turn
- 7 tools: `soleil-ai-review-engine_query` (semantic search), `soleil-ai-review-engine_cypher` (graph query), `soleil-ai-review-engine_grep` (regex file search), `soleil-ai-review-engine_read` (file reader), `soleil-ai-review-engine_overview` (codebase overview), `soleil-ai-review-engine_explore` (graph explorer), `soleil-ai-review-engine_impact` (blast radius analysis)

### Streaming Implementation **[CONFIRMED]**

`streamAgentResponse` in `agent.ts` (line 314) implements a dual-mode stream:

1. `agent.stream()` with `streamMode: 'messages'` — emits individual messages
2. Processes `AIMessageChunk` events, extracting:
   - `reasoning` (content text before tool calls)
   - `tool_call` (function name + args)
   - `tool_result` (tool message content)
   - `content` (final answer text)

The streaming state machine correctly handles interleaved reasoning and tool calls. **[CONFIRMED]**

### Cancellation **[CONFIRMED]** (ref: GNWEB-015)

Cancellation is via a module-level `chatCancelled` boolean. The HTTP stream to the LLM provider continues after cancellation — only consumer-side reading stops.

---

## Phase 5 — Security Assessment

### API Key Management **[CONFIRMED]** (ref: GNWEB-004)

- All API keys stored as plaintext JSON in `localStorage` under key `soleil-ai-review-engine-llm-settings`
- Keys are sent directly from browser to LLM providers (no server intermediary)
- Comment in code: "All API keys are stored locally - never sent to any server except the LLM provider" (`settings-service.ts` line 5)
- Risk: browser extensions, XSS, shared computers

### CORS Proxy Security **[CONFIRMED]** (ref: GNWEB-008)

- Allowlist: `github.com`, `raw.githubusercontent.com` (line 27)
- Hostname checked with `.endsWith()` — correctly prevents subdomain tricks
- `Access-Control-Allow-Origin: *` — any origin can use the proxy
- `www-authenticate` header stripped to prevent browser auth popups (line 81)
- Authorization header forwarded from client to GitHub — potential auth relay

### Cypher Injection **[CONFIRMED]** (ref: GNWEB-012)

- Node labels interpolated into Cypher without allowlist validation
- Single quotes escaped with `replace(/'/g, "''")` — prevents basic string injection
- Risk mitigated by client-side execution model (LadybugDB runs in-browser)
- But `initializeBackendAgent` routes Cypher to server via HTTP — server-mode lacks this mitigation

### GitHub PAT Handling **[CONFIRMED]**

- `git-clone.ts` line 102: PAT used via `onAuth` callback
- Token cleared after clone completes (line 104)
- UI states "Token stays in your browser only" (line 427)
- Not persisted to localStorage — cleared on reuse ✅

---

## Phase 6 — Failure-Path Engineering

### Error Handling Coverage

| Area | Failure Path | Handling | Quality |
|------|-------------|----------|---------|
| ZIP upload | Invalid file type | `setError('Please drop a .zip file')` | ✅ OK |
| Git clone | 401/403 | Specific PAT guidance message | ✅ Good |
| Git clone | 404 | "Repo not found or private" message | ✅ Good |
| Server connect | Network error | "Cannot reach server" message | ✅ OK |
| Server connect | AbortController | User can cancel via button | ✅ Good |
| Pipeline | Worker error | `console.error` + 3s auto-dismiss | ⚠️ 3s too short |
| LLM chat | Provider error | Error chunk sent to UI | ✅ OK |
| LLM chat | Cancellation | Boolean flag, stream continues | ⚠️ Not clean (GNWEB-015) |
| Rendering | Component crash | **No error boundary** | ❌ White screen (GNWEB-005) |
| Worker init | Race condition | "Worker not initialized" error | ⚠️ Poor UX (GNWEB-016) |
| LadybugDB | WASM load failure | Silent fallback — graph works without DB | ✅ Graceful |
| Embeddings | WebGPU unavailable | Automatic WASM fallback | ✅ Good |
| Embeddings | WASM also fails | `console.warn`, search still works via BM25 | ✅ Graceful |

---

## Phase 7 — Performance Analysis

### Identified Concerns **[CONFIRMED]**

1. **Context re-renders** — No `useMemo` on provider value (GNWEB-009)
2. **Array allocation** — `graph.nodes` creates array on every access (GNWEB-019)
3. **Bundle size** — 7 LangChain packages loaded eagerly (GNWEB-022)
4. **Worker memory** — `storedFileContents` holds all file contents in worker memory (line 43) — for large repos (10,000+ files) this could be significant

### Positive Performance Signals **[CONFIRMED]**

1. Web Worker for all heavy processing — main thread stays responsive
2. BM25 index built in ~100ms (per code comment, line 170)
3. Shallow clone (`depth: 1`) for GitHub repos
4. IndexedDB cleanup after clone completes
5. Sigma.js uses WebGL for graph rendering — handles thousands of nodes

---

## Phase 8 — Code Quality

### Positive Signals

- TypeScript strict mode with 0 errors
- Well-structured type system (union types, discriminated unions, generics)
- Consistent coding style across files
- Meaningful error messages with provider-specific guidance
- Proper use of `useCallback`, `useState`, `useEffect` (aside from GNWEB-027)
- Design system with semantic tokens, not hardcoded colors

### Negative Signals

- No test files (GNWEB-001)
- No lint configuration (GNWEB-002)
- Several `any` escape hatches (GNWEB-024)
- Debug logging not consistently gated (GNWEB-023)
- Duplicated logic (GNWEB-013)
- Large files: `tools.ts` (1504), `useAppState.tsx` (1198), `ingestion.worker.ts` (899), `SettingsPanel.tsx` (869)

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Findings | 28 |
| CRITICAL | 2 |
| HIGH | 7 |
| MEDIUM | 12 |
| LOW | 5 |
| INFO | 1 |
| TypeScript Errors | 0 |
| Test Files | 0 |
| Lint Config | None |
| CI Config | None |
| README | None |
| Error Boundaries | 0 |
| Batch 0 XS/S Fixes | 5 |
| Estimated Total Effort | M-L (3-6 weeks for all 5 batches) |
