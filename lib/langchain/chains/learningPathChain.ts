/**
 * Learning Path Generation Chain
 * 
 * LangChain chain for generating personalized learning paths.
 * Replaces n8n learnign-path webhook workflow.
 */

import { RunnableSequence } from '@langchain/core/runnables';
import { createLearningPathLLM } from '../utils/llm';
import { learningPathPrompt } from '../prompts/learningPath';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

// Learning Path Schema matching the database model
const LearningPathSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(['academic', 'vocational', 'life-skills']),
  milestones: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      modules: z.array(z.string()),
      estimatedTime: z.number(),
      prerequisites: z.array(z.string()),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      skills: z.array(z.string()),
      learningObjectives: z.array(z.string()),
    })
  ),
  totalModules: z.number(),
  totalDuration: z.number(),
  totalXpPoints: z.number(),
});

export type LearningPathOutput = z.infer<typeof LearningPathSchema>;

export interface LearningPathInput {
  studentName: string;
  grade: string;
  skills: string[];
  interests: string[];
  careerGoals: string[];
  dreamJob: string;
  aspirations: string;
  problemsToSolve: string;
  learningStyle: string[];
  languagePreference: string;
  assessmentResults?: any;
  validationResults?: any;
  duration?: string;
  format?: string;
  platform?: string;
  includeProjects?: boolean;
  includeAssessments?: boolean;
}

/**
 * Create learning path generation chain
 * Original n8n workflow: learnign-path
 */
export function createLearningPathChain(): RunnableSequence {
  const llm = createLearningPathLLM();
  const parser = StructuredOutputParser.fromZodSchema(LearningPathSchema);
  
  return RunnableSequence.from([
    learningPathPrompt,
    llm,
    async (response) => {
      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
      
      // Try to parse JSON from response
      try {
        // Remove markdown code blocks if present
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return parsed;
      } catch (error) {
        console.error('Error parsing learning path JSON:', error);
        throw new Error('Failed to parse learning path response');
      }
    },
  ]);
}

/**
 * Generate learning path using LangChain
 * Replaces N8NService.generateLearningPath()
 */
export async function generateLearningPath(
  input: LearningPathInput
): Promise<LearningPathOutput | null> {
  try {
    const llm = createLearningPathLLM();
    
    // Format input for prompt
    const formattedInput = {
      studentName: input.studentName,
      grade: input.grade,
      skills: Array.isArray(input.skills) ? input.skills.join(', ') : input.skills,
      interests: Array.isArray(input.interests) ? input.interests.join(', ') : input.interests,
      careerGoals: Array.isArray(input.careerGoals) ? input.careerGoals.join(', ') : input.careerGoals,
      dreamJob: input.dreamJob || '',
      aspirations: input.aspirations || '',
      problemsToSolve: input.problemsToSolve || '',
      learningStyle: Array.isArray(input.learningStyle) ? input.learningStyle.join(', ') : input.learningStyle,
      languagePreference: input.languagePreference || 'English',
      assessmentResults: JSON.stringify(input.assessmentResults || {}),
      validationResults: JSON.stringify(input.validationResults || {}),
      duration: input.duration || '6 months',
      format: input.format || 'video-based',
      platform: input.platform || 'YouTube',
      includeProjects: (input.includeProjects ?? true).toString(),
      includeAssessments: (input.includeAssessments ?? true).toString(),
    };

    // Invoke chain
    const response = await learningPathPrompt.pipe(llm).invoke(formattedInput);
    
    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);

    // Parse JSON response
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      // Validate against schema
      return LearningPathSchema.parse(parsed);
    } catch (error) {
      console.error('Error parsing learning path:', error);
      return null;
    }
  } catch (error) {
    console.error('LangChain learning path generation error:', error);
    return null;
  }
}

