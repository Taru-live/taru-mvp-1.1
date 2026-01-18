# Tests API Route Context

**Path:** `/api/tests`  
**Method:** `GET` | `POST`  
**File:** `app/api/tests/route.ts`

## Purpose
Manages test creation and retrieval. GET lists tests with filters, POST creates new tests. Role-based access control for different user types.

## GET /api/tests

### Query Parameters
- `status` (optional): Filter by status (`draft`, `published`, `archived`)
- `subject` (optional): Filter by subject
- `grade` (optional): Filter by grade
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### Response
**Success (200):**
```json
{
  "success": true,
  "tests": [
    {
      "_id": "test_id",
      "title": "string",
      "subject": "string",
      "grade": "string",
      "status": "published",
      "createdBy": {
        "id": "user_id",
        "type": "teacher"
      },
      "questions": [],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

## POST /api/tests

### Request Body
```json
{
  "title": "string",
  "subject": "string",
  "grade": "string",
  "description": "string",
  "duration": 60,
  "totalMarks": 100,
  "questions": [
    {
      "questionType": "multiple_choice" | "short_answer" | "essay",
      "questionText": "string",
      "options": ["option1", "option2"],
      "correctAnswer": "string",
      "points": 10,
      "order": 1
    }
  ],
  "assignedTo": {
    "studentIds": ["student_id"],
    "classGrades": ["grade1"]
  }
}
```

### Response
**Success (201):**
```json
{
  "success": true,
  "test": {
    "_id": "test_id",
    "title": "string",
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Role-Based Access

### Teachers
- Can create tests
- Can view tests they created
- Tests scoped to their user ID

### Organization Admins
- Can view all tests in their organization
- Tests scoped to organization ID

### Students
- Can only view tests assigned to them
- Only sees published tests
- Filtered by student ID or class grade

## Test Status
- **draft**: Test is being created/edited
- **published**: Test is available to assigned students
- **archived**: Test is no longer active

## Dependencies
- MongoDB connection (`connectDB`)
- User model
- Teacher model
- Organization model
- Student model
- Test model
- TestQuestion model

## Security
- JWT authentication required
- Role-based access control
- Teachers can only see their own tests
- Students can only see assigned tests
- Organization admins see organization-scoped tests

## Related Routes
- `/api/tests/[id]` - Get/update/delete specific test
- `/api/tests/[id]/assign` - Assign test to students
- `/api/tests/[id]/submit` - Submit test answers
- `/api/tests/[id]/submissions` - Get test submissions

## Notes
- Tests include questions with various types
- Supports assignment to specific students or class grades
- Pagination for large test lists
- Questions are populated in GET response
