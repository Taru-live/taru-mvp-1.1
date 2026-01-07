/**
 * Assessment Analysis Chain
 * 
 * LangChain chain for analyzing assessment results.
 * Replaces n8n Score-result webhook workflow.
 */

import { RunnableSequence } from '@langchain/core/runnables';
import { createAssessmentLLM } from '../utils/llm';
import { assessmentAnalysisPrompt, AssessmentAnalysisSchema } from '../prompts/assessmentAnalysis';

export interface AssessmentAnalysisInput {
  uniqueId: string;
  responses: any[]; // Assessment responses
}

export interface AssessmentAnalysisOutput {
  Score: string;
  'Total Questions': string;
  Summary: string;
  PersonalityType?: string;
  LearningStyle?: string;
  Recommendations?: string[];
}

/**
 * Create assessment analysis chain
 * Original n8n workflow: Score-result
 */
export function createAssessmentAnalysisChain(): RunnableSequence {
  const llm = createAssessmentLLM();
  
  return RunnableSequence.from([
    assessmentAnalysisPrompt,
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
        console.error('Error parsing assessment analysis JSON:', error);
        throw new Error('Failed to parse assessment analysis response');
      }
    },
  ]);
}

/**
 * Analyze assessment results using LangChain
 * Replaces n8n Score-result webhook
 */
export async function analyzeAssessmentResults(
  input: AssessmentAnalysisInput
): Promise<AssessmentAnalysisOutput | null> {
  try {
    const llm = createAssessmentLLM();
    
    // Format input for prompt
    const formattedInput = {
      uniqueId: input.uniqueId,
      responses: JSON.stringify(input.responses),
    };

    // Invoke chain
    const response = await assessmentAnalysisPrompt.pipe(llm).invoke(formattedInput);
    
    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);

    // Parse JSON response
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      // Validate against schema
      return AssessmentAnalysisSchema.parse(parsed);
    } catch (error) {
      console.error('Error parsing assessment analysis:', error);
      return null;
    }
  } catch (error) {
    console.error('LangChain assessment analysis error:', error);
    return null;
  }
}

