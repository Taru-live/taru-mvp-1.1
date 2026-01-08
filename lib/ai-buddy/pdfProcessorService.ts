// PDF Processor Service for Full PDF Reading and Explanation
// Adapted for taru-mvp-1.1
import { getGeminiService } from './gemini';
import multilingualService from './multilingualService';

export interface PDFChapter {
  title: string;
  content: string;
  startPage: number;
  endPage: number;
  lines: string[];
}

export interface ProcessingProgress {
  current: number;
  total: number;
  status: string;
  percentage: number;
}

export interface ExplanationResult {
  originalText: string;
  explanation: string;
  language: string;
  keyPoints: string[];
}

class PDFProcessorService {
  private currentPDF: string = '';
  private chapters: PDFChapter[] = [];
  private isProcessing: boolean = false;

  // Set the current PDF content
  setPDFContent(content: string) {
    this.currentPDF = content;
    this.analyzeChapters();
  }

  // Analyze and detect chapters in the PDF
  private analyzeChapters() {
    if (!this.currentPDF) return;

    const lines = this.currentPDF.split('\n').filter(line => line.trim());
    const chapters: PDFChapter[] = [];
    let currentChapter: PDFChapter | null = null;
    let currentPage = 1;

    // Chapter detection patterns
    const chapterPatterns = [
      /^(Chapter|CHAPTER)\s+(\d+|[IVXLCDM]+)[\s\:\-]*(.*)/i,
      /^(\d+)\.\s*(.*)/,
      /^(Unit|UNIT)\s+(\d+)[\s\:\-]*(.*)/i,
      /^(Section|SECTION)\s+(\d+)[\s\:\-]*(.*)/i,
      /^(Lesson|LESSON)\s+(\d+)[\s\:\-]*(.*)/i,
      /^(Part|PART)\s+(\d+)[\s\:\-]*(.*)/i
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line starts a new chapter
      const isChapterStart = chapterPatterns.some(pattern => pattern.test(line));
      
      if (isChapterStart) {
        // Save previous chapter if exists
        if (currentChapter) {
          currentChapter.endPage = currentPage;
          chapters.push(currentChapter);
        }
        
        // Start new chapter
        currentChapter = {
          title: line,
          content: '',
          startPage: currentPage,
          endPage: currentPage,
          lines: []
        };
      }
      
      // Add line to current chapter
      if (currentChapter) {
        currentChapter.content += line + '\n';
        currentChapter.lines.push(line);
      } else {
        // If no chapter detected yet, create a default one
        if (chapters.length === 0) {
          currentChapter = {
            title: 'Introduction',
            content: '',
            startPage: 1,
            endPage: 1,
            lines: []
          };
        }
        if (currentChapter) {
          currentChapter.content += line + '\n';
          currentChapter.lines.push(line);
        }
      }
      
      // Estimate page breaks (every ~50 lines)
      if (i % 50 === 0 && i > 0) {
        currentPage++;
      }
    }
    
    // Add the last chapter
    if (currentChapter) {
      currentChapter.endPage = currentPage;
      chapters.push(currentChapter);
    }
    
    // If no chapters detected, create one big chapter
    if (chapters.length === 0) {
      chapters.push({
        title: 'Complete Document',
        content: this.currentPDF,
        startPage: 1,
        endPage: currentPage,
        lines: lines
      });
    }
    
    this.chapters = chapters;
  }

  // Get detected chapters
  getChapters(): PDFChapter[] {
    return this.chapters;
  }

