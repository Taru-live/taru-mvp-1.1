/**
 * Assessment Generation Prompts
 * 
 * Prompts for generating assessment questions.
 * Replaces n8n assessment-questions webhook workflow.
 */

import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

/**
 * Assessment question schema for structured output
 */
export const AssessmentQuestionSchema = z.object({
  questions: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      question: z.string(),
      type: z.enum(['Multiple Choice', 'Single Choice', 'Pattern Choice', 'Open Text']),
      difficulty: z.enum(['Primary', 'Middle', 'Secondary']),
      section: z.string().optional(),
      options: z.array(z.string()).optional(),
    })
  ),
});

export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;

/**
 * Assessment question generation prompt template
 * Original n8n workflow: assessment-questions
 * Input: Student uniqueId and profile data
 * Output: Array of assessment questions (MCQ and Open-ended)
 */
export const assessmentQuestionsPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an expert educational assessment designer specializing in creating diagnostic assessments for students.

Your task is to generate a comprehensive set of assessment questions that evaluate:
- Learning preferences and styles
- Academic strengths and areas for improvement
- Problem-solving approaches
- Career interests and aspirations
- Motivation and learning attitudes

Question Types:
1. Multiple Choice: Questions with multiple options (use for learning preferences, interests)
2. Single Choice: Questions with single correct answer (use for factual knowledge)
3. Pattern Choice: Questions about patterns and relationships (use for analytical thinking)
4. Open Text: Questions requiring written responses (use for reflection and deeper insights)

Difficulty Levels:
- Primary: Simple, straightforward questions suitable for younger students
- Middle: Moderate complexity questions
- Secondary: Advanced questions requiring deeper thinking

Guidelines:
- Generate 8-12 questions total
- Mix question types appropriately
- Vary difficulty levels based on student grade
- Ensure questions are age-appropriate
- Make questions engaging and relevant
- Include questions about learning style, interests, and goals

Output Format:
You must respond with a valid JSON object:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "type": "Multiple Choice" | "Single Choice" | "Pattern Choice" | "Open Text",
      "difficulty": "Primary" | "Middle" | "Secondary",
      "section": "Category name",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"] // Only for choice questions
    }
  ]
}`],
  ['human', `Generate diagnostic assessment questions for this student:

Student Profile:
- Name: {studentName}
- Age: {age}
- Grade: {classGrade}
- Language Preference: {languagePreference}
- School: {schoolName}
- Preferred Subject: {preferredSubject}

Assessment Type: {type}

Generate 8-12 diverse assessment questions that will help understand the student's learning profile, interests, and academic needs. Return ONLY valid JSON, no additional text.`],
]);

