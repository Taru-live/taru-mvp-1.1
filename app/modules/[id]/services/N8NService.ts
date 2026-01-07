/**
 * N8NService - DEPRECATED
 * 
 * This service has been migrated to LangChainService.
 * This file now acts as a wrapper/compatibility layer that uses LangChainService.
 * 
 * @deprecated Use LangChainService directly instead
 */

import { AIResponse, LearningContext, ActionType, MCQQuestion } from '../types';
import { LangChainService } from '@/lib/langchain/LangChainService';

/**
 * @deprecated Use LangChainService instead
 * This class is kept for backward compatibility but now uses LangChainService internally
 */
export class N8NService {
  private langChainService: LangChainService;

  constructor() {
    this.langChainService = new LangChainService();
  }

  async generateResponse(
    message: string,
    context: LearningContext,
    action?: ActionType
  ): Promise<AIResponse> {
    try {
      // Use LangChainService instead of n8n webhook
      const result = await this.langChainService.generateResponse(
        message,
        {
          pdfContent: context.pdfContent,
          selectedText: context.selectedText,
          currentTime: context.currentTime,
          bookmarks: context.bookmarks,
          action: action || 'general',
        },
        {
          name: '', // Will be provided by caller if needed
          grade: '',
          school: '',
        }
      );

      return {
        success: result.success,
        message: result.message,
        content: result.content,
        suggestions: result.suggestions,
        relatedQuestions: result.relatedQuestions,
        confidence: result.confidence,
      };
    } catch (error) {
      console.error('🔴 LangChain Error:', error);
      return {
        success: false,
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        suggestions: [],
        relatedQuestions: [],
        confidence: 0
      };
    }
  }

  async generateMCQs(uniqueId: string, forceRegenerate = false, studentUniqueId?: string): Promise<MCQQuestion[]> {
    try {
      // Use LangChainService instead of n8n webhook
      const mcqs = await this.langChainService.generateMCQs(uniqueId, forceRegenerate, studentUniqueId);
      
      // Transform to expected format
      return mcqs.map((q: any) => ({
        id: q.id || `q_${Date.now()}`,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || 0,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        category: q.category || ''
      }));
    } catch (error) {
      console.error('🔴 MCQ Generation Error:', error);
      return [];
    }
  }

  async generateFlashcards(uniqueId: string, forceRegenerate = false, studentUniqueId?: string): Promise<any[]> {
    try {
      // Use LangChainService instead of n8n webhook
      return await this.langChainService.generateFlashcards(uniqueId, forceRegenerate, studentUniqueId);
    } catch (error) {
      console.error('🔴 Flashcard Generation Error:', error);
      return [];
    }
  }

  async generateLearningPath(content: string, userPreferences?: any): Promise<any> {
    try {
      // Use LangChainService instead of n8n webhook
      return await this.langChainService.generateLearningPath(content, userPreferences);
    } catch (error) {
      console.error('🔴 Learning Path Generation Error:', error);
      return null;
    }
  }

  async generateAssessment(content: string, assessmentType: string = 'diagnostic'): Promise<any> {
    try {
      // Use LangChainService instead of n8n webhook
      return await this.langChainService.generateAssessment(content, assessmentType);
    } catch (error) {
      console.error('🔴 Assessment Generation Error:', error);
      return null;
    }
  }

  async sendTranscriptData(
    moduleId: string,
    videoData: any,
    transcriptData: any,
    context: any = {}
  ): Promise<any> {
    try {
      // Use LangChainService instead of n8n webhook
      return await this.langChainService.sendTranscriptData(moduleId, videoData, transcriptData, context);
    } catch (error) {
      console.error('🔴 Transcript Data Send Error:', error);
      return null;
    }
  }

  async generateTranscriptFromVideo(
    videoUrl: string,
    moduleId: string,
    options: any = {}
  ): Promise<any> {
    try {
      // Use LangChainService instead of n8n webhook
      return await this.langChainService.generateTranscriptFromVideo(videoUrl, moduleId, options);
    } catch (error) {
      console.error('🔴 Transcript Generation Error:', error);
      return null;
    }
  }
}
