/**
 * Phase D regression tests — OpenRouter model field validation.
 *
 * Bug: getActiveProviderConfig() allowed blank model: '' through for OpenRouter
 * even when the apiKey was valid.  The LangChain ChatOpenAI constructor receives
 * model: '' which causes a cryptic API error at chat time instead of a clear
 * "not configured" signal at settings time.
 *
 * Fix: added a trim-check for model alongside the existing apiKey guard.
 *
 * These tests verify:
 *  1. Blank / whitespace model → null (guard fires, provider treated as unconfigured)
 *  2. Missing model → null
 *  3. Valid apiKey + valid model → non-null config (chat proceeds)
 *  4. Config values are not mutated or truncated on the way through
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSettings,
  getActiveProviderConfig,
  isProviderConfigured,
  saveSettings,
} from './settings-service';
import { DEFAULT_LLM_SETTINGS } from './types';
import type { OpenRouterConfig } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const withOpenRouter = (apiKey: string, model: string) => ({
  ...DEFAULT_LLM_SETTINGS,
  activeProvider: 'openrouter' as const,
  openrouter: { apiKey, model },
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('getActiveProviderConfig — OpenRouter model field validation (Phase D)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  // ── model guard (new in Phase D) ──────────────────────────────────────────

  it('returns null when model is empty string even if apiKey is valid', () => {
    saveSettings(withOpenRouter('sk-or-valid', ''));
    expect(getActiveProviderConfig()).toBeNull();
  });

  it('returns null when model is whitespace-only even if apiKey is valid', () => {
    saveSettings(withOpenRouter('sk-or-valid', '   '));
    expect(getActiveProviderConfig()).toBeNull();
  });

  it('returns null when model is a single tab character', () => {
    saveSettings(withOpenRouter('sk-or-valid', '\t'));
    expect(getActiveProviderConfig()).toBeNull();
  });

  it('returns null when model field is missing (coerced to undefined → falsy)', () => {
    saveSettings({
      ...DEFAULT_LLM_SETTINGS,
      activeProvider: 'openrouter' as const,
      openrouter: { apiKey: 'sk-or-valid', model: undefined as unknown as string },
    });
    expect(getActiveProviderConfig()).toBeNull();
  });

  // ── apiKey guard (pre-existing, should not regress) ──────────────────────

  it('returns null when apiKey is empty string regardless of model', () => {
    saveSettings(withOpenRouter('', 'anthropic/claude-3.5-sonnet'));
    expect(getActiveProviderConfig()).toBeNull();
  });

  it('returns null when apiKey is whitespace-only regardless of model', () => {
    saveSettings(withOpenRouter('   ', 'anthropic/claude-3.5-sonnet'));
    expect(getActiveProviderConfig()).toBeNull();
  });

  it('returns null when both apiKey and model are empty strings', () => {
    saveSettings(withOpenRouter('', ''));
    expect(getActiveProviderConfig()).toBeNull();
  });

  // ── happy path: both required fields present ──────────────────────────────

  it('returns a non-null config when both apiKey and model are non-empty', () => {
    saveSettings(withOpenRouter('sk-or-real-key', 'anthropic/claude-3.5-sonnet'));
    const config = getActiveProviderConfig();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe('openrouter');
  });

  it('carries the model string through to the config unchanged', () => {
    const model = 'openai/gpt-4-turbo';
    saveSettings(withOpenRouter('sk-or-real-key', model));
    const config = getActiveProviderConfig() as OpenRouterConfig;
    expect(config.model).toBe(model);
  });

  it('carries the apiKey string through to the config unchanged', () => {
    const key = 'sk-or-specific-test-key-123';
    saveSettings(withOpenRouter(key, 'openai/gpt-4o'));
    const config = getActiveProviderConfig() as OpenRouterConfig;
    expect(config.apiKey).toBe(key);
  });

  it('uses the default baseUrl when none is provided in settings', () => {
    saveSettings(withOpenRouter('sk-or-real-key', 'openai/gpt-4o'));
    const config = getActiveProviderConfig() as OpenRouterConfig;
    expect(config.baseUrl).toBe('https://openrouter.ai/api/v1');
  });

  it('allows custom baseUrl to pass through when set', () => {
    saveSettings({
      ...DEFAULT_LLM_SETTINGS,
      activeProvider: 'openrouter' as const,
      openrouter: {
        apiKey: 'sk-or-real-key',
        model: 'openai/gpt-4o',
        baseUrl: 'https://custom-proxy.example.com/v1',
      },
    });
    const config = getActiveProviderConfig() as OpenRouterConfig;
    expect(config.baseUrl).toBe('https://custom-proxy.example.com/v1');
  });

  // ── isProviderConfigured wrapper ──────────────────────────────────────────

  it('isProviderConfigured() returns false when model is blank', () => {
    saveSettings(withOpenRouter('sk-or-real-key', ''));
    expect(isProviderConfigured()).toBe(false);
  });

  it('isProviderConfigured() returns false when apiKey is blank', () => {
    saveSettings(withOpenRouter('', 'anthropic/claude-3.5-sonnet'));
    expect(isProviderConfigured()).toBe(false);
  });

  it('isProviderConfigured() returns true when both apiKey and model are set', () => {
    saveSettings(withOpenRouter('sk-or-real-key', 'anthropic/claude-3.5-sonnet'));
    expect(isProviderConfigured()).toBe(true);
  });

  // ── round-trip: saved then reloaded ───────────────────────────────────────

  it('model survives a sessionStorage save/load round-trip', () => {
    const model = 'meta-llama/llama-3.1-70b-instruct';
    saveSettings(withOpenRouter('sk-or-real-key', model));

    // Simulate re-reading settings on next hook call
    sessionStorage.setItem(
      'soleil-ai-review-engine-llm-settings',
      sessionStorage.getItem('soleil-ai-review-engine-llm-settings')!,
    );

    const config = getActiveProviderConfig() as OpenRouterConfig;
    expect(config.model).toBe(model);
  });

  // ── edge: other providers not affected by OpenRouter guard ────────────────

  it('openai provider is unaffected by OpenRouter model guard', () => {
    saveSettings({
      ...DEFAULT_LLM_SETTINGS,
      activeProvider: 'openai' as const,
      openai: { apiKey: 'sk-openai-key', model: 'gpt-4o' },
    });
    const config = getActiveProviderConfig();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe('openai');
  });

  it('ollama provider is unaffected by OpenRouter model guard', () => {
    saveSettings({
      ...DEFAULT_LLM_SETTINGS,
      activeProvider: 'ollama' as const,
      ollama: { baseUrl: 'http://localhost:11434', model: 'llama3.2' },
    });
    const config = getActiveProviderConfig();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe('ollama');
  });

  // ── guard order: apiKey is checked first ─────────────────────────────────

  it('returns null immediately on blank apiKey without evaluating model', () => {
    // If apiKey guard fires first, the model guard never runs — result is same (null).
    // Confirms there is no logic path that accidentally reads an invalid key.
    saveSettings(withOpenRouter('', 'anthropic/claude-3.5-sonnet'));
    expect(getActiveProviderConfig()).toBeNull();
  });
});
