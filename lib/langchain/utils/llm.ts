/**
 * LangChain LLM Factory
 * 
 * Creates and configures LangChain LLM instances.
 * Replaces n8n webhook calls with direct LLM interactions.
 */

import { ChatOpenAI } from '@langchain/openai';
import { LangChainConfig } from './config';

/**
 * Create a ChatOpenAI instance with default configuration
 */
export function createChatLLM(temperature?: number, maxTokens?: number): ChatOpenAI {
  return new ChatOpenAI({
    modelName: LangChainConfig.openai.modelName,
    temperature: temperature ?? LangChainConfig.chat.temperature,
    maxTokens: maxTokens ?? LangChainConfig.chat.maxTokens,
    openAIApiKey: LangChainConfig.openai.apiKey,
  });
}

/**
 * Create a ChatOpenAI instance for learning path generation
 * Lower temperature for more structured, deterministic output
 */
export function createLearningPathLLM(): ChatOpenAI {
  return new ChatOpenAI({
    modelName: LangChainConfig.openai.modelName,
    temperature: LangChainConfig.learningPath.temperature,
    maxTokens: LangChainConfig.learningPath.maxTokens,
    openAIApiKey: LangChainConfig.openai.apiKey,
  });
}

/**
 * Create a ChatOpenAI instance for assessment generation
 * Very low temperature for consistent, accurate question generation
 */
export function createAssessmentLLM(): ChatOpenAI {
  return new ChatOpenAI({
    modelName: LangChainConfig.openai.modelName,
    temperature: LangChainConfig.assessment.temperature,
    maxTokens: LangChainConfig.assessment.maxTokens,
    openAIApiKey: LangChainConfig.openai.apiKey,
  });
}

/**
 * Create a ChatOpenAI instance for module content generation
 * Balanced temperature for creative but structured content
 */
export function createModuleContentLLM(): ChatOpenAI {
  return new ChatOpenAI({
    modelName: LangChainConfig.openai.modelName,
    temperature: LangChainConfig.moduleContent.temperature,
    maxTokens: LangChainConfig.moduleContent.maxTokens,
    openAIApiKey: LangChainConfig.openai.apiKey,
  });
}

