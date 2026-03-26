/**
 * LLM Module Exports
 * 
 * Provides Graph RAG agent capabilities for code analysis.
 */

// Types
export * from './types';

// Settings management
export {
  loadSettings,
  saveSettings,
  isPersistenceEnabled,
  setPersistenceEnabled,
  updateProviderSettings,
  setActiveProvider,
  getActiveProviderConfig,
  isProviderConfigured,
  clearSettings,
  getProviderDisplayName,
  getAvailableModels,
} from './settings-service';

// Tools
export { createGraphRAGTools } from './tools';

// Context Builder
export {
  buildCodebaseContext,
  formatContextForPrompt,
  buildDynamicSystemPrompt,
  type CodebaseContext,
  type CodebaseStats,
  type Hotspot,
} from './context-builder';

// Agent
export {
  createChatModel,
  createGraphRAGAgent,
  streamAgentResponse,
  invokeAgent,
  BASE_SYSTEM_PROMPT,
  type AgentMessage,
} from './agent';
