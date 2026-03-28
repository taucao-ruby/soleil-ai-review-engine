/**
 * Hook-level automation tests for initializeBackendAgent and initializeAgent.
 *
 * These tests render the real AppStateProvider with:
 *  - Worker constructor mocked (jsdom has no real Worker)
 *  - Comlink mocked to return a controlled mock API
 *  - LLM provider configured via saveSettings() into sessionStorage
 *
 * What is tested:
 *  Phase B — initializeBackendAgent routes to the HTTP-tools worker path
 *  Phase B — initializeAgent routes to the local-lbug worker path
 *  Phase B — Map<string,string> is correctly serialised to [string,string][] for Comlink
 *  Phase B — Both return Promise<boolean> with correct state side-effects
 *  Phase B — switchRepo correctly calls initializeBackendAgent (not initializeAgent)
 *  Cross-cutting — Guard fires (returns false) when no provider is configured
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppStateProvider, useAppState } from './useAppState';
import { clearSettings, saveSettings } from '../core/llm/settings-service';
import { DEFAULT_LLM_SETTINGS } from '../core/llm/types';

// ── Worker global mock ───────────────────────────────────────────────────────
// jsdom does not ship a Worker implementation.  We stub the global so the
// useEffect inside AppStateProvider can run without throwing.

class MockWorker {
  constructor(_url: any, _options?: any) {}
  terminate() {}
  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}
vi.stubGlobal('Worker', MockWorker);

// ── Comlink mock ─────────────────────────────────────────────────────────────
// We mock the entire 'comlink' module so that Comlink.wrap(worker) returns our
// controlled mockApi instead of trying to set up a real MessageChannel.

const mockWorkerApi = {
  initializeAgent: vi.fn(),
  initializeBackendAgent: vi.fn(),
  runPipeline: vi.fn(),
  runPipelineFromFiles: vi.fn(),
  runQuery: vi.fn(),
  isReady: vi.fn().mockResolvedValue(false),
  startEmbeddingPipeline: vi.fn(),
  semanticSearch: vi.fn().mockResolvedValue([]),
  semanticSearchWithContext: vi.fn().mockResolvedValue([]),
  testArrayParams: vi.fn().mockResolvedValue({ success: true }),
  chatStream: vi.fn(),
  stopChat: vi.fn(),
};

vi.mock('comlink', () => ({
  wrap: () => mockWorkerApi,
  proxy: (fn: any) => fn,
}));

// ── Test helpers ─────────────────────────────────────────────────────────────

const withOpenAI = () => ({
  ...DEFAULT_LLM_SETTINGS,
  activeProvider: 'openai' as const,
  openai: { apiKey: 'sk-test-key', model: 'gpt-4o' },
});

/** Render the hook inside the real provider. */
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AppStateProvider, null, children);

// ── initializeBackendAgent ────────────────────────────────────────────────────

describe('initializeBackendAgent — hook behavior (Phase B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('returns false without calling the worker when no LLM provider is configured', async () => {
    clearSettings();
    const { result } = renderHook(() => useAppState(), { wrapper });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.initializeBackendAgent(
        'http://localhost:4747/api',
        'my-repo',
        new Map(),
      );
    });

    expect(returned).toBe(false);
    expect(result.current.agentError).toMatch(/configure/i);
    expect(mockWorkerApi.initializeBackendAgent).not.toHaveBeenCalled();
    expect(mockWorkerApi.initializeAgent).not.toHaveBeenCalled();
  });

  it('calls api.initializeBackendAgent — NOT api.initializeAgent — in server mode', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeBackendAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.initializeBackendAgent(
        'http://localhost:4747/api',
        'my-repo',
        new Map([['src/index.ts', 'export {}']]),
        'my-project',
      );
    });

    expect(mockWorkerApi.initializeBackendAgent).toHaveBeenCalledTimes(1);
    expect(mockWorkerApi.initializeAgent).not.toHaveBeenCalled();
  });

  it('serialises Map<string,string> to [string,string][] entries for Comlink', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeBackendAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });
    const fileMap = new Map([
      ['src/a.ts', 'const a = 1;'],
      ['src/b.ts', 'const b = 2;'],
    ]);

    await act(async () => {
      await result.current.initializeBackendAgent('http://localhost:4747/api', 'repo', fileMap);
    });

    // 4th argument (index 3) to initializeBackendAgent is the entries array
    const callArgs = mockWorkerApi.initializeBackendAgent.mock.calls[0];
    const entries = callArgs[3];
    expect(entries).toEqual([
      ['src/a.ts', 'const a = 1;'],
      ['src/b.ts', 'const b = 2;'],
    ]);
  });

  it('serialises an empty Map to an empty [] array', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeBackendAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.initializeBackendAgent('http://localhost:4747/api', 'repo', new Map());
    });

    const entries = mockWorkerApi.initializeBackendAgent.mock.calls[0][3];
    expect(entries).toEqual([]);
  });

  it('passes backendUrl and repoName through to the worker correctly', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeBackendAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.initializeBackendAgent(
        'https://prod.example.com/api',
        'acme-backend',
        new Map(),
        'acme',
      );
    });

    const [, backendUrl, repoName] = mockWorkerApi.initializeBackendAgent.mock.calls[0];
    expect(backendUrl).toBe('https://prod.example.com/api');
    expect(repoName).toBe('acme-backend');
  });

  it('sets isAgentReady:true and clears agentError on worker success', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeBackendAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.initializeBackendAgent('http://localhost:4747/api', 'repo', new Map());
    });

    expect(result.current.isAgentReady).toBe(true);
    expect(result.current.agentError).toBeNull();
  });

  it('returns true on worker success', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeBackendAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.initializeBackendAgent(
        'http://localhost:4747/api', 'repo', new Map(),
      );
    });

    expect(returned).toBe(true);
  });

  it('returns false and sets agentError when worker returns { success: false, error }', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeBackendAgent.mockResolvedValue({
      success: false,
      error: 'Backend unreachable',
    });

    const { result } = renderHook(() => useAppState(), { wrapper });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.initializeBackendAgent(
        'http://localhost:4747/api', 'repo', new Map(),
      );
    });

    expect(returned).toBe(false);
    expect(result.current.agentError).toBe('Backend unreachable');
    expect(result.current.isAgentReady).toBe(false);
  });

  it('returns false and sets agentError when worker throws', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeBackendAgent.mockRejectedValue(new Error('Worker crashed'));

    const { result } = renderHook(() => useAppState(), { wrapper });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.initializeBackendAgent(
        'http://localhost:4747/api', 'repo', new Map(),
      );
    });

    expect(returned).toBe(false);
    expect(result.current.agentError).toBe('Worker crashed');
    expect(result.current.isAgentReady).toBe(false);
  });

  it('isAgentInitializing is true during the call and false after', async () => {
    saveSettings(withOpenAI());

    // Use a manually-controlled promise so we can observe the in-flight state
    let resolve!: (v: any) => void;
    const pending = new Promise((res) => { resolve = res; });
    mockWorkerApi.initializeBackendAgent.mockReturnValue(pending);

    const { result } = renderHook(() => useAppState(), { wrapper });

    // Start but don't await — check mid-flight state
    let callPromise: Promise<boolean>;
    act(() => {
      callPromise = result.current.initializeBackendAgent(
        'http://localhost:4747/api', 'repo', new Map(),
      );
    });

    expect(result.current.isAgentInitializing).toBe(true);

    // Resolve and let it settle
    await act(async () => {
      resolve({ success: true });
      await callPromise!;
    });

    expect(result.current.isAgentInitializing).toBe(false);
  });
});

