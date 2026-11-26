# REST API Documentation (`/api/v1`)

**Base URL**: `/api/v1`  
**Authentication**: Bearer JWT in `Authorization: Bearer <token>` header.

All responses follow a consistent JSON envelope:
```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```
Errors return `success: false` with `message` and optional `details` array.

---

## 1. Health Check
- **`GET /api/v1/health`** — Public health check.
  - **200 OK**: `{ "success": true, "message": "Support Ticket Management API is running", ... }`

---

## 2. Authentication (`/api/v1/auth`)

### Register User
- **`POST /api/v1/auth/register`** *(Public — always creates `role: "user"`)*
- **Body**:
  ```json
  {
    "name": "Alice Support",
    "email": "alice@example.com",
    "password": "Password123"
  }
  ```
- **201 Created**: Returns `{ user, token }`.
- **409 Conflict**: Email already exists.

### Login
- **`POST /api/v1/auth/login`** *(Public)*
- **Body**: `{ "email": "alice@example.com", "password": "Password123" }`
- **200 OK**: Returns `{ user, token }`.
- **401 Unauthorized**: Invalid credentials.

### Current User Profile
- **`GET /api/v1/auth/me`** *(Protected)*
- **200 OK**: Returns `{ user }`.

---

## 3. Tickets (`/api/v1/tickets`) *(Protected)*

### Create Ticket
- **`POST /api/v1/tickets`**
- **Body**:
  ```json
  {
    "title": "Cannot export PDF invoices",
    "description": "Clicking export PDF on the billing page returns a 500 error.",
    "category": "bug",
    "priority": "high"
  }
  ```
- **Categories**: `technical`, `billing`, `account`, `feature_request`, `bug`, `other`
- **Priorities**: `low`, `medium`, `high`, `urgent`
- **201 Created**: Returns `{ ticket }`. Triggers `ticket.created` event.

### List Tickets (User-scoped for `user`, All for `admin`)
- **`GET /api/v1/tickets`**
- **Query Params**:
  - `search`: Keyword match on `title`, `description`, or `ticketNumber`
  - `status`: `open | in_progress | resolved | closed`
  - `priority`: `low | medium | high | urgent`
  - `category`: Ticket category
  - `sortBy`: `createdAt | updatedAt | priority | status | title` (default `createdAt`)
  - `order`: `asc | desc` (default `desc`)
  - `page`: Page number (default `1`)
  - `limit`: Items per page (default `10`, max `50`)
- **200 OK**: Returns `{ tickets, pagination: { total, page, limit, totalPages } }`.

### Ticket Statistics
- **`GET /api/v1/tickets/stats`**
- **200 OK**: Returns `{ totalTickets, byStatus, byPriority }`.

### Get Ticket Details (with Comments & Activity Log)
- **`GET /api/v1/tickets/:id`** *(Owner or Admin)*
- **200 OK**: Returns `{ ticket, comments, activityLogs }`.
- **403 Forbidden**: Non-owner regular user.

### Update Ticket
- **`PATCH /api/v1/tickets/:id`** *(Owner while not resolved/closed, or Admin)*
- **Body**: Any subset of `{ title, description, category, priority }`.
- **200 OK**: Returns `{ ticket }`. Triggers `ticket.updated` event.

### Delete Ticket
- **`DELETE /api/v1/tickets/:id`** *(Owner while `open`, or Admin)*
- **200 OK**: Deletes ticket and associated comments/logs/notifications.

---

## 4. Comments (`/api/v1/tickets/:id/comments`) *(Protected — Owner or Admin)*

- **`GET /api/v1/tickets/:id/comments`** — Returns `{ comments }`.
- **`POST /api/v1/tickets/:id/comments`** — Body: `{ "body": "Your reply..." }`.
  - **201 Created**: Returns `{ comment }`. Triggers `comment.added` event & notification.

---

## 5. Admin Management (`/api/v1/admin`) *(Protected — `admin` role only)*

- **`GET /api/v1/admin/stats`** — Returns `{ totalTickets, totalUsers, byStatus, byPriority, byCategory, recentActivity }`.
- **`GET /api/v1/admin/tickets`** — Lists all tickets with full search, filter, sort, and pagination.
- **`PATCH /api/v1/admin/tickets/:id`** — Update `status`, `priority`, or `assignedTo`.
  - Body: `{ "status": "resolved", "priority": "high" }`
  - Triggers `ticket.status_changed` (and `ticket.resolved` when status becomes `resolved`).
- **`GET /api/v1/admin/users`** — Lists all registered users.

---

## 6. Notifications (`/api/v1/notifications`) *(Protected)*

- **`GET /api/v1/notifications`** — Returns `{ notifications, unreadCount }`.
- **`PATCH /api/v1/notifications/:id/read`** — Marks a single notification as read.
- **`PATCH /api/v1/notifications/read-all`** — Marks all notifications for the current user as read.
