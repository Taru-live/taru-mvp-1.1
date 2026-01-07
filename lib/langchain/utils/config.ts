/**
 * LangChain Configuration
 * 
 * Centralized configuration for LangChain LLM instances.
 * Replaces n8n webhook URLs with direct LLM calls.
 */

export const LangChainConfig = {
  // OpenAI Configuration
  openai: {
    modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  // Chat-specific settings
  chat: {
    temperature: parseFloat(process.env.CHAT_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.CHAT_MAX_TOKENS || '1000'),
  },

  // Learning Path Generation settings
  learningPath: {
    temperature: parseFloat(process.env.LEARNING_PATH_TEMPERATURE || '0.5'),
    maxTokens: parseInt(process.env.LEARNING_PATH_MAX_TOKENS || '3000'),
  },

  // Assessment Generation settings
  assessment: {
    temperature: parseFloat(process.env.ASSESSMENT_TEMPERATURE || '0.3'),
    maxTokens: parseInt(process.env.ASSESSMENT_MAX_TOKENS || '2000'),
  },

  // Module Content Generation settings
  moduleContent: {
    temperature: parseFloat(process.env.MODULE_CONTENT_TEMPERATURE || '0.4'),
    maxTokens: parseInt(process.env.MODULE_CONTENT_MAX_TOKENS || '2000'),
  },

  // Cache settings (matching N8N cache behavior)
  cache: {
    defaultExpiryHours: parseInt(process.env.CACHE_EXPIRY_HOURS || '24'),
  },
};

