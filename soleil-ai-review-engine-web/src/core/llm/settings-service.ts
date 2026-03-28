/**
 * Settings Service
 * 
 * Handles browser storage for LLM provider settings.
 * API keys are stored locally and sent only to the configured LLM provider.
 */

import { 
  LLMSettings, 
  DEFAULT_LLM_SETTINGS, 
  LLMProvider,
  OpenAIConfig,
  AzureOpenAIConfig,
  GeminiConfig,
  AnthropicConfig,
  OllamaConfig,
  OpenRouterConfig,
  ProviderConfig,
} from './types';

// --- CREDENTIAL STORAGE MODEL ---
// DEFAULT: API keys are held in memory (sessionStorage) only. They do not survive
// browser restart. This limits exposure from extensions, XSS, and shared machines.
//
// OPT-IN: If the user explicitly enables "Remember API keys", keys are persisted
// to localStorage. The UI must show a warning when this is toggled on.
//
// TRADEOFF: We do NOT implement browser-side encryption because without a server
// or hardware key, any JS-accessible encryption key is also JS-accessible to an
// attacker. Fake encryption would provide false confidence. The real mitigation
// is reducing persistence scope.
const STORAGE_KEY = 'soleil-ai-review-engine-llm-settings';
const PERSIST_PREF_KEY = 'soleil-ai-review-engine-persist-keys';

const getDefaultSettings = (): LLMSettings => ({
  ...DEFAULT_LLM_SETTINGS,
  openai: { ...DEFAULT_LLM_SETTINGS.openai },
  azureOpenAI: { ...DEFAULT_LLM_SETTINGS.azureOpenAI },
  gemini: { ...DEFAULT_LLM_SETTINGS.gemini },
  anthropic: { ...DEFAULT_LLM_SETTINGS.anthropic },
  ollama: { ...DEFAULT_LLM_SETTINGS.ollama },
  openrouter: { ...DEFAULT_LLM_SETTINGS.openrouter },
  clusteringProvider: DEFAULT_LLM_SETTINGS.clusteringProvider
    ? { ...DEFAULT_LLM_SETTINGS.clusteringProvider }
    : undefined,
});

const mergeWithDefaults = (parsed: Partial<LLMSettings>): LLMSettings => {
  const defaults = getDefaultSettings();
  return {
    ...defaults,
    ...parsed,
    openai: {
      ...defaults.openai,
      ...parsed.openai,
    },
    azureOpenAI: {
      ...defaults.azureOpenAI,
      ...parsed.azureOpenAI,
    },
    gemini: {
      ...defaults.gemini,
      ...parsed.gemini,
    },
    anthropic: {
      ...defaults.anthropic,
      ...parsed.anthropic,
    },
    ollama: {
      ...defaults.ollama,
      ...parsed.ollama,
    },
    openrouter: {
      ...defaults.openrouter,
      ...parsed.openrouter,
    },
    clusteringProvider: parsed.clusteringProvider
      ? { ...parsed.clusteringProvider }
      : defaults.clusteringProvider,
  };
};

export function isPersistenceEnabled(): boolean {
  try {
    return localStorage.getItem(PERSIST_PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setPersistenceEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(PERSIST_PREF_KEY, 'true');
    } else {
      localStorage.removeItem(PERSIST_PREF_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage unavailable - persistence stays off
  }
}

/**
 * Load settings from browser storage
 */
export const loadSettings = (): LLMSettings => {
  try {
    const sessionData = sessionStorage.getItem(STORAGE_KEY);
    if (sessionData) {
      return mergeWithDefaults(JSON.parse(sessionData) as Partial<LLMSettings>);
    }

    if (isPersistenceEnabled()) {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const settings = mergeWithDefaults(JSON.parse(localData) as Partial<LLMSettings>);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        return settings;
      }
    }
  } catch {
    // Parse error - return defaults
  }

  return getDefaultSettings();
};

/**
 * Save settings to browser storage
 */
export const saveSettings = (settings: LLMSettings): void => {
  try {
    const data = JSON.stringify(settings);
    sessionStorage.setItem(STORAGE_KEY, data);
    if (isPersistenceEnabled()) {
      localStorage.setItem(STORAGE_KEY, data);
    }
  } catch {
    // Storage unavailable
  }
};

/**
 * Clear all settings (reset to defaults)
 */
export const clearSettings = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
};

/**
 * Update a specific provider's settings
 */
