# soleil-ai-review-engine-Web — Findings Backlog

All findings ordered by severity tier, then impact within tier. Each finding carries evidence, remediation, effort, and confidence.

---

## [CRITICAL] GNWEB-001 — No Test Suite Exists

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-001 |
| Severity    | CRITICAL |
| Area        | Testing |
| Evidence    | `package.json` has no test script, no `test` in `scripts` block (line 6-9). No test framework in `dependencies` or `devDependencies`. Zero test files in `src/` (`find_by_name` returned 0 results for `*.test.*`, `*.spec.*`). |
| Impact      | No automated regression detection. Any change to the 1198-line `useAppState.tsx`, the 1504-line `tools.ts`, or the 899-line `ingestion.worker.ts` is unsupported by any safety net. Pipeline logic, graph construction, LLM tool dispatch, and Cypher generation are all un-tested. |
| Remediation | Add Vitest (Vite-native). Create unit tests for: `createKnowledgeGraph`, `serializePipelineResult`/`deserializePipelineResult`, `normalizeServerUrl`, `parseGitHubUrl`, `resolveFilePath`, `loadSettings`/`saveSettings`, `extractInstanceName`. Add integration tests for tool functions in `tools.ts`. |
| Effort      | L |
| Blocks      | GNWEB-002, GNWEB-003 |
| Confidence  | HIGH — direct evidence from `package.json` and file system search |

---

## [CRITICAL] GNWEB-002 — No Lint / Typecheck CI Gates

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-002 |
| Severity    | CRITICAL |
| Area        | Tooling / CI |
| Evidence    | No `.github/workflows/`, no `.gitlab-ci.yml`, no `Makefile`, no lint script in `package.json`. No ESLint config (`.eslintrc.*`, `eslint.config.*`). `.gitignore` is 2 lines (`.vercel`, `.env*.local`). No `node_modules`, `dist`, or `build` in `.gitignore`. |
| Impact      | No pre-merge quality gates. Type regressions, dead imports, and style drift enter `main` unchecked. Collaborators have no enforced standards. |
| Remediation | 1) Add ESLint 9+ flat config with `@typescript-eslint/parser`. 2) Add `"lint": "eslint src"`, `"typecheck": "tsc -b --noEmit"` scripts. 3) Add GitHub Actions workflow gating on lint + typecheck + build. 4) Expand `.gitignore` to include `node_modules/`, `dist/`. |
| Effort      | S |
| Blocks      | — |
| Confidence  | HIGH — verified via file system search and `package.json` |

---

## [HIGH] GNWEB-003 — God Hook: `useAppState.tsx` (1198 lines, ~60 state values)

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-003 |
| Severity    | HIGH |
| Area        | Architecture / State Management |
| Evidence    | `src/hooks/useAppState.tsx` — 1198 lines, single `AppStateProvider` context with ~30 `useState` calls and ~30 `useCallback` functions. The `AppState` interface (lines 55-172) exposes 60+ fields/methods. Every component in the app consumes this single context. |
| Impact      | Any state change triggers context re-evaluation for all consumers. Adding new features requires modifying this single file. Mental overhead for new contributors is extreme. Testing individual state slices is impossible without mocking the entire context. |
| Remediation | Split into domain-specific contexts: `GraphStateProvider`, `ChatStateProvider`, `UIStateProvider`, `EmbeddingStateProvider`. Each with its own hook. Use a barrel `useAppState` for backwards compatibility during migration. |
| Effort      | L |
| Blocks      | — |
| Confidence  | HIGH — direct evidence from file |

---

## [HIGH] GNWEB-004 — API Keys Stored in localStorage (Plaintext)

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-004 |
| Severity    | HIGH |
| Area        | Security |
| Evidence    | `src/core/llm/settings-service.ts` line 28: `localStorage.getItem(STORAGE_KEY)`. Line 74: `localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))`. API keys for OpenAI, Anthropic, Gemini, Azure, OpenRouter all stored as plaintext JSON in `soleil-ai-review-engine-llm-settings`. |
| Impact      | Any XSS vulnerability or browser extension with `storage` permission can read all API keys. The keys have direct billing implications. |
| Remediation | Document the risk prominently. Consider encryption at rest using Web Crypto API with a user-provided passphrase. At minimum, add a warning banner in the settings UI explaining the storage model. |
| Effort      | M |
| Blocks      | — |
| Confidence  | HIGH — direct evidence from source code |

