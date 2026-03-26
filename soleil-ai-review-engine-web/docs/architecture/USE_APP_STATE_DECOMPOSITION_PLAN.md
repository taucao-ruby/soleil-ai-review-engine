# `useAppState` Decomposition Plan

Date: 2026-03-26

## Finding

GNW-004 [CONFIRMED]: `src/hooks/useAppState.tsx` is 1111 lines, carries roughly 60 state values and methods, and exposes a single React Context.
Every consumer re-renders on any context change even though the provider value is memoized, which reduces some churn but does not change the architectural blast radius.

## Goal

Split the current god-context into smaller providers that match actual change domains.
Keep behavior stable while reducing cross-domain rerenders, lowering coupling, and making later refactors testable in smaller slices.

## Execution Rules

- Do not batch phases. Each phase is a separate PR.
- Add at least one integration-level test for the target domain before moving state out of `useAppState.tsx`.
- Keep a backwards-compatibility bridge so components can migrate one at a time.
- Do low-risk state first and leave graph data for last.

## Current Domain Mapping

| Planned domain | Current `useAppState.tsx` ownership | Notes |
| --- | --- | --- |
| UI state | `viewMode`, `isSettingsPanelOpen`, `isRightPanelOpen`, `selectedNode`, highlight sets, `agentError` | This is the concrete code mapping for the review shorthand `showSettings`, `showQuery`, `isRightPanelExpanded`, `selectedNode`, `highlights`, `error`. |
| Chat state | `chatMessages`, `sendChatMessage`, `isChatLoading`, `agentError`, `stopChatResponse`, `clearAICodeReferences` | The extraction should expose a `stopChat` alias while keeping `stopChatResponse` during migration. |
| Embedding state | `embeddingStatus`, `embeddingProgress`, `startEmbeddings` | Tight scope, few consumers, low coupling to the rest of the UI. |
| Graph state | `graph`, `fileContents`, `queryResult`, graph highlight sets | `sigmaInstance`, `communities`, and `processes` are currently coordinated outside this file and should be consolidated here during the final phase instead of moved blindly. |

## Phase 1: Extract UIStateProvider (LOW RISK)

**What moves**

- `viewMode`
- `showSettings`
- `showQuery`
- `isRightPanelExpanded`
- `selectedNode`
- `highlights`
- `error`

Implementation note: in current code this maps to `viewMode`, `isSettingsPanelOpen`, `isRightPanelOpen`, `selectedNode`, the highlight-related sets, and `agentError`.

**New file**

- `src/hooks/useUIState.tsx`

**Why first**

- The UI slice has the least direct dependency on worker APIs.
- It removes high-frequency modal and panel toggles from the app-wide context first.
- It gives the team a low-risk migration template for later providers.

**Concrete implementation steps**

1. Create `UIStateProvider` and `useUIState` in `src/hooks/useUIState.tsx`.
2. Move the selected UI state plus setter functions into the new provider.
3. Keep highlight manipulation helpers in the UI provider for now so selection, panels, and visual emphasis move together.
4. Update components that only read UI state to use `useUIState()` directly.
5. Keep `useAppState()` as a bridge that re-exports the UI slice for untouched consumers.

**Consumer impact**

Components that only read UI state stop re-rendering on graph or chat changes.

**Validation**

- Build passes.
- Manual test: open settings, close settings, verify no graph re-render.

**Estimated effort**

- S (2-4 hours)

## Phase 2: Extract ChatStateProvider (MEDIUM RISK)

**What moves**

- `chatMessages`
- `sendChatMessage`
- `isSendingChat`
- `chatError`
- `stopChat`
- `clearAICodeReferences`

Implementation note: in current code this maps to `chatMessages`, `sendChatMessage`, `isChatLoading`, `agentError`, `stopChatResponse`, and `clearAICodeReferences`.

**New file**

- `src/hooks/useChatState.tsx`

**Dependency**

- Needs reference to worker API for `sendChatMessage`.

**Why second**

- Chat state changes frequently and currently invalidates graph consumers.
- The boundary is coherent once the worker bridge is injected cleanly.
- It lets the team isolate streaming, cancellation, and tool-call state without touching graph ownership yet.

**Concrete implementation steps**

1. Define a `ChatStateProvider` that receives the worker bridge and graph lookup helpers it needs via props or a narrow internal dependency hook.
2. Move message list state, loading state, current tool-call state, cancellation, and code-reference cleanup into the provider.
3. Export `stopChat` as the new public name and keep `stopChatResponse` on the bridge until all consumers are migrated.
4. Move chat-only consumers to `useChatState()` first, then migrate shared panels.
5. Leave graph mutation side effects explicit at the boundary so chat logic does not silently reach back into graph state.