export const updateProviderSettings = <T extends LLMProvider>(
  provider: T,
  updates: Partial<
    T extends 'openai' ? Partial<Omit<OpenAIConfig, 'provider'>> :
    T extends 'azure-openai' ? Partial<Omit<AzureOpenAIConfig, 'provider'>> :
    T extends 'gemini' ? Partial<Omit<GeminiConfig, 'provider'>> :
    T extends 'anthropic' ? Partial<Omit<AnthropicConfig, 'provider'>> :
    T extends 'ollama' ? Partial<Omit<OllamaConfig, 'provider'>> :
    never
  >
): LLMSettings => {
  const current = loadSettings();

  // Avoid spreading unions like LLMSettings[keyof LLMSettings] (can be string/undefined)
  switch (provider) {
    case 'openai': {
      const updated: LLMSettings = {
        ...current,
        openai: {
          ...(current.openai ?? {}),
          ...(updates as Partial<Omit<OpenAIConfig, 'provider'>>),
        },
      };
      saveSettings(updated);
      return updated;
    }
    case 'azure-openai': {
      const updated: LLMSettings = {
        ...current,
        azureOpenAI: {
          ...(current.azureOpenAI ?? {}),
          ...(updates as Partial<Omit<AzureOpenAIConfig, 'provider'>>),
        },
      };
      saveSettings(updated);
      return updated;
    }
    case 'gemini': {
      const updated: LLMSettings = {
        ...current,
        gemini: {
          ...(current.gemini ?? {}),
          ...(updates as Partial<Omit<GeminiConfig, 'provider'>>),
        },
      };
      saveSettings(updated);
      return updated;
    }
    case 'anthropic': {
      const updated: LLMSettings = {
        ...current,
        anthropic: {
          ...(current.anthropic ?? {}),
          ...(updates as Partial<Omit<AnthropicConfig, 'provider'>>),
        },
      };
      saveSettings(updated);
      return updated;
    }
    case 'ollama': {
      const updated: LLMSettings = {
        ...current,
        ollama: {
          ...(current.ollama ?? {}),
          ...(updates as Partial<Omit<OllamaConfig, 'provider'>>),
        },
      };
      saveSettings(updated);
      return updated;
    }
    case 'openrouter': {
      const updated: LLMSettings = {
        ...current,
        openrouter: {
          ...(current.openrouter ?? {}),
          ...(updates as Partial<Omit<OpenRouterConfig, 'provider'>>),
        },
      };
      saveSettings(updated);
      return updated;
    }
    default: {
      // Should be unreachable due to T extends LLMProvider, but keep a safe fallback
      const updated: LLMSettings = { ...current };
      saveSettings(updated);
      return updated;
    }
  }
};

/**
 * Set the active provider
 */
export const setActiveProvider = (provider: LLMProvider): LLMSettings => {
  const current = loadSettings();
  const updated: LLMSettings = {
    ...current,
    activeProvider: provider,
  };
  saveSettings(updated);
  return updated;
};

/**
 * Get the current provider configuration
 */
export const getActiveProviderConfig = (): ProviderConfig | null => {
  const settings = loadSettings();
  
  switch (settings.activeProvider) {
    case 'openai':
      if (!settings.openai?.apiKey) {
        return null;
      }
      return {
        provider: 'openai',
        ...settings.openai,
      } as OpenAIConfig;
      
    case 'azure-openai':
      if (!settings.azureOpenAI?.apiKey || !settings.azureOpenAI?.endpoint) {
        return null;
      }
      return {
        provider: 'azure-openai',
        ...settings.azureOpenAI,
      } as AzureOpenAIConfig;
      
    case 'gemini':
      if (!settings.gemini?.apiKey) {
        return null;
      }
      return {
        provider: 'gemini',
        ...settings.gemini,
      } as GeminiConfig;
      
    case 'anthropic':
      if (!settings.anthropic?.apiKey) {
        return null;
      }
      return {
        provider: 'anthropic',
        ...settings.anthropic,
      } as AnthropicConfig;
      
    case 'ollama':
      return {
        provider: 'ollama',
        ...settings.ollama,
      } as OllamaConfig;
      
    case 'openrouter':
      if (!settings.openrouter?.apiKey || settings.openrouter.apiKey.trim() === '') {
        return null;
      }
      if (!settings.openrouter.model || settings.openrouter.model.trim() === '') {
        return null;
      }
      return {
        provider: 'openrouter',
        apiKey: settings.openrouter.apiKey,
        model: settings.openrouter.model,
        baseUrl: settings.openrouter.baseUrl || 'https://openrouter.ai/api/v1',
        temperature: settings.openrouter.temperature,
        maxTokens: settings.openrouter.maxTokens,
      } as OpenRouterConfig;
      
    default:
      return null;
  }
};

/**
 * Check if the active provider is properly configured
 */
export const isProviderConfigured = (): boolean => {
  return getActiveProviderConfig() !== null;
};

/**
 * Get display name for a provider
 */
export const getProviderDisplayName = (provider: LLMProvider): string => {
  switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'azure-openai':
      return 'Azure OpenAI';
    case 'gemini':
      return 'Google Gemini';
    case 'anthropic':
      return 'Anthropic';
    case 'ollama':
      return 'Ollama (Local)';
    case 'openrouter':
      return 'OpenRouter';
    default:
      return provider;
  }
};

/**
 * Get available models for a provider
 */
export const getAvailableModels = (provider: LLMProvider): string[] => {
  switch (provider) {
    case 'openai':
      return ['gpt-4.5-preview', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
    case 'azure-openai':
      // Azure models depend on deployment, so we show common ones
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-35-turbo'];
    case 'gemini':
      return ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
    case 'anthropic':
      return ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'];
    case 'ollama':
      return ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'deepseek-coder'];
    default:
      return [];
  }
};

/**
 * Fetch available models from OpenRouter API
 */
export const fetchOpenRouterModels = async (): Promise<Array<{ id: string; name: string }>> => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
    }));
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    return [];
  }
};

