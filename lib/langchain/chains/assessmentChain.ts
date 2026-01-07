/**
 * Assessment Generation Chain
 * 
 * LangChain chain for generating assessment questions.
 * Replaces n8n assessment-questions webhook workflow.
 */

import { RunnableSequence } from '@langchain/core/runnables';
import { createAssessmentLLM } from '../utils/llm';
import { assessmentQuestionsPrompt, AssessmentQuestionSchema } from '../prompts/assessment';

export interface AssessmentInput {
  studentName: string;
  age: number;
  classGrade: string;
  languagePreference: string;
  schoolName: string;
  preferredSubject: string;
  type: string;
}

export interface AssessmentQuestion {
  id: string | number;
  question: string;
  type: 'Multiple Choice' | 'Single Choice' | 'Pattern Choice' | 'Open Text';
  difficulty: 'Primary' | 'Middle' | 'Secondary';
  section?: string;
  options?: string[];
}

/**
 * Create assessment question generation chain
 * Original n8n workflow: assessment-questions
 */
export function createAssessmentChain(): RunnableSequence {
  const llm = createAssessmentLLM();
  
  return RunnableSequence.from([
    assessmentQuestionsPrompt,
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
        console.error('Error parsing assessment questions JSON:', error);
        throw new Error('Failed to parse assessment questions response');
      }
    },
  ]);
}

/**
 * Generate assessment questions using LangChain
 * Replaces N8NService.generateAssessment()
 */
export async function generateAssessmentQuestions(
  input: AssessmentInput
): Promise<AssessmentQuestion[]> {
  try {
    const llm = createAssessmentLLM();
    
    // Format input for prompt
    const formattedInput = {
      studentName: input.studentName,
      age: input.age.toString(),
      classGrade: input.classGrade,
      languagePreference: input.languagePreference,
      schoolName: input.schoolName,
      preferredSubject: input.preferredSubject,
      type: input.type,
    };

    // Invoke chain
    const response = await assessmentQuestionsPrompt.pipe(llm).invoke(formattedInput);
    
    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);

    // Parse JSON response
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      // Validate against schema
      const validated = AssessmentQuestionSchema.parse(parsed);
      return validated.questions;
    } catch (error) {
      console.error('Error parsing assessment questions:', error);
      return [];
    }
  } catch (error) {
    console.error('LangChain assessment generation error:', error);
    return [];
  }
}

