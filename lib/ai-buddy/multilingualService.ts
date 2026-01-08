// Multilingual Service for AI Reading Assistant
// Adapted for taru-mvp-1.1
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  ttsCode: string;
  flag: string;
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  context?: string;
}

export interface TTSOptions {
  language: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', ttsCode: 'en-US', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', ttsCode: 'hi-IN', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', ttsCode: 'mr-IN', flag: '🇮🇳' }
];

class MultilingualService {
  private currentLanguage: Language = SUPPORTED_LANGUAGES[0]; // Default to English
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    // Only initialize voices in the browser (client-side)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initializeVoices();
    }
  }

  private initializeVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.availableVoices = speechSynthesis.getVoices();
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  setCurrentLanguage(languageCode: string) {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    if (language) {
      this.currentLanguage = language;
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  getSupportedLanguages(): Language[] {
    return SUPPORTED_LANGUAGES;
  }

  // Get translation prompts for different languages
  getTranslationPrompt(text: string, targetLanguage: string, context?: string): string {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    if (!language) return text;

    const contextInfo = context ? `\n\nContext: ${context}` : '';
    
    switch (targetLanguage) {
      case 'hi':
        return `Please translate and explain the following text in Hindi (हिन्दी). Provide a clear, simple explanation that a student would understand:

Text: "${text}"${contextInfo}

Please respond in Hindi with:
1. Translation (अनुवाद)
2. Simple explanation (सरल व्याख्या)
3. Key points (मुख्य बिंदु)`;

      case 'mr':
        return `Please translate and explain the following text in Marathi (मराठी). Provide a clear, simple explanation that a student would understand:

Text: "${text}"${contextInfo}

Please respond in Marathi with:
1. Translation (भाषांतर)
2. Simple explanation (सोप्या भाषेत स्पष्टीकरण)
3. Key points (मुख्य मुद्दे)`;

      case 'es':
        return `Por favor traduce y explica el siguiente texto en español. Proporciona una explicación clara y simple que un estudiante pueda entender:

Texto: "${text}"${contextInfo}

Por favor responde en español con:
1. Traducción
2. Explicación simple
3. Puntos clave`;

      case 'fr':
        return `Veuillez traduire et expliquer le texte suivant en français. Fournissez une explication claire et simple qu'un étudiant peut comprendre:

Texte: "${text}"${contextInfo}

Veuillez répondre en français avec:
1. Traduction
2. Explication simple
3. Points clés`;

      default:
        return `Please explain the following text in ${language.name}. Provide a clear, simple explanation that a student would understand:

Text: "${text}"${contextInfo}

Please respond with:
1. Translation (if needed)
2. Simple explanation
3. Key points`;
    }
  }

  // Enhanced TTS with multilingual support
  async speakText(text: string, options?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech completely
      this.stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);
      const targetLanguage = options?.language || this.currentLanguage.ttsCode;

      // Configure utterance
      utterance.lang = targetLanguage;
      utterance.rate = options?.rate || 0.9;
      utterance.pitch = options?.pitch || 1;
      utterance.volume = options?.volume || 0.8;

      // Find best voice for the language
      const voice = this.findBestVoice(targetLanguage, options?.voice);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech error: ${event.error}`));

      speechSynthesis.speak(utterance);
    });
  }

  // Stop all speech synthesis
  stopSpeaking() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    speechSynthesis.cancel();
    // Force multiple cancellations to ensure it stops
    setTimeout(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    }, 100);
  }

  private findBestVoice(languageCode: string, preferredVoice?: string): SpeechSynthesisVoice | null {
    // Filter voices by language
    const languageVoices = this.availableVoices.filter(voice => 
      voice.lang.toLowerCase().startsWith(languageCode.toLowerCase().substring(0, 2))
    );

    if (languageVoices.length === 0) {
      return null;
    }

    // If preferred voice specified, try to find it
    if (preferredVoice) {
      const preferred = languageVoices.find(voice => 
        voice.name.toLowerCase().includes(preferredVoice.toLowerCase())
      );
      if (preferred) return preferred;
    }

    // Find best quality voice (prefer Google, Microsoft, or system default)
    const qualityVoice = languageVoices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Natural') ||
      voice.default
    );

    return qualityVoice || languageVoices[0];
  }

  getAvailableVoicesForLanguage(languageCode: string): SpeechSynthesisVoice[] {
    return this.availableVoices.filter(voice => 
      voice.lang.toLowerCase().startsWith(languageCode.toLowerCase().substring(0, 2))
    );
  }

  // Gemini TTS with multilingual support
  async speakWithGemini(text: string, apiKey: string, languageCode?: string): Promise<string | null> {
    if (!apiKey || apiKey === 'demo-mode') {
      await this.speakText(text, { language: languageCode || this.currentLanguage.ttsCode });
      return null;
    }

    try {
      // Note: Gemini doesn't have built-in TTS like OpenAI
      // We'll use browser speech synthesis as the primary method
      console.log('🎤 Using browser speech synthesis for Gemini TTS');
      
      await this.speakText(text, { language: languageCode || this.currentLanguage.ttsCode });
      return null;
    } catch (error) {
      console.error('Gemini TTS error:', error);
      // Fallback to browser TTS
      await this.speakText(text, { language: languageCode || this.currentLanguage.ttsCode });
      return null;
    }
  }

  // Language detection (basic implementation)
  detectLanguage(text: string): string {
    // Simple language detection based on character patterns
    const hindiPattern = /[\u0900-\u097F]/;
    const marathiPattern = /[\u0900-\u097F]/; // Marathi uses Devanagari script like Hindi
    const arabicPattern = /[\u0600-\u06FF]/;
    const chinesePattern = /[\u4e00-\u9fff]/;
    const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;

    if (hindiPattern.test(text)) return 'hi';
    if (arabicPattern.test(text)) return 'ar';
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';
    
    return 'en'; // Default to English
  }

  // Get localized UI text
  getUIText(key: string): string {
    const translations: { [key: string]: { [lang: string]: string } } = {
      'readFullPDF': {
        'en': '🔊 Read Full PDF',
        'hi': '🔊 पूरा PDF पढ़ें',
        'mr': '🔊 संपूर्ण PDF वाचा',
        'es': '🔊 Leer PDF Completo',
        'fr': '🔊 Lire PDF Complet'
      },
      'explainFullPDF': {
        'en': '💡 Explain Full PDF',
        'hi': '💡 पूरा PDF समझाएं',
        'mr': '💡 संपूर्ण PDF समजावून सांगा',
        'es': '💡 Explicar PDF Completo',
        'fr': '💡 Expliquer PDF Complet'
      },
      'languageSelector': {
        'en': '🌐 Language',
        'hi': '🌐 भाषा',
        'mr': '🌐 भाषा',
        'es': '🌐 Idioma',
        'fr': '🌐 Langue'
      },
      'processing': {
        'en': 'Processing...',
        'hi': 'प्रसंस्करण...',
        'mr': 'प्रक्रिया करत आहे...',
        'es': 'Procesando...',
        'fr': 'Traitement...'
      }
    };

    return translations[key]?.[this.currentLanguage.code] || translations[key]?.['en'] || key;
  }
}

// Singleton instance
const multilingualService = new MultilingualService();
export default multilingualService; 