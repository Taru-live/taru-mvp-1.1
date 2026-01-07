/**
 * Chat Chain
 * 
 * LangChain chain for AI Buddy Chat functionality.
 * Replaces n8n AI-BUDDY-MAIN webhook workflow.
 */

import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { createChatLLM } from '../utils/llm';
import { chatPrompt, extractSuggestions, generateRelatedQuestions } from '../prompts/chat';
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';

export interface ChatInput {
  message: string;
  studentName: string;
  grade: string;
  school: string;
  pdfContent?: string;
  selectedText?: string;
  currentTime?: number;
  bookmarksCount?: number;
  action?: string;
}

export interface ChatOutput {
  success: boolean;
  message: string;
  content: string;
  suggestions: string[];
  relatedQuestions: string[];
  confidence: number;
}

/**
 * Create chat chain with memory
 * Original n8n workflow: AI-BUDDY-MAIN
 */
export function createChatChain(memory?: BufferMemory): RunnableSequence {
  const llm = createChatLLM();
  
  const chain = RunnableSequence.from([
    chatPrompt,
    llm,
  ]);

  return chain;
}

/**
 * Generate chat response using LangChain
 * Replaces N8NService.generateResponse()
 */
export async function generateChatResponse(
  input: ChatInput,
  memory?: BufferMemory
): Promise<ChatOutput> {
  try {
    const llm = createChatLLM();
    
    // Format context for prompt
    const formattedInput = {
      message: input.message,
      studentName: input.studentName,
      grade: input.grade,
      school: input.school,
      pdfContent: input.pdfContent?.substring(0, 1000) || '',
      selectedText: input.selectedText || '',
      currentTime: input.currentTime?.toString() || '0',
      bookmarksCount: (input.bookmarksCount || 0).toString(),
      action: input.action || 'general',
    };

    // Invoke chain
    const response = await chatPrompt.pipe(llm).invoke(formattedInput);
    
    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);

    // Extract suggestions and related questions
    const suggestions = extractSuggestions(content);
    const relatedQuestions = generateRelatedQuestions(content, {
      selectedText: input.selectedText,
      pdfContent: input.pdfContent,
    });

    return {
      success: true,
      message: 'Response generated successfully',
      content,
      suggestions,
      relatedQuestions,
      confidence: 0.9,
    };
  } catch (error) {
    console.error('LangChain chat error:', error);
    return {
      success: false,
      message: 'I apologize, but I encountered an error processing your request. Please try again.',
      content: 'I apologize, but I encountered an error processing your request. Please try again.',
      suggestions: [],
      relatedQuestions: [],
      confidence: 0,
    };
  }
}

