/**
 * Assessment Result Analysis Prompts
 * 
 * Prompts for analyzing assessment results and generating insights.
 * Replaces n8n Score-result webhook workflow.
 */

import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

/**
 * Assessment Analysis Result Schema
 */
export const AssessmentAnalysisSchema = z.object({
  Score: z.string(),
  'Total Questions': z.string(),
  Summary: z.string(),
  PersonalityType: z.string().optional(),
  LearningStyle: z.string().optional(),
  Recommendations: z.array(z.string()).optional(),
});

/**
 * Assessment analysis prompt template
 * Original n8n workflow: Score-result
 * Input: Student uniqueId and assessment responses
 * Output: Analysis with score, summary, learning style, recommendations
 */
export const assessmentAnalysisPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an expert educational psychologist specializing in analyzing student assessment results and providing personalized learning insights.

Your task is to analyze a student's assessment responses and generate:
1. Overall score and performance summary
2. Learning style identification
3. Personality type or learning profile
4. Personalized recommendations for improvement

Analysis Guidelines:
- Be encouraging and constructive
- Identify strengths and areas for growth
- Provide actionable recommendations
- Consider the student's age and grade level
- Focus on learning strategies, not just scores

Output Format:
You must respond with a valid JSON object:
{
  "Score": "85", // Overall score as string
  "Total Questions": "10", // Total questions answered
  "Summary": "Comprehensive summary of performance, strengths, and areas for improvement",
  "PersonalityType": "Visual Learner" | "Kinesthetic Learner" | "Auditory Learner" | etc.,
  "LearningStyle": "Active" | "Reflective" | "Sequential" | "Global" | etc.,
  "Recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}

Return ONLY valid JSON, no additional text.`],
  ['human', `Analyze assessment results for this student:

Student Unique ID: {uniqueId}

Assessment Responses:
{responses}

Generate a comprehensive analysis including score, summary, learning style identification, and personalized recommendations. Return ONLY valid JSON, no additional text.`],
]);

