# Assessment Diagnostic API Route Context

**Path:** `/api/assessment/diagnostic`  
**Method:** `POST`  
**File:** `app/api/assessment/diagnostic/route.ts`

## Purpose
Handles diagnostic assessment submission for students. Calculates scores, determines learning style, generates recommendations, and saves results.

## Request Body
```json
{
  "answers": {
    "questionId": "selectedAnswer"
  },
  "timeSpent": number
}
```

## Response
**Success (200):**
```json
{
  "message": "Assessment completed successfully",
  "results": {
    "overallScore": number,
    "percentageScore": number,
    "sectionScores": {},
    "learningStyle": "string",
    "recommendations": ["string"],
    "strengths": ["string"],
    "areasForImprovement": ["string"]
  }
}
```

## Flow
1. Validates authentication token
2. Verifies user is a student
3. Gets student profile to determine grade
4. Validates answers
5. Calculates section scores
6. Determines learning style
7. Generates recommendations
8. Saves assessment response to database
9. Updates student profile with assessment completion

## Score Calculation
- Uses `calculateSectionScores` utility
- Calculates overall score and percentage
- Determines learning style based on section scores
- Generates personalized recommendations

## Dependencies
- MongoDB connection (`connectDB`)
- User model
- Student model
- Assessment model
- AssessmentResponse model
- Diagnostic questions utilities (`diagnosticQuestions`)
- JWT authentication

## Related Routes
- `/api/assessment/questions` - Get assessment questions
- `/api/assessment/result` - Get assessment results
- `/api/assessment/store-answers` - Store answers during assessment

## Notes
- Requires student authentication
- Grade-specific questions loaded based on student's class grade
- Results saved to AssessmentResponse collection
- Updates student's diagnostic assessment completion status
