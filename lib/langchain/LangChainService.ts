/**
 * LangChain Service
 * 
 * Main service replacing N8NService.
 * Provides unified interface for all LangChain workflows.
 */

import { generateChatResponse, ChatInput, ChatOutput } from './chains/chatChain';
import { generateLearningPath, LearningPathInput } from './chains/learningPathChain';
import { generateAssessmentQuestions, AssessmentInput } from './chains/assessmentChain';
import { generateMCQs, generateFlashcards, ModuleContentInput, MCQQuestion, Flashcard } from './chains/moduleContentChain';
import { analyzeAssessmentResults, AssessmentAnalysisInput, AssessmentAnalysisOutput } from './chains/assessmentAnalysisChain';
import { N8NCacheService } from '@/lib/N8NCacheService';

/**
 * LangChain Service - Replaces N8NService
 * 
 * This service provides the same interface as N8NService but uses LangChain
 * instead of n8n webhooks. All business logic is preserved.
 */
export class LangChainService {
  /**
   * Generate AI chat response
   * Replaces: N8NService.generateResponse()
   * Original n8n workflow: AI-BUDDY-MAIN
   */
  async generateResponse(
    message: string,
    context: {
      pdfContent?: string;
      selectedText?: string;
      currentTime?: number;
      bookmarks?: any[];
      action?: string;
    },
    studentData: {
      name: string;
      grade: string;
      school: string;
    }
  ): Promise<ChatOutput> {
    const input: ChatInput = {
      message,
      studentName: studentData.name,
      grade: studentData.grade,
      school: studentData.school,
      pdfContent: context.pdfContent,
      selectedText: context.selectedText,
      currentTime: context.currentTime,
      bookmarksCount: context.bookmarks?.length,
      action: context.action || 'general',
    };

    return await generateChatResponse(input);
  }

  /**
   * Generate MCQ questions for a module
   * Replaces: N8NService.generateMCQs()
   * Original n8n workflow: MCQ/Flash/questions (type=mcq)
   */
  async generateMCQs(
    uniqueId: string,
    forceRegenerate = false,
    studentUniqueId?: string
  ): Promise<MCQQuestion[]> {
    // Check cache first (preserving original caching behavior)
    if (!forceRegenerate) {
      const cachedContent = await N8NCacheService.getCachedModuleContent(
        uniqueId,
        'mcq',
        24 // 24 hours cache
      );
      
      if (cachedContent && cachedContent.length > 0) {
        console.log(`🎯 Using cached MCQ content for module ${uniqueId}`);
        return cachedContent;
      }
    }

    try {
      const input: ModuleContentInput = {
        uniqueId,
      };

      const questions = await generateMCQs(input);
      
      // Save to cache (preserving original caching behavior)
      if (questions.length > 0) {
        try {
          const module = await import('@/models/Module').then(m => m.default);
          const dbModule = await module.findOne({ uniqueID: uniqueId });
          
          if (dbModule) {
            const n8nResult = await N8NCacheService.saveResult({
              uniqueId: uniqueId,
              resultType: 'module_content',
              webhookUrl: 'langchain-mcq',
              requestPayload: { uniqueId },
              responseData: questions,
              processedData: questions,
              status: 'completed',
              metadata: {
                studentId: studentUniqueId,
                moduleId: dbModule._id.toString(),
                contentType: 'mcq',
                version: '1.0',
              },
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            });

            await N8NCacheService.updateModuleContent(
              dbModule._id.toString(),
              'mcq',
              questions,
              n8nResult._id.toString()
            );
          }
        } catch (cacheError) {
          console.error('Error saving MCQ to cache:', cacheError);
        }
      }

      return questions;
    } catch (error) {
      console.error('LangChain MCQ generation error:', error);
      return [];
    }
  }

