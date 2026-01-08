// Google Gemini API Integration Service
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
}

export interface AIResponse {
  text: string;
  audioUrl?: string;
}

export type ActionType = 'read' | 'explain-sentence' | 'explain-word' | 'general-question';

class GeminiService {
  private apiKey: string;
  private model: string;
  private genAI: GoogleGenerativeAI;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-2.5-flash';
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  private getSystemPrompt(action: ActionType, context?: string): string {
    const prompts = {
      'read': `You are a text-to-speech assistant. Simply return the text as provided without any additional explanation or formatting. Just the clean text for reading aloud.`,
      
      'explain-sentence': `You are a helpful reading assistant for students. Explain the following sentence in simple, clear terms suitable for a 13-year-old student. Break down complex concepts, provide context, and make it easy to understand. Keep your explanation concise but thorough.
      
      ${context ? `Document context: ${context.substring(0, 500)}...` : ''}`,
      
      'explain-word': `You are a vocabulary tutor. Explain the meaning of the requested word in one clear sentence suitable for a student. Provide the definition, part of speech, and use it in a simple example sentence.`,
      
      'general-question': `You are an AI reading assistant helping students understand documents. Answer the question based on the provided document context. Be helpful, accurate, and educational.
      
      ${context ? `Document context: ${context.substring(0, 1000)}...` : ''}`
    };

    return prompts[action];
  }

  async generateResponse(
    text: string, 
    action: ActionType, 
    documentContext?: string
  ): Promise<AIResponse> {
    try {
      const systemPrompt = this.getSystemPrompt(action, documentContext);
      const model = this.genAI.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          maxOutputTokens: action === 'read' ? 100 : 500,
          temperature: action === 'read' ? 0.1 : 0.7,
        }
      });

      const prompt = `${systemPrompt}\n\nUser input: ${text}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      return {
        text: responseText,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Fallback responses for demo purposes
      const fallbackResponses = {
        'read': text,
        'explain-sentence': `This sentence means: ${text}. Let me break it down for you in simpler terms...`,
        'explain-word': `The word you selected refers to a concept or term that needs explanation. In a full implementation, I would provide a detailed definition.`,
        'general-question': `I understand your question about the document. In a complete implementation with API access, I would analyze the content and provide a helpful response.`
      };

      return {
        text: fallbackResponses[action] || 'I apologize, but I encountered an error processing your request.',
      };
    }
  }

  async generateSpeech(text: string): Promise<string | null> {
    try {
      // Note: Gemini doesn't have built-in TTS like OpenAI
      // We'll fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        return this.fallbackTextToSpeech(text);
      }
      
      return null;
    } catch (error) {
      console.error('TTS error:', error);
      return null;
    }
  }

  private fallbackTextToSpeech(text: string): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Find a good voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && voice.name.includes('Google')
        ) || voices.find(voice => voice.lang.startsWith('en'));
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        speechSynthesis.speak(utterance);
        resolve('web-speech-api'); // Return a special identifier
      } catch (error) {
        console.error('Web Speech API error:', error);
        resolve(null);
      }
    });
  }

  async processTextSelection(
    selectedText: string,
    action: ActionType,
    documentContext?: string,
    includeAudio: boolean = false
  ): Promise<AIResponse> {
    // Use enhanced context if provided, otherwise use basic context
    const contextToUse = documentContext || selectedText;
    const response = await this.generateResponse(selectedText, action, contextToUse);
    
    if (includeAudio && (action === 'read' || action === 'explain-sentence')) {
      const audioUrl = await this.generateSpeech(response.text);
      response.audioUrl = audioUrl || undefined;
    }

    return response;
  }

  async processWithEnhancedContext(
    selectedText: string,
    action: ActionType,
    contextualPrompt: string,
    includeAudio: boolean = false
  ): Promise<AIResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          maxOutputTokens: action === 'read' ? 100 : 800,
          temperature: action === 'read' ? 0.1 : 0.7,
        }
      });

      const systemPrompt = this.getSystemPrompt(action);
      const prompt = `${systemPrompt}\n\n${contextualPrompt}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      const aiResponse: AIResponse = { text: responseText };

      if (includeAudio && (action === 'read' || action === 'explain-sentence')) {
        const audioUrl = await this.generateSpeech(responseText);
        aiResponse.audioUrl = audioUrl || undefined;
      }

      return aiResponse;
    } catch (error) {
      console.error('Enhanced context API error:', error);
      
      // Fallback to regular processing
      return this.processTextSelection(selectedText, action, selectedText, includeAudio);
    }
  }
}

// Create a singleton instance (will be configured with API key later)
let geminiService: GeminiService | null = null;

export const initializeGemini = (apiKey: string) => {
  geminiService = new GeminiService({ apiKey });
  return geminiService;
};

export const getGeminiService = (): GeminiService | null => {
  return geminiService;
};

// Demo service for when API key is not available
export const createDemoService = (): GeminiService => {
  return new GeminiService({ apiKey: 'demo-key' });
};

export default GeminiService;