---

## [HIGH] GNWEB-005 — No Error Boundary

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-005 |
| Severity    | HIGH |
| Area        | Failure-path Engineering |
| Evidence    | `src/main.tsx` renders `<App />` inside `<React.StrictMode>`. No `ErrorBoundary` component anywhere in the component tree. `src/App.tsx` has try/catch in callbacks but no React error boundary. `find_by_name ErrorBoundary` returns 0 results. |
| Impact      | Any uncaught rendering error (e.g., in GraphCanvas, Sigma, Mermaid) crashes the entire app with a white screen. No recovery, no error message. |
| Remediation | Add a React Error Boundary wrapping `<AppContent />` that shows a "Something went wrong" UI with a reload button and error details. |
| Effort      | S |
| Blocks      | — |
| Confidence  | HIGH — direct evidence from file search |

---

## [HIGH] GNWEB-006 — Dual Lockfiles Present

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-006 |
| Severity    | HIGH |
| Area        | Tooling / DevEx |
| Evidence    | Both `package-lock.json` (412KB) and `pnpm-lock.yaml` (212KB) exist at root. No `.npmrc` or `packageManager` field in `package.json`. |
| Impact      | Install-time dependency tree is non-deterministic. Different contributors may resolve different versions. CI reproducibility is broken. |
| Remediation | Choose one package manager. Add `"packageManager": "pnpm@10.x.x"` to `package.json` (or the equivalent for npm). Delete the unused lockfile. Add a `.npmrc` with `engine-strict=true`. |
| Effort      | XS |
| Blocks      | — |
| Confidence  | HIGH — direct evidence from file listing |

---

## [HIGH] GNWEB-007 — No README

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-007 |
| Severity    | HIGH |
| Area        | Documentation |
| Evidence    | `find_by_name README*` at root returns 0 results. No `CONTRIBUTING.md`, no `docs/` other than this review. |
| Impact      | New engineers cannot onboard. No setup instructions, no architecture overview, no contribution guide. The "productive in 30 minutes" bar is unreachable. |
| Remediation | Create `README.md` with: project description, prerequisites (Node 20+, pnpm), setup steps, available scripts, architecture overview, env var documentation. |
| Effort      | S |
| Blocks      | — |
| Confidence  | HIGH — direct evidence from file search |

---

## [HIGH] GNWEB-008 — CORS Proxy is an Open Relay (Partial)

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-008 |
| Severity    | HIGH |
| Area        | Security |
| Evidence    | `api/proxy.ts` line 27: `const allowedHosts = ['github.com', 'raw.githubusercontent.com']` — allowlist present. Line 37: `parsedUrl.hostname.endsWith(host)` — uses `endsWith`, meaning a domain like `evil-github.com` or `raw.githubusercontent.com.evil.com` would NOT match (correct). Line 79: `Access-Control-Allow-Origin: *` — open CORS. But line 48: forwards `Authorization` header — an attacker could use the proxy to make authenticated requests to GitHub with a stolen token. |
| Impact      | The proxy correctly restricts to GitHub URLs, but `Access-Control-Allow-Origin: *` means any website can use this proxy to hit GitHub anonymously or with stolen creds. The authorization header forwarding combined with wildcard CORS creates an auth-relay risk. |
| Remediation | Restrict `Access-Control-Allow-Origin` to the deployed application origin(s) instead of `*`. Add rate limiting via Vercel Edge Middleware. |
| Effort      | S |
| Blocks      | — |
| Confidence  | HIGH — direct evidence from `api/proxy.ts` |

---