**Consumer impact**

Chat panel rerenders are isolated from graph and general UI state.

**Validation**

- Build passes.
- Test: send a message, verify graph panel does not re-render.

**Estimated effort**

- M (4-8 hours)

## Phase 3: Extract EmbeddingStateProvider (LOW RISK)

**What moves**

- `embeddingStatus`
- `embeddingProgress`
- `startEmbeddings`

**New file**

- `src/hooks/useEmbeddingState.tsx`

**Why third**

- The state surface is small and already cohesive.
- Only a limited set of components care about embedding progress.
- It removes another noisy update stream from the app-wide context before the graph slice is attempted.

**Concrete implementation steps**

1. Create `EmbeddingStateProvider` and `useEmbeddingState`.
2. Move progress/status state and the `startEmbeddings` action behind that provider.
3. Keep the worker dependency narrow: only expose the methods needed to start embeddings and consume progress callbacks.
4. Update status bar and related onboarding/status surfaces to use the dedicated hook.
5. Leave semantic search in its current location until Phase 4 if moving it would widen scope.

**Consumer impact**

Only the status bar and embedding-related surfaces re-render during embedding progress updates.

**Validation**

- Build passes.
- Test: start embedding, verify chat and graph do not re-render.

**Estimated effort**

- S (2-4 hours)

## Phase 4: Extract GraphDataProvider (HIGH RISK, DO LAST)

**What moves**

- `graphData`
- `fileContents`
- `sigmaInstance`
- `queryResult`
- `communities`
- `processes`

Implementation note: current code owns `graph`, `fileContents`, `queryResult`, and highlight sets in `useAppState.tsx`; `sigmaInstance`, `communities`, and `processes` are coordinated elsewhere and should be consolidated here during this phase.

**New file**

- `src/hooks/useGraphState.tsx`

**Dependency**

- Most complex domain. Graph data feeds into the agent, tools, and multiple UI panels.

**Why last**

- This is the highest-coupling slice in the app.
- It crosses the worker boundary, Sigma integration, query tooling, and code-reference rendering.
- Doing it last lets the team reuse the provider and migration patterns proven in Phases 1-3.

**Concrete implementation steps**

1. Create `GraphDataProvider` and move graph ownership, file contents, query results, and graph highlight state into it.
2. Define a single graph-facing API for load, clear, select, query, and rerender-triggering operations.
3. Pull `sigmaInstance` ownership behind a narrow adapter so `useSigma.ts` depends on `useGraphState()` instead of the other way around.
4. Consolidate `communities` and `processes` access under the same provider even if their current source of truth is outside `useAppState.tsx`.
5. Migrate graph canvas, file tree, query surfaces, and any agent helpers that read graph data.
6. Remove duplicate graph clearing or reset logic that currently exists across `App.tsx`, `useSigma.ts`, and `useAppState.tsx`.

**Consumer impact**

Graph-heavy operations become isolated from chat and general UI state.

**Validation**

- Full regression: build + all tests.
- Manual: load repo, run query, verify results.

**Estimated effort**

- L (1-2 days)

## Backwards Compatibility Bridge

```typescript
// src/hooks/useAppState.tsx (after all phases)
// Thin barrel that composes all providers for gradual migration
export function useAppState() {
  const ui = useUIState();
  const chat = useChatState();
  const embedding = useEmbeddingState();
  const graph = useGraphState();
  return { ...ui, ...chat, ...embedding, ...graph };
}
```

Components can migrate one at a time from `useAppState()` to specific hooks.
During migration, keep compatibility aliases such as `stopChatResponse` where current consumers still rely on the old name.

## Pre-conditions Before Starting

- All tests from Prompt A must be passing.
- Add at least 1 integration-level test for each state domain before extracting it.
- Each phase is a separate PR; do not batch.

## PR Sequence

| PR | Scope | Exit criteria |
| --- | --- | --- |
| PR-1 | `UIStateProvider` extraction | UI-only consumers moved; settings toggle does not re-render graph |
| PR-2 | `ChatStateProvider` extraction | Chat panel isolated; send/stop flow still works |
| PR-3 | `EmbeddingStateProvider` extraction | Embedding progress isolated to status surfaces |
| PR-4 | `GraphDataProvider` extraction | Full regression passes; old graph ownership removed |

## Done Criteria

- Domain-specific consumers no longer import the full `useAppState()` hook when they only need one slice.
- Each provider owns one coherent update domain and has explicit dependencies.
- Provider composition replaces the monolithic context without changing user-visible behavior.
- Rerender behavior is measurably narrower in manual verification for each phase.
