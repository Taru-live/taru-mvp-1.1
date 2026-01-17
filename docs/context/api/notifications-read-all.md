# Notifications Read All API Route Context

**Path:** `/api/notifications/read-all`  
**Method:** `POST`  
**File:** `app/api/notifications/read-all/route.ts`

## Purpose
Marks all unread notifications as read for the authenticated user.

## Request Body
None required

## Response
**Success (200):**
```json
{
  "success": true,
  "count": 5,
  "message": "All notifications marked as read"
}
```

**Error (401/500):**
```json
{
  "error": "string"
}
```

## Flow
1. Validates JWT token from HTTP-only cookie
2. Finds all unread notifications for authenticated user
3. Updates all notifications to read status
4. Sets readAt timestamp for all
5. Returns count of notifications marked as read

## Security
- JWT authentication required
- Users can only mark their own notifications as read
- Bulk operation scoped to authenticated user

## Related Routes
- `/api/notifications` - Get notifications
- `/api/notifications/[id]/read` - Mark single notification as read

## Notes
- Bulk operation for convenience
- Updates all unread notifications at once
- Sets readAt timestamp for all updated notifications
- Returns count of affected notifications
