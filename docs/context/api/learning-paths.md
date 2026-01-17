# Learning Paths API Route Context

**Path:** `/api/learning-paths`  
**Method:** `GET` | `POST`  
**File:** `app/api/learning-paths/route.ts`

## Purpose
Manages learning paths for students. GET retrieves learning paths, POST creates new learning paths. Learning paths are personalized educational roadmaps.

## GET /api/learning-paths

### Query Parameters
- `status` (optional): Filter by status (`active`, `completed`, `archived`)
- `limit` (optional): Number of paths to return
- `skip` (optional): Number of paths to skip

### Response
**Success (200):**
```json
{
  "success": true,
  "learningPaths": [
    {
      "_id": "path_id",
      "studentId": "student_id",
      "title": "string",
      "description": "string",
      "careerPath": "string",
      "modules": [],
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 5
}
```

## POST /api/learning-paths

### Request Body
```json
{
  "title": "string",
  "description": "string",
  "careerPath": "string",
  "modules": [
    {
      "moduleId": "module_id",
      "order": 1
    }
  ]
}
```

### Response
**Success (201):**
```json
{
  "success": true,
  "learningPath": {
    "_id": "path_id",
    "studentId": "student_id",
    "title": "string",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Learning Path Structure
- **Title**: Learning path name
- **Description**: Path description
- **Career Path**: Associated career
- **Modules**: Ordered list of modules
- **Status**: active, completed, archived

## User Access
- **Students**: Can view and create their own learning paths
- **Teachers**: Can view learning paths of their students
- **Parents**: Can view learning paths of their children

## Dependencies
- MongoDB connection (`connectDB`)
- User model
- Student model
- LearningPath model (if exists)
- Module model

## Security
- JWT authentication required
- Student-scoped access
- Teachers/parents can view associated students' paths

## Related Routes
- `/api/learning-paths/[id]` - Get/update/delete specific learning path
- `/api/learning-paths/save` - Save learning path (with payment check)
- `/api/learning-paths/generate` - Generate learning path from career
- `/api/learning-paths/[id]/set-active` - Set active learning path

## Notes
- Learning paths are personalized to each student
- Supports multiple learning paths per student
- Can be generated from career exploration
- Payment may be required to save learning paths
