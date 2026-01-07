/**
 * Module Content Generation Chain
 * 
 * LangChain chain for generating MCQ questions and flashcards.
 * Replaces n8n MCQ/Flash/questions webhook workflow.
 */

import { RunnableSequence } from '@langchain/core/runnables';
import { createModuleContentLLM } from '../utils/llm';
import { mcqPrompt, flashcardPrompt, MCQQuestionSchema, FlashcardSchema } from '../prompts/moduleContent';

export interface MCQQuestion {
  id: string | number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
}

export interface Flashcard {
  question: string;
  answer: string;
  explanation?: string;
}

export interface ModuleContentInput {
  uniqueId: string;
  studentGrade?: string;
  subject?: string;
}

/**
 * Create MCQ generation chain
 * Original n8n workflow: MCQ/Flash/questions (type=mcq)
 */
export function createMCQChain(): RunnableSequence {
  const llm = createModuleContentLLM();
  
  return RunnableSequence.from([
    mcqPrompt,
    llm,
    async (response) => {
      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
      
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return parsed;
      } catch (error) {
        console.error('Error parsing MCQ JSON:', error);
        throw new Error('Failed to parse MCQ response');
      }
    },
  ]);
}

/**
 * Create flashcard generation chain
 * Original n8n workflow: MCQ/Flash/questions (type=flash)
 */
export function createFlashcardChain(): RunnableSequence {
  const llm = createModuleContentLLM();
  
  return RunnableSequence.from([
    flashcardPrompt,
    llm,
    async (response) => {
      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
      
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return parsed;
      } catch (error) {
        console.error('Error parsing flashcard JSON:', error);
        throw new Error('Failed to parse flashcard response');
      }
    },
  ]);
}

/**
 * Generate MCQ questions using LangChain
 * Replaces N8NService.generateMCQs()
 */
export async function generateMCQs(
  input: ModuleContentInput
): Promise<MCQQuestion[]> {
  try {
    const llm = createModuleContentLLM();
    
    // Format input for prompt
    const formattedInput = {
      uniqueId: input.uniqueId,
      studentGrade: input.studentGrade || '6',
      subject: input.subject || 'General',
    };

    // Invoke chain
    const response = await mcqPrompt.pipe(llm).invoke(formattedInput);
    
    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);

    // Parse JSON response
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      // Validate against schema
      const validated = MCQQuestionSchema.parse(parsed);
      
      // Transform to expected format
      return validated.questions.map((q, index) => ({
        id: q.id || `q_${index + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.answer,
        explanation: q.explanation,
        difficulty: q.level,
        category: q.category,
      }));
    } catch (error) {
      console.error('Error parsing MCQ questions:', error);
      return [];
    }
  } catch (error) {
    console.error('LangChain MCQ generation error:', error);
    return [];
  }
}

/**
 * Generate flashcards using LangChain
 * Replaces N8NService.generateFlashcards()
 */
export async function generateFlashcards(
  input: ModuleContentInput
): Promise<Flashcard[]> {
  try {
    const llm = createModuleContentLLM();
    
    // Format input for prompt
    const formattedInput = {
      uniqueId: input.uniqueId,
      studentGrade: input.studentGrade || '6',
      subject: input.subject || 'General',
    };

    // Invoke chain
    const response = await flashcardPrompt.pipe(llm).invoke(formattedInput);
    
    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);

    // Parse JSON response
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      // Validate against schema
      const validated = FlashcardSchema.parse(parsed);
      return validated.flashcards;
    } catch (error) {
      console.error('Error parsing flashcards:', error);
      return [];
    }
  } catch (error) {
    console.error('LangChain flashcard generation error:', error);
    return [];
  }
}

