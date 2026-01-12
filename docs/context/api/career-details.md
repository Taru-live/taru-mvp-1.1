# Career Details API Route Context

**Path:** `/api/career-details`  
**Method:** `GET`  
**File:** `app/api/career-details/route.ts`

## Purpose
Fetches career details for a student based on their unique ID. Integrates with N8N workflow to generate personalized career paths and learning modules.

## Query Parameters
- `uniqueId`: Student unique identifier (required)
- `careerPath`: Career path name (optional)
- `description`: Career description (optional)

## Response
**Success (200):**
```json
{
  "careerDetails": {
    "_id": { "$oid": "string" },
    "uniqueid": "string",
    "output": {
      "greeting": "string",
      "overview": ["string"],
      "timeRequired": "string",
      "focusAreas": ["string"],
      "learningPath": [
        {
          "module": "string",
          "description": "string",
          "submodules": [
            {
              "title": "string",
              "description": "string",
              "chapters": [{"title": "string"}]
            }
          ]
        }
      ],
      "finalTip": "string"
    },
    "learningPathId": "string"
  }
}
```

## Flow
1. Validates authentication token
2. Finds student by unique ID
3. Checks for existing career details in database
4. If not found, calls N8N webhook to generate career details
5. Saves career details to CareerSession model
6. Returns career details

## N8N Integration
- **Webhook URL**: `https://nclbtaru.app.n8n.cloud/webhook/detail-career-path`
- **Payload**: Student data, career path, description
- **Response**: Career details with learning path

## Dependencies
- MongoDB connection (`connectDB`)
- Student model
- CareerSession model
- LearningPath model
- Learning path utilities (`learningPathUtils`)
- JWT authentication
- N8N webhook integration

## Related Routes
- `/api/career-details/save` - Save career details
- `/api/learning-paths/save` - Save learning path
- `/api/career-options` - Get career options

## Notes
- Requires student authentication
- Integrates with external N8N workflow
- Saves data to CareerSession for session management
- Supports learning path generation and saving
