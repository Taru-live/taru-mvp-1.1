// Enhanced Speech Service with Multi-language Support and Loading Indicators
// Adapted for taru-mvp-1.1
export interface SpeechConfig {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

export interface SpeechProgress {
  isLoading: boolean;
  isPlaying: boolean;
  progress: number; // 0-100
  timeElapsed: number; // seconds
  totalDuration?: number; // seconds
  currentText?: string;
  status: 'idle' | 'preparing' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';
}

export interface SpeechQueueItem {
  id: string;
  text: string;
  config?: SpeechConfig;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: SpeechProgress) => void;
}

// Gemini TTS Voice mapping for different languages (using browser voices)
const GEMINI_VOICE_MAP: Record<string, string> = {
  'en': 'alloy',
  'hi': 'onyx',
  'mr': 'nova'
};

class SpeechService {
  private currentAudio: HTMLAudioElement | null = null;
  private speechQueue: SpeechQueueItem[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private progressInterval: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private currentLanguage: string = 'en';
  
  // Progress state
  private progressState: SpeechProgress = {
    isLoading: false,
    isPlaying: false,
    progress: 0,
    timeElapsed: 0,
    status: 'idle'
  };

  private progressCallbacks: Set<(progress: SpeechProgress) => void> = new Set();

  constructor() {
    // Only initialize voices in browser environment
    if (typeof window !== 'undefined') {
      this.initializeVoices();
    }
  }

  private initializeVoices() {
    // Guard against SSR
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.voices = speechSynthesis.getVoices();
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // Set current language for TTS
  setLanguage(languageCode: string) {
    console.log('🎤 Setting speech service language to:', languageCode);
    this.currentLanguage = languageCode;
  }

  // Debug function to list available voices
  listAvailableVoices() {
    console.log('🎤 All available voices:');
    this.voices.forEach(voice => {
      console.log(`  - ${voice.name} (${voice.lang}) ${voice.default ? '[DEFAULT]' : ''}`);
    });
  }

  // Subscribe to progress updates
  onProgress(callback: (progress: SpeechProgress) => void) {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  private updateProgress(updates: Partial<SpeechProgress>) {
    try {
      this.progressState = { ...this.progressState, ...updates };
      this.progressCallbacks.forEach(callback => {
        try {
          callback(this.progressState);
        } catch (error) {
          console.error('Error in progress callback:', error);
        }
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  private startProgressTracking(text: string, estimatedDuration?: number) {
    this.startTime = Date.now();
    this.updateProgress({
      isPlaying: true,
      progress: 0,
      timeElapsed: 0,
      currentText: text,
      totalDuration: estimatedDuration,
      status: 'playing'
    });

    this.progressInterval = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      const progress = estimatedDuration ? Math.min((elapsed / estimatedDuration) * 100, 100) : 0;
      
      this.updateProgress({
        timeElapsed: elapsed,
        progress: progress
      });
    }, 100);
  }

  private stopProgressTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.updateProgress({
      isPlaying: false,
      progress: 0,
      timeElapsed: 0,
      status: 'idle'
    });
  }

  async speakWithGemini(text: string, apiKey: string, languageCode?: string): Promise<string | null> {
    const targetLanguage = languageCode || this.currentLanguage;
    
    console.log('🎤 Gemini TTS - Target Language:', targetLanguage);
    
    if (!apiKey || apiKey === 'demo-mode') {
      console.log('🎤 Fallback to browser speech for language:', targetLanguage);
      return this.speakWithBrowser(text, { language: targetLanguage });
    }

    this.updateProgress({
      isLoading: true,
      status: 'preparing',
      currentText: text
    });

    try {
      // Note: Gemini doesn't have built-in TTS like OpenAI
      // We'll use browser speech synthesis as the primary method
      console.log('🎤 Using browser speech synthesis for Gemini TTS');
      
      this.updateProgress({ isLoading: false });
      return this.speakWithBrowser(text, { language: targetLanguage });
    } catch (error) {
      console.error('Gemini TTS error:', error);
      this.updateProgress({ 
        isLoading: false, 
        status: 'error' 
      });
      // Fallback to browser speech
      console.log('🎤 Fallback to browser speech after Gemini error');
      return this.speakWithBrowser(text, { language: targetLanguage });
    }
  }

  private async playAudioUrl(audioUrl: string, text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🎵 Playing audio URL for text:', text.substring(0, 30) + '...');
        
        // Stop any current audio
        this.stopSpeaking();
        
        this.currentAudio = new Audio(audioUrl);
        const estimatedDuration = text.length * 0.08; // Rough estimate: ~0.08 seconds per character
        
        this.startProgressTracking(text, estimatedDuration);
        
        this.currentAudio.onloadstart = () => {
          console.log('🎵 Audio loading started');
          this.updateProgress({ status: 'loading' });
        };
        
        this.currentAudio.oncanplay = () => {
          console.log('🎵 Audio can start playing');
          this.updateProgress({ status: 'playing' });
        };
        
        this.currentAudio.onended = () => {
          console.log('🎵 Audio playback ended');
          this.stopProgressTracking();
          this.currentAudio = null;
          resolve(audioUrl);
        };

        this.currentAudio.onerror = (error) => {
          console.error('🎵 Audio playback error:', error);
          this.stopProgressTracking();
          this.currentAudio = null;
          reject(new Error('Audio playback failed'));
        };

        // Start playing
        this.currentAudio.play().catch(error => {
          console.error('🎵 Audio play() error:', error);
          this.stopProgressTracking();
          this.currentAudio = null;
          reject(error);
        });
        
      } catch (error) {
        console.error('🎵 Error setting up audio playback:', error);
        this.stopProgressTracking();
        reject(error);
      }
    });
  }

  speakWithBrowser(text: string, config?: SpeechConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Check if we're in browser environment
        if (typeof window === 'undefined') {
          console.error('🎤 Browser TTS - Not available in server environment');
          reject(new Error('Speech synthesis not available in server environment'));
          return;
        }

        // Check if speech synthesis is supported
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          console.error('🎤 Browser TTS - Speech synthesis not supported in this browser');
          reject(new Error('Speech synthesis not supported in this browser'));
          return;
        }

        // Check if speech synthesis is available
        if (!window.speechSynthesis) {
          console.error('🎤 Browser TTS - Speech synthesis object not available');
          reject(new Error('Speech synthesis not available'));
          return;
        }

        console.log('🎤 Browser TTS - Starting speech synthesis');
        console.log('🎤 Browser TTS - Text length:', text.length);
        console.log('🎤 Browser TTS - Language:', config?.language || this.currentLanguage);
        
        // Stop any current speech
        this.stopSpeaking();

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        // Configure utterance
        utterance.rate = config?.rate || 0.9;
        utterance.pitch = config?.pitch || 1;
        utterance.volume = config?.volume || 0.8;

        // Set language
        const targetLanguage = config?.language || this.currentLanguage;
        const ttsLanguageCode = this.getLanguageTTSCode(targetLanguage);
        utterance.lang = ttsLanguageCode;

        console.log('🎤 Browser TTS - Using language code:', ttsLanguageCode);

        // Find best voice
        const voice = this.findBestVoice(ttsLanguageCode, config?.voice);
        if (voice) {
          utterance.voice = voice;
          console.log('🎤 Browser TTS - Using voice:', voice.name);
        } else {
          console.log('🎤 Browser TTS - No specific voice found, using default');
        }

        // Set up progress tracking
        const estimatedDuration = text.length * 0.08; // Rough estimate
        this.startProgressTracking(text, estimatedDuration);

        // Event handlers
        utterance.onstart = () => {
          console.log('🎤 Browser TTS - Speech started');
          this.updateProgress({ status: 'playing' });
        };

        utterance.onend = () => {
          console.log('🎤 Browser TTS - Speech ended');
          this.stopProgressTracking();
          this.currentUtterance = null;
          resolve('web-speech-api');
        };

        utterance.onerror = (event) => {
          console.error('🎤 Browser TTS - Speech error:', event.error);
          this.stopProgressTracking();
          this.currentUtterance = null;
          
          // Try again with a simpler approach
          if (event.error === 'network' || event.error === 'synthesis-failed') {
            console.log('🎤 Browser TTS - Retrying with simplified settings');
            const simpleUtterance = new SpeechSynthesisUtterance(text);
            simpleUtterance.rate = 1;
            simpleUtterance.pitch = 1;
            simpleUtterance.volume = 1;
            
            simpleUtterance.onend = () => {
              console.log('🎤 Browser TTS - Retry successful');
              resolve('web-speech-api');
            };
            
            simpleUtterance.onerror = () => {
              console.error('🎤 Browser TTS - Retry also failed');
              reject(new Error(`Speech synthesis failed: ${event.error}`));
            };
            
            try {
              speechSynthesis.speak(simpleUtterance);
            } catch (retryError) {
              console.error('🎤 Browser TTS - Error in retry:', retryError);
              reject(new Error('Speech synthesis retry failed'));
            }
          } else {
            reject(new Error(`Speech synthesis error: ${event.error}`));
          }
        };

        // Start speaking with additional error handling
        try {
          console.log('🎤 Browser TTS - Starting speech synthesis');
          
          // Some browsers need a small delay
          setTimeout(() => {
            try {
              speechSynthesis.speak(utterance);
              console.log('🎤 Browser TTS - Speech synthesis started successfully');
            } catch (speakError) {
              console.error('🎤 Browser TTS - Error calling speak():', speakError);
              this.stopProgressTracking();
              reject(new Error('Failed to start speech synthesis'));
            }
          }, 100);
          
        } catch (error) {
          console.error('🎤 Browser TTS - Error in speech setup:', error);
          this.stopProgressTracking();
          reject(error);
        }
        
      } catch (error) {
        console.error('🎤 Browser TTS - Setup error:', error);
        this.stopProgressTracking();
        reject(error);
      }
    });
  }

  private getLanguageTTSCode(languageCode: string): string {
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'mr': 'mr-IN'
    };
    const result = languageMap[languageCode] || 'en-US';
    console.log('🎤 Language mapping:', languageCode, '->', result);
    return result;
  }

  private findBestVoice(languageCode: string, preferredVoice?: string): SpeechSynthesisVoice | null {
    console.log('🎤 Finding voice for language code:', languageCode);
    console.log('🎤 Available voices:', this.voices.map(v => `${v.name} (${v.lang})`));
    
    // Filter voices by language
    const languageVoices = this.voices.filter(voice => 
      voice.lang.toLowerCase().startsWith(languageCode.toLowerCase().substring(0, 2))
    );

    console.log('🎤 Filtered voices for', languageCode + ':', languageVoices.map(v => `${v.name} (${v.lang})`));

    if (languageVoices.length === 0) {
      console.log('🎤 No voices found for language:', languageCode);
      return null;
    }

    // If preferred voice specified, try to find it
    if (preferredVoice) {
      const preferred = languageVoices.find(voice => 
        voice.name.toLowerCase().includes(preferredVoice.toLowerCase())
      );
      if (preferred) {
        console.log('🎤 Found preferred voice:', preferred.name);
        return preferred;
      }
    }

    // Find best quality voice
    const qualityVoice = languageVoices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Natural') ||
      voice.default
    );

    const selectedVoice = qualityVoice || languageVoices[0];
    console.log('🎤 Selected voice:', selectedVoice?.name, selectedVoice?.lang);
    
    return selectedVoice;
  }

  stopSpeaking() {
    this.updateProgress({ status: 'stopped' });
    
    // Stop HTML5 audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio.src = '';
      this.currentAudio = null;
    }

    // Stop speech synthesis - only in browser environment
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Stop speech synthesis - multiple attempts to ensure it stops
      if (this.currentUtterance) {
        speechSynthesis.cancel();
        this.currentUtterance = null;
      }

      // Force stop speech synthesis with multiple cancellations
      speechSynthesis.cancel();
      setTimeout(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          speechSynthesis.cancel();
        }
      }, 50);
      setTimeout(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          speechSynthesis.cancel();
        }
      }, 100);
    }
    
    // Clear queue and progress tracking
    this.clearQueue();
    this.stopProgressTracking();
  }

  pauseSpeaking() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.updateProgress({ status: 'paused' });
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.pause();
      this.updateProgress({ status: 'paused' });
    }
  }

  resumeSpeaking() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
      this.updateProgress({ status: 'playing' });
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && speechSynthesis.paused) {
      speechSynthesis.resume();
      this.updateProgress({ status: 'playing' });
    }
  }

  getProgress(): SpeechProgress {
    return this.progressState;
  }

  getIsPlaying(): boolean {
    return this.progressState.isPlaying;
  }

  getIsLoading(): boolean {
    return this.progressState.isLoading;
  }

  getAvailableVoices(languageCode?: string): SpeechSynthesisVoice[] {
    if (!languageCode) {
      return this.voices;
    }
    
    return this.voices.filter(voice => 
      voice.lang.toLowerCase().startsWith(languageCode.toLowerCase().substring(0, 2))
    );
  }

  // Queue management for multiple speech requests
  addToQueue(item: SpeechQueueItem) {
    this.speechQueue.push(item);
    if (!this.getIsPlaying() && !this.getIsLoading()) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.speechQueue.length === 0 || this.getIsPlaying() || this.getIsLoading()) {
      return;
    }

    const item = this.speechQueue.shift();
    if (!item) return;

    try {
      if (item.onStart) item.onStart();
      
      // Subscribe to progress updates for this item
      let unsubscribe: (() => void) | null = null;
      if (item.onProgress) {
        unsubscribe = this.onProgress(item.onProgress);
      }

      await this.speakWithBrowser(item.text, item.config);
      
      if (unsubscribe) unsubscribe();
      if (item.onEnd) item.onEnd();
    } catch (error) {
      if (item.onError) item.onError(error as Error);
    }

    // Process next item
    setTimeout(() => this.processQueue(), 100);
  }

  clearQueue() {
    this.speechQueue = [];
  }

  // Get formatted time string
  getFormattedTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Singleton instance
const speechService = new SpeechService();
export default speechService; 