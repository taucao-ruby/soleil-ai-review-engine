import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LLM_SETTINGS } from './types';
import {
  clearSettings,
  isPersistenceEnabled,
  loadSettings,
  saveSettings,
  setPersistenceEnabled,
} from './settings-service';

const createSettings = () => ({
  ...DEFAULT_LLM_SETTINGS,
  activeProvider: 'openai' as const,
  openai: {
    ...DEFAULT_LLM_SETTINGS.openai,
    apiKey: 'sk-session',
    model: 'gpt-4o',
  },
});

describe('settings-service storage behavior', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('returns defaults when no stored settings exist', () => {
    expect(loadSettings()).toEqual(DEFAULT_LLM_SETTINGS);
    expect(isPersistenceEnabled()).toBe(false);
  });

  it('saves settings to sessionStorage by default without persisting to localStorage', () => {
    const settings = createSettings();

    saveSettings(settings);

    expect(sessionStorage.getItem('soleil-ai-review-engine-llm-settings')).toContain('sk-session');
    expect(localStorage.getItem('soleil-ai-review-engine-llm-settings')).toBeNull();
    expect(loadSettings().openai?.apiKey).toBe('sk-session');
  });

  it('loads persisted settings only after explicit opt-in and promotes them to sessionStorage', () => {
    const settings = createSettings();

    setPersistenceEnabled(true);
    saveSettings(settings);
    sessionStorage.removeItem('soleil-ai-review-engine-llm-settings');

    const loaded = loadSettings();

    expect(loaded.openai?.apiKey).toBe('sk-session');
    expect(sessionStorage.getItem('soleil-ai-review-engine-llm-settings')).toContain('sk-session');
    expect(localStorage.getItem('soleil-ai-review-engine-persist-keys')).toBe('true');
  });

  it('clears persisted credentials immediately when persistence is disabled', () => {
    const settings = createSettings();

    setPersistenceEnabled(true);
    saveSettings(settings);
    setPersistenceEnabled(false);
    clearSettings();

    expect(localStorage.getItem('soleil-ai-review-engine-persist-keys')).toBeNull();
    expect(localStorage.getItem('soleil-ai-review-engine-llm-settings')).toBeNull();
    expect(sessionStorage.getItem('soleil-ai-review-engine-llm-settings')).toBeNull();
  });
});
