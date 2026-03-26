# GitNexus-Web — Remediation Plan

Each batch has a clear objective, the GNWEB IDs it addresses, rationale for ordering, and validation commands.

---

## Batch 0 — Correctness / Security Blockers

**Objective:** Establish minimum safety floor. No new features until these are in place.

**Findings addressed:** GNWEB-005, GNWEB-006, GNWEB-009, GNWEB-027

| Action | Finding | Specific Change |
|--------|---------|-----------------|
| Add React Error Boundary | GNWEB-005 | Create `src/components/ErrorBoundary.tsx`, wrap `<AppContent />` in `App.tsx` |
| Delete duplicate lockfile | GNWEB-006 | Remove `pnpm-lock.yaml` (or `package-lock.json`), add `"packageManager"` field |
| Memoize context value | GNWEB-009 | Wrap `value` object in `useMemo` in `useAppState.tsx` line 1094 |
| Fix stale dependency | GNWEB-027 | Remove `queryResult` from `clearAICodeReferences` deps array |
| Restrict CORS proxy origin | GNWEB-008 | Replace `Access-Control-Allow-Origin: *` with deployed origin |

**Rationale:** These are XS-S effort fixes that prevent crashes, build non-determinism, and performance issues. None require architectural changes.

**Validation:**
```bash
npm run build                    # Confirms build works with single lockfile
npx tsc -b --noEmit             # Type safety maintained
# Manual: trigger a rendering error and verify ErrorBoundary catches it
```

**Residual risk after batch:** No test coverage yet. API key storage unchanged.

---

## Batch 1 — Architecture Stabilization

**Objective:** Break the god-hook, reduce file sizes, eliminate duplication.

**Findings addressed:** GNWEB-003, GNWEB-013, GNWEB-014, GNWEB-017, GNWEB-018, GNWEB-019

| Action | Finding | Specific Change |
|--------|---------|-----------------|
| Split `useAppState` into domain contexts | GNWEB-003 | Create `GraphStateProvider`, `ChatStateProvider`, `UIStateProvider`, `EmbeddingStateProvider` |
| Extract `loadRepository` helper | GNWEB-013 | Create `src/hooks/useRepositoryLoader.ts` with shared post-load logic |
| Split `SettingsPanel` | GNWEB-014 | Extract per-provider form components + `OpenRouterModelCombobox` |
| Split `tools.ts` | GNWEB-017 | Create `src/core/llm/tools/` directory with one file per tool |
| Clear chat on repo switch | GNWEB-018 | Add `clearChat()` + `setEmbeddingStatus('idle')` to `switchRepo` |
| Cache graph node array | GNWEB-019 | Add `nodeArrayCache` to `createKnowledgeGraph`, invalidate on `addNode` |

**Rationale:** Architecture improvements unlock testability (Batch 3) and reduce the blast radius of future changes.

**Validation:**
```bash
npm run build
npx tsc -b --noEmit
# Manual: load a repo, switch repos, verify no stale state
```

**Residual risk after batch:** Still no tests. Security posture unchanged.

---

## Batch 2 — Failure-Path Hardening

**Objective:** Handle failure modes that currently crash or confuse users.

**Findings addressed:** GNWEB-015, GNWEB-016, GNWEB-025, GNWEB-026

| Action | Finding | Specific Change |
|--------|---------|-----------------|
| Add AbortController to LLM streams | GNWEB-015 | Pass `AbortSignal` to `agent.stream()` in `streamAgentResponse` |
| Add `workerReady` state | GNWEB-016 | Track worker initialization, disable DropZone until ready |
| Add retry wrapper for network calls | GNWEB-025 | Create `fetchWithRetry` in `services/`, use in `connectToServer` and `fetchGraph` |
| Standardize error display | GNWEB-026 | Create a toast notification system, replace `setTimeout` patterns |

**Rationale:** Failure-path hardening directly impacts user trust and perceived quality.

**Validation:**
```bash
# Manual: disconnect network during graph download, verify retry
# Manual: click "Stop" during chat, verify stream actually stops
# Manual: drop ZIP before worker loads, verify graceful message
```

**Residual risk after batch:** No tests yet. Bundle size unaddressed.

---

## Batch 3 — Test and CI Gates

**Objective:** Establish automated quality enforcement.

**Findings addressed:** GNWEB-001, GNWEB-002, GNWEB-012, GNWEB-024

| Action | Finding | Specific Change |
|--------|---------|-----------------|
| Add Vitest | GNWEB-001 | `npm i -D vitest @testing-library/react`, add `"test"` script |
| Write unit tests for core functions | GNWEB-001 | Test: `createKnowledgeGraph`, `normalizeServerUrl`, `parseGitHubUrl`, `serializePipelineResult`, `loadSettings`, `saveSettings`, `extractInstanceName`, `resolveFilePath` |
| Add ESLint 9 flat config | GNWEB-002 | `npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`, create `eslint.config.mjs` |
| Add GitHub Actions CI | GNWEB-002 | `.github/workflows/ci.yml` running `lint`, `typecheck`, `test`, `build` |
| Add nodeLabel allowlist validation | GNWEB-012 | Validate `nodeLabel` against known labels before Cypher interpolation |
| Type query results | GNWEB-024 | Define `LbugQueryResult` type, replace `any[]` returns |

**Rationale:** Tests and CI are delayed to Batch 3 so they can test the improved architecture from Batch 1, not the god-hook.

**Validation:**
```bash
npm run lint                    # ESLint passes
npm run typecheck               # TypeScript passes
npm test                        # Vitest passes
npm run build                   # Production build succeeds
```

**Residual risk after batch:** Security posture (API keys) and bundle size still unaddressed.

---

## Batch 4 — Maintainability and Documentation

**Objective:** Documentation, developer experience, and production polish.

**Findings addressed:** GNWEB-004, GNWEB-007, GNWEB-010, GNWEB-011, GNWEB-020, GNWEB-021, GNWEB-022, GNWEB-023

| Action | Finding | Specific Change |
|--------|---------|-----------------|
| Create README.md | GNWEB-007 | Setup, architecture, scripts, design decisions |
| Create `.env.example` | GNWEB-010 | Document that no env vars are required; explain client-side model |
| Make proxy URL configurable | GNWEB-011 | Use `import.meta.env.VITE_PROXY_URL` with documented default |
| Add API key storage warning | GNWEB-004 | Banner in SettingsPanel explaining localStorage model |
| Gate debug logging | GNWEB-023 | Wrap all `console.log` in `import.meta.env.DEV` |
| Add basic ARIA attributes | GNWEB-020 | Focus trapping in modal, `aria-live` on progress, accessible DropZone |
| Add mobile guard | GNWEB-021 | Min-width CSS with "best on desktop" message |
| Add bundle analyzer | GNWEB-022 | `npm i -D rollup-plugin-visualizer`, add `"analyze"` script |
| Dynamic provider imports | GNWEB-022 | Lazy-load `@langchain/*` packages based on selected provider |

**Rationale:** These are lower-risk improvements that improve DX and production readiness without architectural changes.

**Validation:**
```bash
npm run build
npm run analyze                 # Review bundle composition
# Manual: verify README setup instructions work end-to-end
# Manual: verify ARIA attributes with screen reader
```

**Residual risk after batch:** None critical. System is production-capable with conditions.