## [HIGH] GNWEB-009 — No Memoization of Context Value

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-009 |
| Severity    | HIGH |
| Area        | Performance |
| Evidence    | `src/hooks/useAppState.tsx` lines 1094-1181: `const value: AppState = { ... }` — a new object literal is created every render. This object is passed to `AppStateContext.Provider`. No `useMemo` wrapping the `value` object. |
| Impact      | Every state change in `AppStateProvider` creates a new context value object, triggering all consumers to re-render regardless of which specific slice changed. With 18 components all consuming this context, this causes cascading re-renders on every keystroke, selection, or progress update. |
| Remediation | Wrap `value` in `useMemo` or split into multiple contexts (see GNWEB-003). |
| Effort      | XS (for `useMemo`), L (for context split) |
| Blocks      | — |
| Confidence  | HIGH — direct evidence from code |

---

## [MEDIUM] GNWEB-010 — No `.env.example` or Environment Variable Documentation

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-010 |
| Severity    | MEDIUM |
| Area        | Documentation / DevEx |
| Evidence    | No `.env.example` file found. `.gitignore` excludes `.env*.local`. No documentation of what environment variables the app expects or uses. |
| Impact      | Contributors don't know what to configure. The app currently uses no server-side env vars (all config is client-side via localStorage), but this should be documented explicitly. |
| Remediation | Create `.env.example` documenting that this is a client-side app with no required env vars. Mention the Vercel deployment context. |
| Effort      | XS |
| Blocks      | — |
| Confidence  | HIGH |

---

## [MEDIUM] GNWEB-011 — Hardcoded Proxy URL

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-011 |
| Severity    | MEDIUM |
| Area        | API / Contract |
| Evidence    | `src/services/git-clone.ts` line 21: `const HOSTED_PROXY_URL = 'https://soleil-ai-review-engine.vercel.app/api/proxy'`. If the Vercel deployment URL changes or a fork deploys to a different domain, the dev proxy breaks. |
| Impact      | Dev-mode git cloning fails silently for forks or domain changes. |
| Remediation | Make this configurable via `import.meta.env.VITE_PROXY_URL` with a documented default. |
| Effort      | XS |
| Blocks      | — |
| Confidence  | HIGH |

---

## [MEDIUM] GNWEB-012 — Cypher Injection via String Interpolation

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-012 |
| Severity    | MEDIUM |
| Area        | Security |
| Evidence    | `src/core/llm/tools.ts` line 100: `MATCH (n:${nodeLabel} {id: '${nodeId.replace(/'/g, "''")}'})`. The `nodeId` is from search results (user-influenced via LLM). While single-quote escaping is applied, the `nodeLabel` from `nodeId.split(':')[0]` is injected unescaped into the Cypher query as a label name. Similar patterns at lines 139, 161, 663-668, 787-800. |
| Impact      | If a node ID contains a manipulated label prefix, it could alter the Cypher query structure. Risk is mitigated by the fact that node IDs come from the graph (not raw user input) and LadybugDB runs in-browser (no server-side DB). But the pattern is still unsafe for future backend modes. |
| Remediation | Validate `nodeLabel` against an allowlist of known labels: `['File', 'Folder', 'Function', 'Class', 'Interface', 'Method', 'CodeElement', 'Community', 'Process']`. Use parameterized queries where LadybugDB supports them. |
| Effort      | S |
| Blocks      | — |
| Confidence  | MEDIUM — mitigated by client-side-only execution model |

---

## [MEDIUM] GNWEB-013 — Duplicated Pipeline Logic

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-013 |
| Severity    | MEDIUM |
| Area        | Code Organization |
| Evidence    | `App.tsx` has three near-identical blocks: `handleFileSelect` (lines 47-90), `handleGitClone` (lines 92-133), and `handleServerConnect` (lines 135-174). Each sets progress, transitions view, initializes agent, starts embeddings with the same WebGPU→WASM fallback pattern. The worker also duplicates `runPipeline` and `runPipelineFromFiles` (lines 155-312) with identical post-processing. |
| Impact      | Bug fixes must be applied in 3+ locations. The embeddings fallback (WebGPU→WASM) is copied 4 times. |
| Remediation | Extract a `loadRepository(graph, fileContents, projectName)` function that handles the common post-load logic (setGraph, setFileContents, initializeAgent, startEmbeddings, view transition). |
| Effort      | S |
| Blocks      | — |
| Confidence  | HIGH |

