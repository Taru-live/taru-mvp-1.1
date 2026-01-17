# Notifications API Route Context

**Path:** `/api/notifications`  
**Method:** `GET` | `POST`  
**File:** `app/api/notifications/route.ts`

## Purpose
Manages notifications for users. GET retrieves notifications, POST creates/sends notifications. Supports filtering, pagination, and notification types.

## GET /api/notifications

### Query Parameters
- `read` (optional): Filter by read status (`true`, `false`, or omit for all)
- `type` (optional): Filter by notification type
- `limit` (optional): Number of notifications to return (default: 50)
- `skip` (optional): Number of notifications to skip (default: 0)

### Response
**Success (200):**
```json
{
  "notifications": [
    {
      "_id": "notification_id",
      "recipientId": "user_id",
      "type": "test_assigned" | "test_graded" | "invitation" | "system",
      "title": "string",
      "message": "string",
      "read": false,
      "metadata": {},
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "unreadCount": 5,
  "total": 10
}
```

## POST /api/notifications

### Request Body
```json
{
  "recipientId": "user_id",
  "type": "test_assigned" | "test_graded" | "invitation" | "system",
  "title": "string",
  "message": "string",
  "metadata": {}
}
```

### Response
**Success (200):**
```json
{
  "success": true,
  "notification": {
    "_id": "notification_id",
    "recipientId": "user_id",
    "type": "string",
    "title": "string",
    "message": "string",
    "read": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Notification Types
- **test_assigned**: Test assigned to student
- **test_graded**: Test has been graded
- **invitation**: Invitation to join organization/class
- **system**: System notification

## User Access
- **GET**: All authenticated users can retrieve their own notifications
- **POST**: Teachers, Organization Admins, and Admins can create notifications

## Features
- Filter by read status
- Filter by notification type
- Pagination support (limit/skip)
- Unread count included in GET response
- Sorted by creation date (newest first)

## Dependencies
- MongoDB connection (`connectDB`)
- Notification model
- User model
- Student model (for student notifications)
- Teacher model (for teacher notifications)
- Parent model (for parent notifications)
- Organization model (for organization notifications)

## Security
- JWT authentication required
- Users can only access their own notifications
- Role-based access for creating notifications

## Related Routes
- `/api/notifications/[id]/read` - Mark notification as read
- `/api/notifications/read-all` - Mark all notifications as read

## Notes
- Notifications are user-scoped (recipientId)
- Supports metadata for additional context
- Automatic timestamp on creation
- Read status defaults to false