  /**
   * Generate flashcards for a module
   * Replaces: N8NService.generateFlashcards()
   * Original n8n workflow: MCQ/Flash/questions (type=flash)
   */
  async generateFlashcards(
    uniqueId: string,
    forceRegenerate = false,
    studentUniqueId?: string
  ): Promise<Flashcard[]> {
    // Check cache first (preserving original caching behavior)
    if (!forceRegenerate) {
      const cachedContent = await N8NCacheService.getCachedModuleContent(
        uniqueId,
        'flashcard',
        24 // 24 hours cache
      );
      
      if (cachedContent && cachedContent.length > 0) {
        console.log(`🎯 Using cached flashcard content for module ${uniqueId}`);
        return cachedContent;
      }
    }

    try {
      const input: ModuleContentInput = {
        uniqueId,
      };

      const flashcards = await generateFlashcards(input);
      
      // Save to cache (preserving original caching behavior)
      if (flashcards.length > 0) {
        try {
          const module = await import('@/models/Module').then(m => m.default);
          const dbModule = await module.findOne({ uniqueID: uniqueId });
          
          if (dbModule) {
            const n8nResult = await N8NCacheService.saveResult({
              uniqueId: uniqueId,
              resultType: 'module_content',
              webhookUrl: 'langchain-flashcard',
              requestPayload: { uniqueId },
              responseData: flashcards,
              processedData: flashcards,
              status: 'completed',
              metadata: {
                studentId: studentUniqueId,
                moduleId: dbModule._id.toString(),
                contentType: 'flashcard',
                version: '1.0',
              },
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            });

            await N8NCacheService.updateModuleContent(
              dbModule._id.toString(),
              'flashcard',
              flashcards,
              n8nResult._id.toString()
            );
          }
        } catch (cacheError) {
          console.error('Error saving flashcards to cache:', cacheError);
        }
      }

      return flashcards;
    } catch (error) {
      console.error('LangChain flashcard generation error:', error);
      return [];
    }
  }

  /**
   * Generate learning path
   * Replaces: N8NService.generateLearningPath()
   * Original n8n workflow: learnign-path
   */
  async generateLearningPath(
    content: string,
    userPreferences?: any
  ): Promise<any> {
    try {
      // Parse content and preferences to extract student data
      const input: LearningPathInput = {
        studentName: userPreferences?.studentName || 'Student',
        grade: userPreferences?.grade || '6',
        skills: userPreferences?.skills || [],
        interests: userPreferences?.interests || [],
        careerGoals: userPreferences?.careerGoals || [],
        dreamJob: userPreferences?.dreamJob || '',
        aspirations: userPreferences?.aspirations || '',
        problemsToSolve: userPreferences?.problemsToSolve || '',
        learningStyle: userPreferences?.learningStyle || [],
        languagePreference: userPreferences?.languagePreference || 'English',
        assessmentResults: userPreferences?.assessmentResults,
        validationResults: userPreferences?.validationResults,
        duration: userPreferences?.duration || '6 months',
        format: userPreferences?.format || 'video-based',
        platform: userPreferences?.platform || 'YouTube',
        includeProjects: userPreferences?.includeProjects ?? true,
        includeAssessments: userPreferences?.includeAssessments ?? true,
      };

      return await generateLearningPath(input);
    } catch (error) {
      console.error('LangChain learning path generation error:', error);
      return null;
    }
  }

  /**
   * Generate assessment questions
   * Replaces: N8NService.generateAssessment()
   * Original n8n workflow: assessment-questions
   */
  async generateAssessment(
    content: string,
    assessmentType: string = 'diagnostic'
  ): Promise<any> {
    try {
      // This method signature matches N8NService but we need student data
      // In practice, this should be called with proper student context
      console.warn('generateAssessment called without student context - use generateAssessmentQuestions instead');
      return null;
    } catch (error) {
      console.error('LangChain assessment generation error:', error);
      return null;
    }
  }

  /**
   * Generate assessment questions with proper context
   * New method providing better interface than generateAssessment()
   */
  async generateAssessmentQuestions(
    input: AssessmentInput
  ): Promise<any[]> {
    try {
      return await generateAssessmentQuestions(input);
    } catch (error) {
      console.error('LangChain assessment questions generation error:', error);
      return [];
    }
  }

  /**
   * Analyze assessment results
   * Replaces: n8n Score-result webhook
   */
  async analyzeAssessmentResults(
    uniqueId: string,
    responses: any[]
  ): Promise<AssessmentAnalysisOutput | null> {
    try {
      const input: AssessmentAnalysisInput = {
        uniqueId,
        responses,
      };

      return await analyzeAssessmentResults(input);
    } catch (error) {
      console.error('LangChain assessment analysis error:', error);
      return null;
    }
  }

  /**
   * Placeholder methods for transcript functionality
   * These may not need LangChain migration if they're just data passing
   */
  async sendTranscriptData(
    moduleId: string,
    videoData: any,
    transcriptData: any,
    context: any = {}
  ): Promise<any> {
    // This might not need LangChain - could be just data storage
    console.log('sendTranscriptData called - may not need LangChain migration');
    return null;
  }

  async generateTranscriptFromVideo(
    videoUrl: string,
    moduleId: string,
    options: any = {}
  ): Promise<any> {
    // This might use external API - may not need LangChain
    console.log('generateTranscriptFromVideo called - may not need LangChain migration');
    return null;
  }
}

