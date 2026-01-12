# Chat API Route Context

**Path:** `/api/chat`  
**Method:** `POST` | `GET`  
**File:** `app/api/chat/route.ts`

## Purpose
Handles chat interactions with AI/N8N workflows. Processes student queries and returns AI-generated responses. Supports both POST and GET methods.

## Request Body (POST)
```json
{
  "query": "string",
  "message": "string",
  "studentData": {
    "name": "string",
    "email": "string",
    "grade": "string",
    "school": "string",
    "uniqueId": "string",
    "timestamp": "string"
  },
  "studentUniqueId": "string",
  "sessionId": "string",
  "webhookUrl": "string (optional)"
}
```

## Query Parameters (GET)
- `query` or `message`: Chat message
- `studentUniqueId`: Student unique identifier
- `sessionId`: Session identifier
- `name`, `email`, `grade`, `school`, `uniqueId`: Student data
- `webhookUrl`: Custom webhook URL (optional)

## Response
**Success (200):**
```json
{
  "response": "string",
  "sessionId": "string",
  "metadata": {}
}
```

**Error (400/500):**
```json
{
  "error": "string"
}
```

## Flow
1. Validates query/message and student data
2. Constructs payload with student information
3. Sends request to N8N webhook
4. Handles timeout (30 seconds)
5. Processes response from N8N
6. Returns formatted response

## N8N Integration
- **Default Webhook**: `https://nclbtaru.app.n8n.cloud/webhook/MCQ`
- **Custom Webhook**: Can be overridden via parameter
- **Timeout**: 30 seconds
- **Payload**: Includes query, student data, session ID

## Dependencies
- N8N webhook integration
- Environment variable: `N8N_WEBHOOK_URL`

## Related Routes
- `/api/webhook/chat-transcribe` - Chat transcription webhook
- `/api/mindmap/process-pdf` - PDF processing for context

## Notes
- Supports both POST and GET methods
- Includes student context in requests
- Implements timeout handling for reliability
- Used by AI Buddy chat feature
- Session ID for conversation continuity
