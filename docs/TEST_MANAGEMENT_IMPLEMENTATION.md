# Test Management System Implementation

## Overview

A comprehensive test management system has been implemented to enable teachers and organizations to create, manage, and conduct tests in multiple formats including MCQ, written-answer, and video-based assessments.

## Features Implemented

### 1. Database Models

#### Test Model (`models/Test.ts`)
- Test metadata (title, description, subject, grade, classGrade)
- Question references
- Assignment configuration (individual, class, all_students)
- Test settings (duration, passing score, attempts allowed)
- Status management (draft, published, archived)
- Date restrictions (startDate, endDate)
- Options for randomization, late submission, immediate results

#### TestQuestion Model (`models/TestQuestion.ts`)
- Support for three question types:
  - **MCQ**: Multiple choice with single or multiple correct answers
  - **Written**: Text-based answers with evaluation criteria
  - **Video**: Video submission with prompts
- Points allocation
- Question ordering
- Attachments support
- Explanation fields for MCQ

#### TestSubmission Model (`models/TestSubmission.ts`)
- Student submission tracking
- Multiple attempts support
- Answer storage (MCQ options, written text, video URLs)
- Auto-grading for MCQ questions
- Status tracking (in_progress, submitted, evaluated, graded)
- Time tracking

#### TestEvaluation Model (`models/TestEvaluation.ts`)
- Manual evaluation for written and video answers
- Question-wise scoring
- Overall feedback
- Evaluator tracking (teacher/organization)

### 2. API Routes

#### Test CRUD Operations
- `GET /api/tests` - List tests with filters (status, subject, grade)
- `POST /api/tests` - Create new test
- `GET /api/tests/[id]` - Get specific test details
- `PUT /api/tests/[id]` - Update test
- `DELETE /api/tests/[id]` - Delete/archive test

#### Test Assignment
- `POST /api/tests/[id]/assign` - Assign test to students or classes

#### Test Submission
- `POST /api/tests/[id]/submit` - Submit test answers
- `GET /api/tests/[id]/submissions` - Get all submissions for a test

#### Test Evaluation
- `POST /api/tests/submissions/[submissionId]/evaluate` - Evaluate a submission
- `GET /api/tests/submissions/[submissionId]/evaluate` - Get evaluation details

#### Test Analytics
- `GET /api/tests/analytics` - Get comprehensive test analytics
  - Overview metrics
  - Performance statistics
  - Subject-wise analytics
  - Class-wise analytics
  - Test-wise analytics

### 3. Permissions System

Updated `lib/permissions.ts` to include:
- **Teachers**: create, read, update, delete, assign, evaluate tests
- **Organizations**: create, read, update, delete, assign, evaluate tests + analytics access
- **Students**: read assigned tests, submit tests

### 4. Organization Reports Enhancement

Enhanced `/api/organization/reports` with:
- **Test Analytics Report** (`type=test-analytics`)
  - Subject-wise performance
  - Class-wise performance
  - Teacher-wise test performance
  - Overall summary metrics

- **Teacher Performance Report** now includes:
  - Tests created count
  - Test submissions count
  - Average test scores
  - Test pass rates

## Security & Access Control

### Permission Checks
- Teachers can only access tests they created
- Organizations can only access tests from their organization
- Students can only see tests assigned to them
- Students can only see correct answers if `showResultsImmediately` is enabled

### Data Validation
- Test questions cannot be modified after submissions exist
- Attempt limits are enforced
- Date restrictions (startDate, endDate) are validated
- Student assignment validation (ensures students belong to teacher/organization)

## Usage Examples

### Creating a Test

```typescript
POST /api/tests
{
  "title": "Mathematics Quiz - Chapter 5",
  "description": "Assessment on algebra and geometry",
  "subject": "Mathematics",
  "grade": "Grade 8",
  "classGrade": "8A",
  "questions": [
    {
      "questionType": "mcq",
      "questionText": "What is 2 + 2?",
      "points": 10,
      "options": [
        { "id": "opt1", "text": "3", "isCorrect": false },
        { "id": "opt2", "text": "4", "isCorrect": true },
        { "id": "opt3", "text": "5", "isCorrect": false }
      ],
      "correctAnswer": "opt2",
      "explanation": "Basic addition"
    },
    {
      "questionType": "written",
      "questionText": "Explain the Pythagorean theorem",
      "points": 20,
      "minWords": 50,
      "maxWords": 200,
      "evaluationCriteria": [
        { "keyword": "right triangle", "points": 5, "description": "Mentions right triangle" },
        { "keyword": "hypotenuse", "points": 5, "description": "Mentions hypotenuse" }
      ]
    },
    {
      "questionType": "video",
      "questionText": "Record a video explaining how to solve quadratic equations",
      "points": 30,
      "videoDuration": 300,
      "prompt": "Demonstrate solving at least one quadratic equation step by step"
    }
  ],
  "totalPoints": 60,
  "passingScore": 30,
  "duration": 60,
  "assignmentType": "class",
  "assignedTo": {
    "classGrades": ["8A", "8B"]
  },
  "startDate": "2024-01-15T09:00:00Z",
  "endDate": "2024-01-20T23:59:59Z",
  "attemptsAllowed": 2,
  "showResultsImmediately": true
}
```