---

## [MEDIUM] GNWEB-014 — `SettingsPanel.tsx` is 869 Lines

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-014 |
| Severity    | MEDIUM |
| Area        | Frontend Quality |
| Evidence    | `src/components/SettingsPanel.tsx` — 869 lines. Contains an internal `OpenRouterModelCombobox` component (lines 31-187), `checkOllamaStatus` helper (lines 192-213), and 6 provider-specific form sections with repeated input patterns. |
| Impact      | Hard to maintain, test, or modify individual provider forms. |
| Remediation | Extract each provider form into a separate component (`OpenAISettingsForm`, `GeminiSettingsForm`, etc.). Extract `OpenRouterModelCombobox` to its own file. |
| Effort      | S |
| Blocks      | — |
| Confidence  | HIGH |

---

## [MEDIUM] GNWEB-015 — No AbortController for LLM Streams

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-015 |
| Severity    | MEDIUM |
| Area        | Failure-path Engineering |
| Evidence    | `ingestion.worker.ts` line 725: `chatCancelled = false` — cancellation uses a boolean flag, not AbortController. `streamAgentResponse` in `agent.ts` (line 314) creates a LangGraph stream without passing an AbortSignal. The `stopChat()` method (line 749) sets the flag but the HTTP request to the LLM provider continues. |
| Impact      | "Stop" button in chat UI stops reading chunks but doesn't cancel the HTTP stream. Tokens continue billing. For long-running agent loops (recursionLimit: 50), this can be expensive. |
| Remediation | Pass an `AbortController.signal` to the LangGraph `agent.stream()` call and abort on stop. |
| Effort      | M |
| Blocks      | — |
| Confidence  | HIGH |

---

## [MEDIUM] GNWEB-016 — No Loading State for Initial Worker Setup

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-016 |
| Severity    | MEDIUM |
| Area        | Failure-path Engineering |
| Evidence    | `useAppState.tsx` line 428: Worker is created in a `useEffect` with no loading indication. `apiRef.current` is null until the worker loads. If a user drops a ZIP before the worker loads, `runPipeline` throws "Worker not initialized" (line 449). |
| Impact      | Race condition on fast-acting users. Error message is not user-friendly. |
| Remediation | Add a `workerReady` state. Show a brief loading indicator or disable the DropZone until worker is initialized. |
| Effort      | S |
| Blocks      | — |
| Confidence  | HIGH |

---

## [MEDIUM] GNWEB-017 — `tools.ts` is 1504 Lines

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-017 |
| Severity    | MEDIUM |
| Area        | Code Organization |
| Evidence    | `src/core/llm/tools.ts` — 1504 lines containing all 7 tool implementations inline. The `impactTool` alone (not shown in view but in the file) likely spans several hundred lines. |
| Impact      | Hard to navigate, test, or modify individual tools. |
| Remediation | Extract each tool into its own file under `src/core/llm/tools/`. Keep the barrel export in `tools.ts`. |
| Effort      | S |
| Blocks      | — |
| Confidence  | HIGH |

---

## [MEDIUM] GNWEB-018 — No Stale Data Protection on Repo Switch

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-018 |
| Severity    | MEDIUM |
| Area        | State Management |
| Evidence    | `useAppState.tsx` `switchRepo` (line 976) clears highlights and selections, but does NOT reset `chatMessages`, `isAgentReady`, or `embeddingStatus`. The agent is re-initialized (line 1022), but old chat history from a previous repo remains visible and could confuse the LLM. |
| Impact      | After switching repos, the chat panel shows stale conversations about a different codebase. The LLM receives old context mixed with new. |
| Remediation | Add `clearChat()` and `setEmbeddingStatus('idle')` to `switchRepo`. |
| Effort      | XS |
| Blocks      | — |
| Confidence  | HIGH |

---

