# soleil-ai-review-engine-Web — Executive Summary

## Repository Characterization

soleil-ai-review-engine-Web is a **browser-based code intelligence tool** that builds knowledge graphs from source code using Tree-sitter parsing, WASM-based graph database (LadybugDB), client-side embeddings (HuggingFace Transformers), and a multi-provider LLM agent (LangChain/LangGraph). It supports 6 LLM providers, runs entirely client-side (no custom backend required), and deploys to Vercel. The ingestion pipeline runs in a Web Worker. The codebase is ~8,000 lines of TypeScript across 70+ files. It is part of a larger soleil-ai-review-engine ecosystem with a CLI/server component.

## Verdict

**`EARLY / FRAGILE`** — Prototype quality. The engineering ideas are strong and the technical ambition is impressive, but the codebase lacks the structural guardrails required for team collaboration, production reliability, or confident iteration. Zero tests, zero lint configuration, zero CI gates, a single god-hook managing all application state, and no error boundaries make this brittle against regressions and runtime failures.

## Top 5 Strengths (evidence-backed)

1. **Clean TypeScript with strict mode** — `tsc -b --noEmit` compiles with 0 errors. Union types for node labels, relationship types, and LLM providers are well-designed (GNWEB-028).
2. **Sophisticated architecture pattern** — Web Worker + Comlink for heavy processing, WASM Graph DB, client-side embeddings with WebGPU→WASM fallback — demonstrates deep browser API knowledge.
3. **Multi-provider LLM abstraction** — 6 providers (OpenAI, Azure, Gemini, Anthropic, Ollama, OpenRouter) cleanly abstracted via `ProviderConfig` union type and `createChatModel` factory (GNWEB-028).
4. **Coherent design system** — Tailwind v4 `@theme` with named semantic tokens (`void`, `surface`, `elevated`, `accent`), consistent dark mode, proper typography (Outfit + JetBrains Mono).
5. **CORS proxy security** — `api/proxy.ts` correctly restricts to GitHub hostname allowlist with `endsWith` matching, preventing SSRF to arbitrary domains (GNWEB-008 partial).

## Top 5 Weaknesses (evidence-backed)

1. **Zero test coverage** — No test framework, no test files, no test script (GNWEB-001).
2. **No CI/lint gates** — No ESLint, no CI config, no pre-commit hooks (GNWEB-002).
3. **God hook anti-pattern** — `useAppState.tsx` (1198 lines, ~60 state values) in a single Context without memoization causes cascading re-renders (GNWEB-003, GNWEB-009).
4. **No error boundary** — Uncaught rendering errors crash the entire app to a white screen (GNWEB-005).
5. **Plaintext API key storage** — All LLM provider API keys stored in `localStorage` without encryption (GNWEB-004).

## Top 3 Operational/Architectural Risks

1. **Regression risk** — Any change to the pipeline, tools, or state management is completely unguarded by tests. The 1504-line `tools.ts`, 1198-line `useAppState.tsx`, and 899-line `ingestion.worker.ts` are high-change, high-risk, zero-coverage files.
2. **State management collapse** — The single-context architecture will not scale beyond the current feature set without severe performance and maintainability degradation.
3. **Bundle weight** — 7 LangChain packages, mermaid, d3, sigma, graphology, HuggingFace transformers, and tree-sitter all loaded eagerly. No code-splitting beyond the web worker.

## This Week

1. **Add Vitest + write 5 critical unit tests** (GNWEB-001) — `createKnowledgeGraph`, `normalizeServerUrl`, `parseGitHubUrl`, `serializePipelineResult`, `loadSettings`.
2. **Add Error Boundary** (GNWEB-005) — Single component, wraps `<AppContent />`.
3. **Delete one lockfile, add `packageManager`** (GNWEB-006).
4. **Add `useMemo` to context value** (GNWEB-009) — One-line fix, immediate performance improvement.
5. **Create README.md** (GNWEB-007) — Setup instructions, architecture overview.