### Submitting a Test

```typescript
POST /api/tests/[testId]/submit
{
  "answers": [
    {
      "answer": "opt2"
    },
    {
      "answer": "The Pythagorean theorem states that in a right triangle..."
    },
    {
      "answer": "https://example.com/video.mp4",
      "videoUrl": "https://example.com/video.mp4"
    }
  ],
  "timeSpent": 2400
}
```

### Evaluating a Submission

```typescript
POST /api/tests/submissions/[submissionId]/evaluate
{
  "questionEvaluations": [
    {
      "pointsAwarded": 10
    },
    {
      "pointsAwarded": 18,
      "feedback": "Good explanation, but could mention more applications"
    },
    {
      "pointsAwarded": 25,
      "feedback": "Excellent demonstration, clear step-by-step process"
    }
  ],
  "overallFeedback": "Well done overall. Keep practicing quadratic equations."
}
```

### Getting Analytics

```typescript
GET /api/tests/analytics?subject=Mathematics&classGrade=8A&startDate=2024-01-01&endDate=2024-01-31
```

## Frontend Components Needed

The following frontend components need to be created:

1. **Test Creation Form** (`app/dashboard/teacher/components/TestCreationForm.tsx`)
   - Multi-step form for creating tests
   - Question builder with support for MCQ, written, and video types
   - Assignment configuration
   - Test settings

2. **Test Management Dashboard** (`app/dashboard/teacher/components/TestManagement.tsx`)
   - List of all tests
   - Filter and search
   - Test status management
   - Quick actions (edit, assign, view results)

3. **Test Assignment Interface** (`app/dashboard/teacher/components/TestAssignment.tsx`)
   - Student/class selector
   - Bulk assignment
   - Assignment history

4. **Student Test List** (`app/dashboard/student/components/TestList.tsx`)
   - Assigned tests
   - Test status (not started, in progress, submitted, graded)
   - Quick access to take test

5. **Test Taking Interface** (`app/dashboard/student/components/TestTaking.tsx`)
   - Question display
   - Answer input (MCQ selection, text editor, video upload)
   - Timer
   - Progress tracking
   - Submission handling

6. **Test Evaluation Interface** (`app/dashboard/teacher/components/TestEvaluation.tsx`)
   - Submission list
   - Question-by-question evaluation
   - Scoring interface
   - Feedback input
   - Bulk evaluation

7. **Test Results Dashboard** (`app/dashboard/teacher/components/TestResults.tsx`)
   - Overall statistics
   - Student performance
   - Question analysis
   - Export functionality

8. **Test Analytics Dashboard** (`app/dashboard/organization-admin/components/TestAnalytics.tsx`)
   - Subject-wise charts
   - Class-wise comparisons
   - Teacher performance
   - Trend analysis

## Next Steps

1. Create frontend components as listed above
2. Integrate with existing dashboard layouts
3. Add real-time notifications for test assignments and results
4. Implement test templates for common test types
5. Add test question bank/library
6. Implement test scheduling and reminders
7. Add export functionality (PDF, Excel)
8. Implement plagiarism detection for written answers (future enhancement)

## Database Indexes

The following indexes have been created for optimal performance:
- Test: `createdBy.id + createdAt`, `organizationId + status`, `assignedTo.studentIds`, `assignedTo.classGrades`
- TestQuestion: `testId + order`
- TestSubmission: `testId + studentId + attemptNumber` (unique), `studentId + status`, `testId + status`
- TestEvaluation: `testId + studentId`, `evaluatedBy.id + evaluatedAt`, `submissionId` (unique)

## Notes

- MCQ questions are auto-graded immediately upon submission if `showResultsImmediately` is enabled
- Written and video answers require manual evaluation by teachers/organizations
- Tests with submissions cannot have questions modified (prevents data inconsistency)
- Tests with submissions are archived instead of deleted
- All timestamps are stored in UTC
- Student IDs use both `uniqueId` and `userId` for compatibility