## [MEDIUM] GNWEB-019 — Graph `.nodes` Getter Creates Array on Every Access

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-019 |
| Severity    | MEDIUM |
| Area        | Performance |
| Evidence    | `src/core/graph/graph.ts` line 21: `get nodes() { return Array.from(nodeMap.values()) }`. Every access to `.nodes` creates a new array. The getter is called in loops throughout `useAppState.tsx` (e.g., line 350, 783, 884, 913) and in `tools.ts` search results processing. |
| Impact      | O(n) array creation on every node lookup. For a 2000-node graph, this is 2000 object references copied on each call. In render loops (e.g., sigma reducers), this multiplies significantly. |
| Remediation | Cache the array and invalidate on `addNode`. Or better: provide `getNode(id)`, `findNodes(predicate)` methods that use the Map directly. |
| Effort      | S |
| Blocks      | — |
| Confidence  | HIGH |

---

## [MEDIUM] GNWEB-020 — No Accessibility Posture

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-020 |
| Severity    | MEDIUM |
| Area        | Frontend Quality |
| Evidence    | `index.html` has `lang="en"` (good). But: no skip-nav link, no ARIA labels on interactive elements in `DropZone.tsx` (the file input is `hidden` with a div click handler — line 262), no keyboard navigation for the graph canvas, no `aria-live` regions for progress updates. `SettingsPanel.tsx` modal has no focus trapping. |
| Impact      | Screen reader users and keyboard-only users cannot effectively use the application. |
| Remediation | Add ARIA attributes to DropZone, focus trapping to SettingsPanel modal, `aria-live` to progress indicators. |
| Effort      | M |
| Blocks      | — |
| Confidence  | HIGH |

---

## [MEDIUM] GNWEB-021 — No Responsive Design Signals

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-021 |
| Severity    | MEDIUM |
| Area        | Frontend Quality |
| Evidence    | `index.html` has `viewport` meta tag. CSS uses Tailwind responsive classes minimally (one `sm:grid-cols-3` in SettingsPanel). The main layout in `App.tsx` (line 271) is `flex flex-col h-screen` with multi-panel layout — no responsive breakpoints for mobile. |
| Impact      | Application is unusable on mobile or narrow screens. Graph canvas, file tree, and chat panels stack or overflow. |
| Remediation | This is likely intentional (desktop tool), but should be documented. A minimum-width CSS guard with a "best viewed on desktop" message for small screens would improve UX. |
| Effort      | S |
| Blocks      | — |
| Confidence  | MEDIUM — may be intentional for a dev tool |

---

## [MEDIUM] GNWEB-022 — Large Bundle Risk from LangChain Suite

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-022 |
| Severity    | MEDIUM |
| Area        | Performance |
| Evidence    | `package.json` includes `@langchain/anthropic`, `@langchain/core`, `@langchain/google-genai`, `@langchain/langgraph`, `@langchain/ollama`, `@langchain/openai`, `langchain` — 7 LangChain packages. Also includes `mermaid`, `d3`, `sigma`, `graphology` (4 packages), `@huggingface/transformers`, `web-tree-sitter`. No code-splitting or lazy loading signals in the route structure (no router, single component tree). |
| Impact      | Initial bundle likely exceeds 2MB+. Users must download all LLM provider SDKs even if they only use one. WASM files for tree-sitter and LadybugDB add further weight. |
| Remediation | 1) Lazy-load the worker (already done via Web Worker). 2) Dynamic `import()` for provider-specific LangChain packages based on selected provider. 3) Add Vite bundle analyzer to measure. |
| Effort      | M |
| Blocks      | — |
| Confidence  | MEDIUM — actual bundle size not measured, inferred from dep list |

---

## [LOW] GNWEB-023 — Debug Logging in Production Code

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-023 |
| Severity    | LOW |
| Area        | Code Quality |
| Evidence    | `agent.ts` lines 202-208: `console.log('🌐 OpenRouter config:', ...)` — guarded by `import.meta.env.DEV`. Most debug logs are properly gated. But `proxy.ts` line 100: `console.error('Proxy error:', error)` — always logs. `App.tsx` line 78: `console.error('Pipeline error:', error)` — always logs. Worker lines 161, 173: `console.log` always active. |
| Impact      | Minor information leakage in production console. Not a security issue but noise. |
| Remediation | Gate all `console.log` behind `import.meta.env.DEV`. `console.error` on the proxy is acceptable. |
| Effort      | XS |
| Blocks      | — |
| Confidence  | HIGH |

