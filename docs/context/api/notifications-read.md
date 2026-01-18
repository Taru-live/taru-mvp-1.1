# Notifications Read API Route Context

**Path:** `/api/notifications/[id]/read`  
**Method:** `POST`  
**File:** `app/api/notifications/[id]/read/route.ts`

## Purpose
Marks a specific notification as read for the authenticated user.

## Request Body
```json
{
  "read": true
}
```

## Response
**Success (200):**
```json
{
  "success": true,
  "notification": {
    "_id": "notification_id",
    "read": true,
    "readAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error (400/401/404/500):**
```json
{
  "error": "string"
}
```

## Flow
1. Validates JWT token from HTTP-only cookie
2. Verifies notification exists
3. Verifies notification belongs to authenticated user
4. Updates notification read status
5. Sets readAt timestamp
6. Returns updated notification

## Security
- JWT authentication required
- Users can only mark their own notifications as read
- Prevents unauthorized access to other users' notifications

## Related Routes
- `/api/notifications` - Get notifications
- `/api/notifications/read-all` - Mark all notifications as read

## Notes
- Idempotent operation (safe to call multiple times)
- Sets readAt timestamp when marking as read
- Only affects the specific notification ID