  // Read full PDF aloud with progress tracking
  async readFullPDF(
    apiKey: string,
    languageCode: string = 'en',
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<void> {
    if (!this.currentPDF) {
      throw new Error('No PDF content available');
    }

    // Prevent multiple simultaneous processing
    if (this.isProcessing) {
      throw new Error('Already processing. Please stop current operation first.');
    }

    // Stop any existing audio before starting
    this.stopProcessing();
    
    this.isProcessing = true;
    
    try {
      // Split content into manageable chunks (TTS has character limits)
      const chunks = this.splitIntoChunks(this.currentPDF, 4000);
      
             for (let i = 0; i < chunks.length; i++) {
         // Check if processing was stopped
         if (!this.isProcessing) {
           console.log('Processing stopped by user');
           break;
         }

         if (onProgress) {
           onProgress({
             current: i + 1,
             total: chunks.length,
             status: `Reading chunk ${i + 1} of ${chunks.length}`,
             percentage: Math.round(((i + 1) / chunks.length) * 100)
           });
         }

         try {
           // Use multilingual service for TTS
           if (apiKey && apiKey !== 'demo-mode') {
             await multilingualService.speakWithGemini(chunks[i], apiKey, languageCode);
           } else {
             await multilingualService.speakText(chunks[i], { language: languageCode });
           }
         } catch (error) {
           console.error('TTS error:', error);
           // Continue with next chunk even if one fails
         }
         
         // Check again if processing was stopped during TTS
         if (!this.isProcessing) {
           console.log('Processing stopped during TTS');
           break;
         }
         
         // Small delay between chunks
         await new Promise(resolve => setTimeout(resolve, 500));
       }
    } finally {
      this.isProcessing = false;
    }
  }

  // Read specific chapter aloud
  async readChapter(
    chapterIndex: number,
    apiKey: string,
    languageCode: string = 'en',
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<void> {
    if (chapterIndex < 0 || chapterIndex >= this.chapters.length) {
      throw new Error('Invalid chapter index');
    }

    // Prevent multiple simultaneous processing
    if (this.isProcessing) {
      throw new Error('Already processing. Please stop current operation first.');
    }

    // Stop any existing audio before starting
    this.stopProcessing();

    const chapter = this.chapters[chapterIndex];
    const chunks = this.splitIntoChunks(chapter.content, 4000);
    
    this.isProcessing = true;
    
    try {
             for (let i = 0; i < chunks.length; i++) {
         // Check if processing was stopped
         if (!this.isProcessing) {
           console.log('Chapter reading stopped by user');
           break;
         }

         if (onProgress) {
           onProgress({
             current: i + 1,
             total: chunks.length,
             status: `Reading "${chapter.title}" - chunk ${i + 1} of ${chunks.length}`,
             percentage: Math.round(((i + 1) / chunks.length) * 100)
           });
         }

         try {
           if (apiKey && apiKey !== 'demo-mode') {
             await multilingualService.speakWithGemini(chunks[i], apiKey, languageCode);
           } else {
             await multilingualService.speakText(chunks[i], { language: languageCode });
           }
         } catch (error) {
           console.error('Chapter TTS error:', error);
         }
         
         // Check again if processing was stopped during TTS
         if (!this.isProcessing) {
           console.log('Chapter reading stopped during TTS');
           break;
         }
         
         await new Promise(resolve => setTimeout(resolve, 500));
       }
    } finally {
      this.isProcessing = false;
    }
  }

  // Explain full PDF line by line
  async explainFullPDF(
    apiKey: string,
    languageCode: string = 'en',
    onProgress?: (progress: ProcessingProgress) => void,
    onExplanation?: (result: ExplanationResult) => void
  ): Promise<ExplanationResult[]> {
    if (!this.currentPDF) {
      throw new Error('No PDF content available');
    }

    const results: ExplanationResult[] = [];
    const lines = this.currentPDF.split('\n').filter(line => line.trim().length > 10); // Skip short lines
    
    this.isProcessing = true;
    
    try {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: lines.length,
            status: `Explaining line ${i + 1} of ${lines.length}`,
            percentage: Math.round(((i + 1) / lines.length) * 100)
          });
        }

        try {
          const explanation = await this.explainLine(line, apiKey, languageCode);
          results.push(explanation);
          
          if (onExplanation) {
            onExplanation(explanation);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error explaining line ${i + 1}:`, error);
          // Continue with next line
        }
      }
    } finally {
      this.isProcessing = false;
    }
    
    return results;
  }

  // Explain specific chapter line by line
  async explainChapter(
    chapterIndex: number,
    apiKey: string,
    languageCode: string = 'en',
    onProgress?: (progress: ProcessingProgress) => void,
    onExplanation?: (result: ExplanationResult) => void
  ): Promise<ExplanationResult[]> {
    if (chapterIndex < 0 || chapterIndex >= this.chapters.length) {
      throw new Error('Invalid chapter index');
    }

    const chapter = this.chapters[chapterIndex];
    const results: ExplanationResult[] = [];
    
    this.isProcessing = true;
    
    try {
      for (let i = 0; i < chapter.lines.length; i++) {
        const line = chapter.lines[i].trim();
        
        if (line.length < 10) continue; // Skip short lines
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: chapter.lines.length,
            status: `Explaining "${chapter.title}" - line ${i + 1} of ${chapter.lines.length}`,
            percentage: Math.round(((i + 1) / chapter.lines.length) * 100)
          });
        }

        try {
          const explanation = await this.explainLine(line, apiKey, languageCode, chapter.title);
          results.push(explanation);
          
          if (onExplanation) {
            onExplanation(explanation);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error explaining line ${i + 1} in chapter ${chapterIndex}:`, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
    
    return results;
  }

  // Explain a single line
  private async explainLine(
    line: string,
    apiKey: string,
    languageCode: string,
    chapterContext?: string
  ): Promise<ExplanationResult> {
    const aiService = getGeminiService();
    
    if (!aiService || apiKey === 'demo-mode') {
      // Demo mode response
      return {
        originalText: line,
        explanation: `Demo explanation for: "${line}". In full mode, this would provide detailed AI-powered explanations in ${languageCode}.`,
        language: languageCode,
        keyPoints: ['Demo point 1', 'Demo point 2']
      };
    }

    try {
      const context = chapterContext ? `Chapter: ${chapterContext}\n\n` : '';
      const prompt = multilingualService.getTranslationPrompt(line, languageCode, context);
      
      const response = await aiService.processTextSelection(
        line,
        'explain-sentence',
        prompt,
        false
      );

      // Parse the response to extract key points
      const keyPoints = this.extractKeyPoints(response.text, languageCode);

      return {
        originalText: line,
        explanation: response.text,
        language: languageCode,
        keyPoints: keyPoints
      };
    } catch (error) {
      console.error('Error in AI explanation:', error);
      return {
        originalText: line,
        explanation: `Error explaining this line: ${error}`,
        language: languageCode,
        keyPoints: []
      };
    }
  }

  // Extract key points from explanation
  private extractKeyPoints(explanation: string, languageCode: string): string[] {
    const keyPoints: string[] = [];
    
    // Look for numbered lists or bullet points
    const patterns = [
      /(\d+)\.\s*([^\n]+)/g,
      /•\s*([^\n]+)/g,
      /\*\s*([^\n]+)/g,
      /-\s*([^\n]+)/g
    ];
    
    for (const pattern of patterns) {
      const matches = explanation.matchAll(pattern);
      for (const match of matches) {
        const point = match[2] || match[1];
        if (point && point.trim().length > 5) {
          keyPoints.push(point.trim());
        }
      }
    }
    
    // If no structured points found, try to extract sentences
    if (keyPoints.length === 0) {
      const sentences = explanation.split(/[.!?]+/).filter(s => s.trim().length > 10);
      keyPoints.push(...sentences.slice(0, 3).map(s => s.trim()));
    }
    
    return keyPoints.slice(0, 5); // Limit to 5 key points
  }

  // Split text into chunks for TTS
  private splitIntoChunks(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      currentChunk += sentence + '. ';
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  // Stop current processing
  stopProcessing() {
    console.log('Stopping all PDF processing...');
    
    // Set flag to stop processing loops
    this.isProcessing = false;
    
    // Stop all speech synthesis immediately
    speechSynthesis.cancel();
    
    // Force stop with multiple attempts to ensure it stops
    setTimeout(() => {
      speechSynthesis.cancel();
      console.log('Speech synthesis cancelled (attempt 1)');
    }, 50);
    
    setTimeout(() => {
      speechSynthesis.cancel();
      console.log('Speech synthesis cancelled (attempt 2)');
    }, 100);
    
    setTimeout(() => {
      speechSynthesis.cancel();
      console.log('Speech synthesis cancelled (attempt 3)');
    }, 200);
    
    // Stop multilingual service
    try {
      multilingualService.stopSpeaking();
    } catch (error) {
      console.error('Error stopping multilingual service:', error);
    }
    
    // Stop any HTML5 audio elements
    try {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((audio, index) => {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        console.log(`Stopped audio element ${index + 1}`);
      });
    } catch (error) {
      console.error('Error stopping audio elements:', error);
    }
    
    console.log('All processing stopped successfully');
  }

  // Check if currently processing
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  // Get PDF statistics
  getPDFStats() {
    if (!this.currentPDF) return null;
    
    const lines = this.currentPDF.split('\n').filter(line => line.trim());
    const words = this.currentPDF.split(/\s+/).filter(word => word.trim());
    const characters = this.currentPDF.length;
    
    return {
      totalLines: lines.length,
      totalWords: words.length,
      totalCharacters: characters,
      totalChapters: this.chapters.length,
      estimatedReadingTime: Math.ceil(words.length / 200), // Assuming 200 WPM
      estimatedTTSTime: Math.ceil(words.length / 150) // Assuming 150 WPM for TTS
    };
  }
}

// Singleton instance
const pdfProcessorService = new PDFProcessorService();
export default pdfProcessorService; 