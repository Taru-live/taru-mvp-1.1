/**
 * Learning Path Generation Prompts
 * 
 * Prompts for generating personalized learning paths.
 * Replaces n8n learnign-path webhook workflow.
 */

import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Learning path generation prompt template
 * Original n8n workflow: learnign-path
 * Input: Student profile, assessment results, validation results
 * Output: Personalized learning path with milestones
 */
export const learningPathPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an expert educational path designer specializing in creating personalized learning journeys for students.

Your task is to analyze a student's profile, assessment results, and preferences to generate a comprehensive, structured learning path.

Learning Path Requirements:
- Must include 3-7 milestones
- Each milestone should have clear learning objectives
- Milestones should progress from foundational to advanced
- Include estimated time for each milestone
- Specify prerequisites between milestones
- Align with student's interests, skills, and career goals
- Include modules/chapters for each milestone
- Set appropriate difficulty levels (beginner/intermediate/advanced)

Output Format:
You must respond with a valid JSON object containing:
{
  "name": "Learning Path Name",
  "description": "Brief description of the learning path",
  "category": "academic" | "vocational" | "life-skills",
  "milestones": [
    {
      "name": "Milestone Name",
      "description": "What students will learn",
      "modules": ["module_id_1", "module_id_2"],
      "estimatedTime": 120, // in minutes
      "prerequisites": [], // array of milestone IDs
      "difficulty": "beginner" | "intermediate" | "advanced",
      "skills": ["skill1", "skill2"],
      "learningObjectives": ["objective1", "objective2"]
    }
  ],
  "totalModules": 10,
  "totalDuration": 600, // in minutes
  "totalXpPoints": 500
}`],
  ['human', `Generate a personalized learning path for this student:

Student Profile:
- Name: {studentName}
- Grade: {grade}
- Skills/Subjects Liked: {skills}
- Interests: {interests}
- Career Goals: {careerGoals}
- Dream Job: {dreamJob}
- Aspirations: {aspirations}
- Problems to Solve: {problemsToSolve}
- Learning Style: {learningStyle}
- Language Preference: {languagePreference}

Assessment Results:
{assessmentResults}

Validation Results:
{validationResults}

Requirements:
- Duration: {duration}
- Format: {format}
- Platform: {platform}
- Include Projects: {includeProjects}
- Include Assessments: {includeAssessments}

Generate a comprehensive learning path that matches the student's profile and requirements. Return ONLY valid JSON, no additional text.`],
]);

