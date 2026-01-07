import { AIResponse, LearningContext, ActionType, MCQQuestion, N8NAssessmentResponse } from '../types';
import { N8NCacheService } from '@/lib/N8NCacheService';

export class N8NService {
  private n8nWebhookUrl: string;
  private n8nAssessmentWebhookUrl: string;
  private n8nLearningPathWebhookUrl: string;
  private n8nModuleAssessmentWebhookUrl: string;

  constructor() {
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://nclbtaru.app.n8n.cloud/webhook/AI-BUDDY-MAIN';
    this.n8nAssessmentWebhookUrl = process.env.N8N_ASSESSMENT_WEBHOOK_URL || 'https://nclbtaru.app.n8n.cloud/webhook/learnign-path';
    this.n8nLearningPathWebhookUrl = process.env.N8N_LEARNING_PATH_WEBHOOK_URL || 'https://nclbtaru.app.n8n.cloud/webhook/learnign-path';
    this.n8nModuleAssessmentWebhookUrl = process.env.N8N_MODULE_ASSESSMENT_WEBHOOK_URL || 'https://nclbtaru.app.n8n.cloud/webhook/MCQ/Flash/questions';
  }

  async generateResponse(
    message: string,
    context: LearningContext,
    action?: ActionType
  ): Promise<AIResponse> {
    try {
      const payload = {
        message,
        context: {
          pdfContent: context.pdfContent?.substring(0, 1000) || '',
          selectedText: context.selectedText,
          currentTime: context.currentTime,
          bookmarksCount: context.bookmarks?.length || 0,
          action: action || 'general'
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Response generated successfully',
        content: data.content || data.response || 'I received your message and am processing it.',
        suggestions: data.suggestions || this.extractSuggestions(data.content || ''),
        relatedQuestions: data.relatedQuestions || this.generateRelatedQuestions(data.content || '', context),
        confidence: data.confidence || 0.9
      };
    } catch (error) {
      console.error('🔴 N8N Webhook Error:', error);
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

  private extractSuggestions(text: string): string[] {
    // Extract potential follow-up suggestions from AI response
    const suggestions = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('You might also want to') || line.includes('Consider asking') || line.includes('Try asking')) {
        suggestions.push(line.trim());
      }
    }

    return suggestions.slice(0, 3);
  }

  private generateRelatedQuestions(text: string, context: LearningContext): string[] {
    const questions = [
      'Can you explain this concept in simpler terms?',
      'What are some real-world examples of this?',
      'How does this relate to what we learned earlier?',
      'What are the key takeaways from this section?'
    ];

    // Add context-specific questions
    if (context.selectedText) {
      questions.push(`Can you elaborate on "${context.selectedText}"?`);
    }

    return questions.slice(0, 4);
  }

  async generateMCQs(uniqueId: string, forceRegenerate = false, studentUniqueId?: string): Promise<MCQQuestion[]> {
    try {
      // Check cache first
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

      const params = new URLSearchParams({
        uniqueID: uniqueId, // Use actual unique ID
        submittedAt: new Date().toISOString()
      });

      const webhookUrl = `${this.n8nModuleAssessmentWebhookUrl}?${params.toString()}`;
      console.log('📤 Sending MCQ generation request to N8N:', webhookUrl);

      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: N8NAssessmentResponse[] = await response.json();
      console.log('📥 N8N MCQ response:', data);
      
      // Parse the output string to extract MCQ questions
      if (data && data.length > 0 && data[0].output) {
        try {
          const questionsData = JSON.parse(data[0].output);
          if (Array.isArray(questionsData)) {
            return questionsData.map((q, index) => ({
              id: q.id || `q_${index + 1}`,
              question: q.question || '',
              options: q.options || [],
              correctAnswer: q.answer || 0,
              explanation: q.explanation || '',
              difficulty: (q.level || 'medium') as 'easy' | 'medium' | 'hard',
              category: q.category || ''
            }));
          }
        } catch (parseError) {
          console.error('Failed to parse MCQ questions from N8N response:', parseError);
        }
      }

      return [];
    } catch (error) {
      console.error('🔴 MCQ Generation Error:', error);
      return [];
    }
  }

  async generateFlashcards(uniqueId: string, forceRegenerate = false, studentUniqueId?: string): Promise<any[]> {
    try {
      // Check cache first
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

      const params = new URLSearchParams({
        uniqueID: uniqueId, // Use actual unique ID
        submittedAt: new Date().toISOString()
      });

      const webhookUrl = `${this.n8nModuleAssessmentWebhookUrl}?${params.toString()}`;
      console.log('📤 Sending Flashcard generation request to N8N:', webhookUrl);

      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: N8NAssessmentResponse[] = await response.json();
      console.log('📥 N8N Flashcard response:', data);
      
      // Parse the output string to extract flashcard data
      if (data && data.length > 0 && data[0].output) {
        try {
          const flashcardData = JSON.parse(data[0].output);
          if (Array.isArray(flashcardData)) {
            return flashcardData;
          }
        } catch (parseError) {
          console.error('Failed to parse flashcard data from N8N response:', parseError);
        }
      }

      return [];
    } catch (error) {
      console.error('🔴 Flashcard Generation Error:', error);
      return [];
    }
  }

  async generateLearningPath(content: string, userPreferences?: any): Promise<any> {
    try {
      const payload = {
        content,
        userPreferences,
        type: 'learning_path',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(this.n8nLearningPathWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🔴 Learning Path Generation Error:', error);
      return null;
    }
  }

  async generateAssessment(content: string, assessmentType: string = 'diagnostic'): Promise<any> {
    try {
      const payload = {
        content,
        assessmentType,
        type: 'assessment',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(this.n8nAssessmentWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
      const payload = {
        moduleId,
        videoData: {
          id: videoData.id,
          title: videoData.title,
          url: videoData.url,
          duration: videoData.duration
        },
        transcriptData: {
          transcriptId: transcriptData.transcriptId || `transcript_${moduleId}`,
          segments: transcriptData.segments || transcriptData.transcript || [],
          totalSegments: transcriptData.segments?.length || transcriptData.transcript?.length || 0,
          language: transcriptData.language || 'en',
          confidence: transcriptData.confidence || 0.9
        },
        context: {
          currentTime: context.currentTime || 0,
          selectedText: context.selectedText || '',
          action: context.action || 'transcript_analysis',
          userInteraction: context.userInteraction || 'view',
          ...context
        },
        type: 'transcript_analysis',
        timestamp: new Date().toISOString()
      };

      console.log('📤 Sending transcript data to N8N:', {
        moduleId,
        transcriptId: payload.transcriptData.transcriptId,
        segmentsCount: payload.transcriptData.totalSegments
      });

      // Use the API route instead of direct fetch to avoid CORS issues
      const response = await fetch(`/api/modules/${moduleId}/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_transcript_data',
          payload
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
      const payload = {
        videoUrl,
        moduleId,
        options: {
          language: options.language || 'en',
          accuracy: options.accuracy || 'high',
          includeTimestamps: options.includeTimestamps !== false,
          ...options
        },
        type: 'transcript_generation',
        timestamp: new Date().toISOString()
      };

      console.log('📤 Requesting transcript generation for:', {
        moduleId,
        videoUrl: videoUrl.substring(0, 50) + '...'
      });

      // Use the API route instead of direct fetch to avoid CORS issues
      const response = await fetch(`/api/modules/${moduleId}/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_transcript',
          videoUrl,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🔴 Transcript Generation Error:', error);
      return null;
    }
  }
} 