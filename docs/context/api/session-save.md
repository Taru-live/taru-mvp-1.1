# Session Save API Route Context

**Path:** `/api/session/save`  
**Method:** `POST`  
**File:** `app/api/session/save/route.ts`

## Purpose
Saves page data to user session for state preservation across navigation. Part of the comprehensive session management system.

## Request Body
```json
{
  "page": "string",
  "data": {},
  "metadata": {
    "timestamp": "string",
    "userAgent": "string"
  }
}
```

## Response
**Success (200):**
```json
{
  "success": true,
  "message": "Page data saved successfully"
}
```

**Error (400/401/500):**
```json
{
  "error": "string"
}
```

## Flow
1. Validates authentication token
2. Verifies token signature
3. Validates page and data parameters
4. Saves page data using SessionManager
5. Returns success response

## Session Management
- Uses `sessionManager.savePageData()` utility
- Saves data associated with user ID
- Supports metadata for additional context
- Part of comprehensive session preservation system

## Dependencies
- MongoDB connection (via SessionManager)
- UserSession model
- SessionManager utility (`@/lib/SessionManager`)
- JWT authentication

## Related Routes
- `/api/session/load` - Load session data
- `/api/session/create` - Create new session
- `/api/session/save-assessment-progress` - Save assessment progress
- `/api/session/save-module-progress` - Save module progress
- `/api/session/save-career-progress` - Save career progress

## Notes
- Requires authentication
- Part of state preservation system
- Used by pages to save state before navigation
- Supports metadata for tracking and debugging