---

## [LOW] GNWEB-024 — `any` Types in Worker and Tools

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-024 |
| Severity    | LOW |
| Area        | Code Quality |
| Evidence    | `ingestion.worker.ts` line 684: `(err: any)`. `tools.ts` line 23: `executeQuery: (cypher: string) => Promise<any[]>`. `useAppState.tsx` line 22: `Record<string, any>[]` in `QueryResult`. `agent.ts` lines 290-292: `as any` casts for LangGraph compatibility. `server-connection.ts` line 124: `(node.properties as any).content`. |
| Impact      | TypeScript strict mode is on but these escape hatches reduce type safety at critical boundaries (query results, agent responses). |
| Remediation | Define proper return types for `executeQuery`. Use Zod schemas to validate query results. Define a `LadybugDBQueryResult` type. |
| Effort      | M |
| Blocks      | — |
| Confidence  | HIGH |

---

## [LOW] GNWEB-025 — No Retry Logic on Network Failures

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-025 |
| Severity    | LOW |
| Area        | Failure-path Engineering |
| Evidence    | `services/server-connection.ts` `fetchGraph` (line 77): single `fetch` call, no retry. `services/backend.ts` `fetchWithTimeout` (line 41): single attempt with timeout. `services/git-clone.ts`: single `git.clone` call, no retry. |
| Impact      | Transient network failures cause hard errors. The user must manually retry by clicking "Connect" again. |
| Remediation | Add a simple retry wrapper (2 retries with exponential backoff) for `connectToServer` and `fetchGraph`. |
| Effort      | S |
| Blocks      | — |
| Confidence  | HIGH |

---

## [LOW] GNWEB-026 — Inconsistent Error Display Duration

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-026 |
| Severity    | LOW |
| Area        | UX |
| Evidence    | `App.tsx` line 85-88: Pipeline error auto-dismisses after 3000ms. `useAppState.tsx` line 1038: Repo switch error also 3000ms. But `DropZone.tsx` errors persist until manually cleared (no auto-dismiss). |
| Impact      | Inconsistent error UX. Some errors flash briefly, others persist. 3s may not be enough for users to read the message. |
| Remediation | Standardize on a toast/notification system with configurable duration. |
| Effort      | S |
| Blocks      | — |
| Confidence  | HIGH |

---

## [LOW] GNWEB-027 — `clearAICodeReferences` has Stale Dependency

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-027 |
| Severity    | LOW |
| Area        | State Management |
| Evidence    | `useAppState.tsx` line 413: `}, [queryResult, selectedNode])` — the `clearAICodeReferences` callback lists `queryResult` as a dependency, but `queryResult` is not used in the function body. This creates unnecessary re-creation of the callback when query results change. |
| Impact      | Minor: unnecessary callback re-creation. Could cause downstream `sendChatMessage` (which depends on `clearAICodeReferences`) to also re-create unnecessarily. |
| Remediation | Remove `queryResult` from the dependency array. |
| Effort      | XS |
| Blocks      | — |
| Confidence  | HIGH |

---

## [INFO] GNWEB-028 — TypeScript Compiles Clean

| Field       | Value |
|-------------|-------|
| ID          | GNWEB-028 |
| Severity    | INFO |
| Area        | Code Quality |
| Evidence    | `npx tsc -b --noEmit` exits with code 0, zero diagnostics. `tsconfig.app.json` line 12: `"strict": true`. |
| Impact      | Positive signal — the codebase has no type errors despite heavy use of generics and union types. |
| Remediation | N/A — maintain this standard. Add `typecheck` to CI gatekeeping. |
| Effort      | — |
| Blocks      | — |
| Confidence  | HIGH — verified via command execution |
