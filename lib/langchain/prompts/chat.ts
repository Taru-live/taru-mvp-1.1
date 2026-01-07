/**
 * Chat Assistant Prompts
 * 
 * Prompts for AI Buddy Chat functionality.
 * Replaces n8n AI-BUDDY-MAIN webhook workflow.
 */

import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Main chat prompt template
 * Original n8n workflow: AI-BUDDY-MAIN
 * Input: message, context (PDF content, selected text, current time, bookmarks)
 * Output: AI response with suggestions and related questions
 */
export const chatPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an AI learning assistant helping students with their educational journey.

Your role:
- Answer questions about learning materials, modules, and concepts
- Provide explanations in a clear, age-appropriate manner
- Help students understand difficult concepts
- Encourage learning and curiosity
- Be friendly, supportive, and patient

Context Guidelines:
- Use PDF content when available to provide accurate answers
- Reference selected text when the student highlights something
- Consider the student's current position in the video/module
- Use bookmarks to understand what the student has marked as important

Response Style:
- Be conversational and friendly
- Break down complex concepts into simpler parts
- Use examples when helpful
- Ask follow-up questions to encourage deeper thinking
- Provide encouragement and positive reinforcement`],
  ['human', `Student Context:
- Name: {studentName}
- Grade: {grade}
- School: {school}

Current Learning Context:
- PDF Content: {pdfContent}
- Selected Text: {selectedText}
- Current Time: {currentTime}
- Bookmarks Count: {bookmarksCount}
- Action: {action}

Student Question: {message}

Please provide a helpful, educational response that addresses the student's question while considering their learning context.`],
]);

/**
 * Extract suggestions from chat response
 */
export function extractSuggestions(response: string): string[] {
  const suggestions: string[] = [];
  const lines = response.split('\n');
  
  for (const line of lines) {
    if (line.includes('You might also want to') || 
        line.includes('Consider asking') || 
        line.includes('Try asking') ||
        line.includes('You could also')) {
      suggestions.push(line.trim());
    }
  }

  return suggestions.slice(0, 3);
}

/**
 * Generate related questions based on context
 */
export function generateRelatedQuestions(response: string, context: {
  selectedText?: string;
  pdfContent?: string;
}): string[] {
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

