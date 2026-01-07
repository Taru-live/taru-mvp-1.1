/**
 * Module Content Generation Prompts
 * 
 * Prompts for generating MCQ questions and flashcards for modules.
 * Replaces n8n MCQ/Flash/questions webhook workflow.
 */

import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

/**
 * MCQ Question Schema
 */
export const MCQQuestionSchema = z.object({
  questions: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      question: z.string(),
      options: z.array(z.string()).length(4),
      answer: z.number().min(0).max(3), // Index of correct answer
      explanation: z.string(),
      level: z.enum(['easy', 'medium', 'hard']),
      category: z.string().optional(),
    })
  ),
});

/**
 * Flashcard Schema
 */
export const FlashcardSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      explanation: z.string().optional(),
    })
  ),
});

/**
 * MCQ generation prompt template
 * Original n8n workflow: MCQ/Flash/questions (type=mcq)
 * Input: Module uniqueId
 * Output: Array of MCQ questions
 */
export const mcqPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an expert educational content creator specializing in creating multiple-choice questions (MCQ) for educational modules.

Your task is to generate high-quality MCQ questions based on module content.

MCQ Requirements:
- Each question must have exactly 4 options
- One correct answer (specified by index 0-3)
- Clear, unambiguous question text
- Distractors should be plausible but incorrect
- Include explanations for the correct answer
- Vary difficulty levels (easy, medium, hard)
- Questions should test understanding, not just memorization

Output Format:
You must respond with a valid JSON object:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0, // Index of correct answer (0-3)
      "explanation": "Why this answer is correct",
      "level": "easy" | "medium" | "hard",
      "category": "Topic category"
    }
  ]
}

Generate 5-10 questions per module. Return ONLY valid JSON, no additional text.`],
  ['human', `Generate MCQ questions for module with uniqueId: {uniqueId}

Module Context:
- Module ID: {uniqueId}
- Student Grade: {studentGrade}
- Subject: {subject}

Generate diverse MCQ questions that test understanding of the module content. Return ONLY valid JSON, no additional text.`],
]);

/**
 * Flashcard generation prompt template
 * Original n8n workflow: MCQ/Flash/questions (type=flash)
 * Input: Module uniqueId
 * Output: Array of flashcards
 */
export const flashcardPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an expert educational content creator specializing in creating flashcards for educational modules.

Your task is to generate effective flashcards that help students review and memorize key concepts.

Flashcard Requirements:
- Clear, concise questions
- Accurate, informative answers
- Cover key concepts from the module
- Use active recall principles
- Include explanations when helpful
- Questions should prompt understanding, not just facts

Output Format:
You must respond with a valid JSON object:
{
  "flashcards": [
    {
      "question": "What is...?",
      "answer": "Detailed answer explaining the concept",
      "explanation": "Additional context or why this matters" // Optional
    }
  ]
}

Generate 5-10 flashcards per module. Return ONLY valid JSON, no additional text.`],
  ['human', `Generate flashcards for module with uniqueId: {uniqueId}

Module Context:
- Module ID: {uniqueId}
- Student Grade: {studentGrade}
- Subject: {subject}

Generate flashcards covering key concepts from the module. Return ONLY valid JSON, no additional text.`],
]);

