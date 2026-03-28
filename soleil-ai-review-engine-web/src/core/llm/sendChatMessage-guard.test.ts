/**
 * Regression tests for the sendChatMessage no-provider guard.
 *
 * Bug: post-initializeAgent() guard checked !apiRef.current (Comlink proxy,
 * always non-null) instead of provider state, allowing chatStream() to be
 * called with currentAgent === null — producing "Agent not initialized..."
 * from the worker.
 *
 * Fix: getActiveProviderConfig() null-check added before initializeAgent().
 * These tests verify the condition that drives that guard.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSettings,
  getActiveProviderConfig,
  isProviderConfigured,
  loadSettings,
  saveSettings,
} from './settings-service';
import { DEFAULT_LLM_SETTINGS } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CloudProvider = 'openai' | 'gemini' | 'anthropic' | 'openrouter';

const withApiKey = (provider: CloudProvider, key: string) => ({
  ...DEFAULT_LLM_SETTINGS,
  activeProvider: provider,
  [provider]: {
    ...DEFAULT_LLM_SETTINGS[provider],
    apiKey: key,
    model: DEFAULT_LLM_SETTINGS[provider]?.model ?? 'default-model',
  },
});

// ---------------------------------------------------------------------------
// Guard predicate: getActiveProviderConfig()
//
// This is the exact function called in the new guard added to sendChatMessage.
// If it returns null → guard fires → chatStream is never called.
// If it returns non-null → guard passes → chat proceeds.
// ---------------------------------------------------------------------------

describe('sendChatMessage no-provider guard predicate — getActiveProviderConfig()', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  // ── Test 1: No-provider guard trigger ──────────────────────────────────
  it('returns null when activeProvider is gemini and apiKey is empty (guard fires → chatStream blocked)', () => {
    // Default settings have activeProvider = 'gemini' with apiKey = ''
    // This is exactly the state that triggered the original bug.
    clearSettings();
    const result = getActiveProviderConfig();
    expect(result).toBeNull();
  });

  it('returns null for openai when apiKey is empty string (guard fires)', () => {
    saveSettings({
      ...DEFAULT_LLM_SETTINGS,
      activeProvider: 'openai',
      openai: { apiKey: '', model: 'gpt-4o' },
    });
    expect(getActiveProviderConfig()).toBeNull();
  });

  it('returns null for anthropic when apiKey is empty string (guard fires)', () => {
    saveSettings({
      ...DEFAULT_LLM_SETTINGS,
      activeProvider: 'anthropic',
      anthropic: { apiKey: '', model: 'claude-sonnet-4-20250514' },
    });
    expect(getActiveProviderConfig()).toBeNull();
  });

  it('returns null for openrouter when apiKey is empty string (guard fires)', () => {
    saveSettings({
      ...DEFAULT_LLM_SETTINGS,
      activeProvider: 'openrouter',
      openrouter: { apiKey: '', model: 'anthropic/claude-3.5-sonnet' },
    });
    expect(getActiveProviderConfig()).toBeNull();
  });

  it('returns null for azure-openai when apiKey is empty (guard fires)', () => {
    saveSettings({
      ...DEFAULT_LLM_SETTINGS,
      activeProvider: 'azure-openai',
      azureOpenAI: { apiKey: '', endpoint: 'https://my.openai.azure.com', deploymentName: 'gpt-4o', model: 'gpt-4o' },
    });
    expect(getActiveProviderConfig()).toBeNull();
  });

  it('returns null for azure-openai when endpoint is empty even if apiKey is set (guard fires)', () => {
    saveSettings({
      ...DEFAULT_LLM_SETTINGS,
      activeProvider: 'azure-openai',
      azureOpenAI: { apiKey: 'key-123', endpoint: '', deploymentName: 'gpt-4o', model: 'gpt-4o' },
    });
    expect(getActiveProviderConfig()).toBeNull();
  });

  // ── Test 2: Configured-provider guard pass ─────────────────────────────
  it('returns a non-null config for openai with a valid apiKey (guard passes → chat proceeds)', () => {
    saveSettings(withApiKey('openai', 'sk-real-key'));
    const config = getActiveProviderConfig();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe('openai');
  });

  it('returns a non-null config for gemini with a valid apiKey (guard passes)', () => {
    saveSettings(withApiKey('gemini', 'AIza-real-key'));
    const config = getActiveProviderConfig();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe('gemini');
  });

  it('returns a non-null config for anthropic with a valid apiKey (guard passes)', () => {
    saveSettings(withApiKey('anthropic', 'sk-ant-real-key'));
    const config = getActiveProviderConfig();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe('anthropic');
  });

  it('returns non-null for ollama even with no apiKey — local provider requires no auth (guard always passes)', () => {
    saveSettings({
      ...DEFAULT_LLM_SETTINGS,
      activeProvider: 'ollama',
      ollama: { baseUrl: 'http://localhost:11434', model: 'llama3.2' },
    });
    const config = getActiveProviderConfig();
    // Ollama has no apiKey requirement; getActiveProviderConfig() returns it unconditionally
    expect(config).not.toBeNull();
    expect(config?.provider).toBe('ollama');
  });

  // ── Test 3: isProviderConfigured convenience wrapper ───────────────────
  it('isProviderConfigured() returns false when no provider is configured (drives bottom-bar UX)', () => {
    clearSettings();
    expect(isProviderConfigured()).toBe(false);
  });

  it('isProviderConfigured() returns true when apiKey is set (drives bottom-bar UX)', () => {
    saveSettings(withApiKey('openai', 'sk-valid'));
    expect(isProviderConfigured()).toBe(true);
  });

  // ── Test 4: Settings survive save/load round-trip (hydration regression) ─
  it('apiKey survives a sessionStorage save/load round-trip without corruption', () => {
    const key = 'sk-hydration-test';
    saveSettings(withApiKey('openai', key));

    // Simulate re-reading settings (as the guard does on each sendChatMessage call)
    const loaded = loadSettings();
    expect(loaded.openai?.apiKey).toBe(key);
    expect(getActiveProviderConfig()).not.toBeNull();
  });
});