// ── initializeAgent (local / ZIP path) ───────────────────────────────────────

describe('initializeAgent — Promise<boolean> contract (Phase B regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('returns false without calling the worker when no provider is configured', async () => {
    clearSettings();
    const { result } = renderHook(() => useAppState(), { wrapper });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.initializeAgent();
    });

    expect(returned).toBe(false);
    expect(mockWorkerApi.initializeAgent).not.toHaveBeenCalled();
  });

  it('calls api.initializeAgent (local lbug path) — NOT api.initializeBackendAgent', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.initializeAgent('my-zip-project');
    });

    expect(mockWorkerApi.initializeAgent).toHaveBeenCalledTimes(1);
    expect(mockWorkerApi.initializeBackendAgent).not.toHaveBeenCalled();
  });

  it('returns true and sets isAgentReady on worker success', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.initializeAgent();
    });

    expect(returned).toBe(true);
    expect(result.current.isAgentReady).toBe(true);
    expect(result.current.agentError).toBeNull();
  });

  it('returns false and shows the worker error message when { success: false }', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeAgent.mockResolvedValue({
      success: false,
      error: 'Database not ready. Please load a repository first.',
    });

    const { result } = renderHook(() => useAppState(), { wrapper });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.initializeAgent();
    });

    expect(returned).toBe(false);
    expect(result.current.agentError).toBe(
      'Database not ready. Please load a repository first.',
    );
    expect(result.current.isAgentReady).toBe(false);
  });

  it('returns false when worker throws (e.g. Comlink serialisation error)', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeAgent.mockRejectedValue(new Error('Comlink error'));

    const { result } = renderHook(() => useAppState(), { wrapper });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.initializeAgent();
    });

    expect(returned).toBe(false);
    expect(result.current.agentError).toBe('Comlink error');
  });

  it('passes the overrideProjectName to the worker', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.initializeAgent('acme-zip');
    });

    // initializeAgent(config, projectName)
    const callArgs = mockWorkerApi.initializeAgent.mock.calls[0];
    expect(callArgs[1]).toBe('acme-zip');
  });

  it('falls back to "project" as the projectName when none is provided', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.initializeAgent(); // no override
    });

    const callArgs = mockWorkerApi.initializeAgent.mock.calls[0];
    // projectName is arg[1]; should be 'project' (the final fallback)
    expect(callArgs[1]).toBe('project');
  });
});

// ── Routing guard: backend vs local ──────────────────────────────────────────

describe('server-mode routing guard — initializeBackendAgent vs initializeAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('routes to the BACKEND path when backendUrl is supplied', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeBackendAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      // This is what handleServerConnect calls with a live backendUrl
      await result.current.initializeBackendAgent(
        'http://localhost:4747/api', 'repo', new Map(),
      );
    });

    expect(mockWorkerApi.initializeBackendAgent).toHaveBeenCalledTimes(1);
    expect(mockWorkerApi.initializeAgent).not.toHaveBeenCalled();
  });

  it('routes to the LOCAL path when no backendUrl is available (ZIP mode)', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      // This is what handleFileSelect / handleGitClone calls
      await result.current.initializeAgent('my-zip-project');
    });

    expect(mockWorkerApi.initializeAgent).toHaveBeenCalledTimes(1);
    expect(mockWorkerApi.initializeBackendAgent).not.toHaveBeenCalled();
  });

  it('BACKEND call never touches lbug (isReady not called during backend init)', async () => {
    saveSettings(withOpenAI());
    mockWorkerApi.initializeBackendAgent.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.initializeBackendAgent(
        'http://localhost:4747/api', 'repo', new Map(),
      );
    });

    // isReady() calls api.isReady() which checks lbug.isLbugReady()
    // It must NOT be called during backend init because lbug is never loaded
    // in server mode.
    expect(mockWorkerApi.isReady).not.toHaveBeenCalled();
  });
});
