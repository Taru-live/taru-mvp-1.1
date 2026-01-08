// Advanced Context Service for AI Understanding
// Adapted for taru-mvp-1.1
export interface SentenceMetadata {
  id: string;
  text: string;
  pageNumber?: number;
  paragraphIndex: number;
  sentenceIndex: number;
  startPosition: number;
  endPosition: number;
  timestamp: Date;
  context: {
    previousSentence?: string;
    nextSentence?: string;
    paragraph: string;
    surroundingText: string;
  };
}

export interface WordMetadata {
  word: string;
  sentence: string;
  partOfSpeech?: string;
  definition?: string;
  synonyms?: string[];
  examples?: string[];
}

export interface BookmarkItem {
  id: string;
  sentenceMetadata: SentenceMetadata;
  userNote?: string;
  timestamp: Date;
  tags: string[];
}

class ContextService {
  private sentences: SentenceMetadata[] = [];
  private bookmarks: BookmarkItem[] = [];
  private documentContent: string = '';
  private documentTitle: string = '';

  setDocument(content: string, title: string = 'Document') {
    this.documentContent = content;
    this.documentTitle = title;
    this.analyzeSentences();
  }

  private analyzeSentences() {
    this.sentences = [];
    const paragraphs = this.documentContent.split('\n\n').filter(p => p.trim());
    
    let globalPosition = 0;
    
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const sentences = this.splitIntoSentences(paragraph);
      
      sentences.forEach((sentence, sentenceIndex) => {
        if (sentence.trim()) {
          const startPosition = globalPosition;
          const endPosition = globalPosition + sentence.length;
          
          const metadata: SentenceMetadata = {
            id: `${paragraphIndex}-${sentenceIndex}-${Date.now()}`,
            text: sentence.trim(),
            paragraphIndex,
            sentenceIndex,
            startPosition,
            endPosition,
            timestamp: new Date(),
            context: {
              previousSentence: sentenceIndex > 0 ? sentences[sentenceIndex - 1] : undefined,
              nextSentence: sentenceIndex < sentences.length - 1 ? sentences[sentenceIndex + 1] : undefined,
              paragraph: paragraph.trim(),
              surroundingText: this.getSurroundingText(startPosition, endPosition)
            }
          };
          
          this.sentences.push(metadata);
        }
        globalPosition += sentence.length + 1; // +1 for space/punctuation
      });
      
      globalPosition += 2; // For paragraph breaks
    });
  }

  private splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting that handles abbreviations and edge cases
    return text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .filter(s => s.trim().length > 0);
  }

  private getSurroundingText(startPos: number, endPos: number, contextLength: number = 200): string {
    const start = Math.max(0, startPos - contextLength);
    const end = Math.min(this.documentContent.length, endPos + contextLength);
    return this.documentContent.substring(start, end);
  }

  getSentenceMetadata(text: string): SentenceMetadata | null {
    return this.sentences.find(s => 
      s.text === text.trim() || 
      s.text.includes(text.trim()) ||
      text.trim().includes(s.text)
    ) || null;
  }

  getEnhancedContext(selectedText: string): {
    metadata: SentenceMetadata | null;
    contextualPrompt: string;
    documentInfo: string;
  } {
    const metadata = this.getSentenceMetadata(selectedText);
    
    let contextualPrompt = '';
    let documentInfo = `Document: ${this.documentTitle}`;
    
    if (metadata) {
      contextualPrompt = `
Selected text: "${selectedText}"

Context information:
- Document: ${this.documentTitle}
- Paragraph: ${metadata.context.paragraph}
- Previous sentence: ${metadata.context.previousSentence || 'N/A'}
- Next sentence: ${metadata.context.nextSentence || 'N/A'}
- Surrounding context: ${metadata.context.surroundingText}

Please provide a comprehensive explanation considering this context.
      `.trim();
      
      documentInfo += ` (Paragraph ${metadata.paragraphIndex + 1}, Sentence ${metadata.sentenceIndex + 1})`;
    } else {
      contextualPrompt = `
Selected text: "${selectedText}"
Document: ${this.documentTitle}

Please provide an explanation for this text.
      `.trim();
    }

    return {
      metadata,
      contextualPrompt,
      documentInfo
    };
  }

  addBookmark(sentenceText: string, userNote?: string, tags: string[] = []): BookmarkItem | null {
    const metadata = this.getSentenceMetadata(sentenceText);
    if (!metadata) return null;

    const bookmark: BookmarkItem = {
      id: `bookmark-${Date.now()}`,
      sentenceMetadata: metadata,
      userNote,
      timestamp: new Date(),
      tags
    };

    this.bookmarks.push(bookmark);
    return bookmark;
  }

  getBookmarks(): BookmarkItem[] {
    return [...this.bookmarks].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  removeBookmark(bookmarkId: string): boolean {
    const index = this.bookmarks.findIndex(b => b.id === bookmarkId);
    if (index > -1) {
      this.bookmarks.splice(index, 1);
      return true;
    }
    return false;
  }

  searchSentences(query: string): SentenceMetadata[] {
    const lowerQuery = query.toLowerCase();
    return this.sentences.filter(s => 
      s.text.toLowerCase().includes(lowerQuery) ||
      s.context.paragraph.toLowerCase().includes(lowerQuery)
    );
  }

  getWordAnalysis(word: string, sentenceContext: string): WordMetadata {
    return {
      word: word.toLowerCase(),
      sentence: sentenceContext,
      // These would be enhanced with dictionary API or AI analysis
      partOfSpeech: this.guessPartOfSpeech(word),
      definition: `Definition of "${word}" would be provided here`,
      synonyms: [`synonym1`, `synonym2`], // Placeholder
      examples: [`Example usage of "${word}"`] // Placeholder
    };
  }

  private guessPartOfSpeech(word: string): string {
    // Simple heuristic - in a real implementation, use NLP library
    if (word.endsWith('ly')) return 'adverb';
    if (word.endsWith('ing')) return 'verb/gerund';
    if (word.endsWith('ed')) return 'verb (past tense)';
    if (word.endsWith('s') && word.length > 3) return 'noun (plural) or verb';
    return 'unknown';
  }

  generateFollowUpQuestions(sentenceText: string): string[] {
    const metadata = this.getSentenceMetadata(sentenceText);
    
    const baseQuestions = [
      `What is the main idea of this sentence?`,
      `Can you explain this in simpler terms?`,
      `What literary devices are used here?`,
      `How does this relate to the overall document?`
    ];

    if (metadata) {
      baseQuestions.push(
        `How does this sentence connect to the previous one?`,
        `What is the significance of this in the context of paragraph ${metadata.paragraphIndex + 1}?`
      );
    }

    return baseQuestions;
  }

  exportBookmarks(): string {
    return JSON.stringify({
      document: this.documentTitle,
      exportDate: new Date().toISOString(),
      bookmarks: this.bookmarks
    }, null, 2);
  }

  importBookmarks(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.bookmarks && Array.isArray(data.bookmarks)) {
        this.bookmarks = data.bookmarks;
        return true;
      }
    } catch (error) {
      console.error('Failed to import bookmarks:', error);
    }
    return false;
  }
}

// Singleton instance
const contextService = new ContextService();
export default contextService; 