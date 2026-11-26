# Support Ticket Management System (Mini Helpdesk)

A full-stack **Support Ticket Management System** built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and **React.js (Vite + Tailwind CSS)** featuring JWT authentication, Role-Based Access Control (`user` & `admin`), an event-driven activity/notification workflow, and a minimalist UI designed with **Google Stitch**.

---

## Key Features

### Core Functional Requirements
- **Authentication & RBAC**:
  - Public `/api/v1/auth/register` (assigns `user` role) and `/api/v1/auth/login` with JWT & `bcryptjs` password hashing.
  - Role-based middleware (`protect`, `authorize('admin')`) separating User and Admin capabilities.
- **User Ticket Management**:
  - Create support tickets with title, description, category, and priority (`TKT-XXXXXX` auto-generated ID).
  - View own submitted tickets, track live status (`open`, `in_progress`, `resolved`, `closed`), edit open/in-progress tickets, and delete open tickets.
  - Add comments to own tickets.
- **Admin Management**:
  - View all submitted tickets across all users.
  - Filter by status, priority, category, and search query.
  - Update ticket status, priority, and assignee.
  - Respond to any ticket via comments.
- **Event-Driven Workflow (`EventEmitter`)**:
  - Emits domain events: `ticket.created`, `ticket.updated`, `ticket.status_changed`, `comment.added`, `ticket.resolved`.
  - Listeners automatically persist an immutable **Activity Log** timeline, create **In-App Notifications**, and dispatch **Email Notifications**.

### Bonus Features Implemented
- **Search, Pagination, Sorting & Filtering** (`?search=&status=&priority=&category=&sortBy=&order=&page=&limit=`).
- **Dashboard Statistics** (`/api/v1/tickets/stats` and `/api/v1/admin/stats`) with status/priority breakdowns and recent activity feed.
- **Email Notifications** via **Nodemailer** (configurable SMTP in `.env`, gracefully skipped if unconfigured).
- **Automated API Tests** using **Jest**, **Supertest**, and **MongoDB Memory Server** (`server/tests/api.test.js`).
- **Production SPA Serving**: Express serves the compiled React build (`client/dist`) in `NODE_ENV=production`.
- **Docker Support**: Multi-stage `Dockerfile` + `docker-compose.yml`.

---

## Project Architecture

```text
.
├── client/                     # React.js (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api/                # Axios instance & JWT interceptors
│   │   ├── components/         # Layout, ProtectedRoute, Badges
│   │   ├── context/            # AuthContext (JWT session & role state)
│   │   ├── pages/              # Login, Register, Dashboard, Create, Detail, Admin
│   │   ├── App.jsx             # Client-side routing
│   │   └── main.jsx
│   └── vite.config.js
├── server/                     # Node.js + Express.js REST API (/api/v1)
│   ├── src/
│   │   ├── config/             # env.js, db.js
│   │   ├── controllers/        # auth, ticket, comment, admin, notification
│   │   ├── events/             # ticketEvents.js (EventEmitter domain bus)
│   │   ├── middlewares/        # auth.js, validate.js, errorHandler.js
│   │   ├── models/             # User, Ticket, Comment, ActivityLog, Notification
│   │   ├── routes/             # Express routers mounted at /api/v1/*
│   │   ├── services/           # emailService.js (Nodemailer)
│   │   ├── utils/              # AppError, asyncHandler, seedAdmin.js
│   │   ├── validators/         # Zod request validation schemas
│   │   ├── app.js              # Express app + static SPA serving
│   │   └── server.js           # Entry point
│   └── tests/                  # Automated Jest + Supertest suite
├── docs/
│   ├── API.md                  # REST API documentation
│   ├── DATABASE_DESIGN.md      # MongoDB schemas, ER diagram & indexing
│   └── postman_collection.json # Importable Postman collection
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## Local Setup & Development

### Prerequisites
- **Node.js** >= 18
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) URI)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your secrets:
```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | `development` or `production` | `development` |
| `PORT` | Backend server port | `5000` |
| `CLIENT_URL` | Frontend origin for CORS in dev | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/support_ticket_system` |
| `JWT_SECRET` | Secret key for signing JWTs | `your_strong_secret` |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `ADMIN_NAME` | Seed admin display name | `System Admin` |
| `ADMIN_EMAIL` | Seed admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Seed admin password | `Admin@123456` |
| `GOOGLE_USER` | Gmail address for sending notifications | `yourname@gmail.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret | `GOCSPX-...` |
| `GOOGLE_REFRESH_TOKEN` | Google OAuth2 Refresh Token | `1//04...` |
| `EMAIL_FROM` | *(Optional)* Sender address (defaults to `GOOGLE_USER`) | `yourname@gmail.com` |

### 3. Run in Development
Start backend and frontend in separate terminals:
```bash
npm run dev:server   # Starts Express on http://localhost:5000
npm run dev:client   # Starts Vite on http://localhost:5173 (proxies /api -> :5000)
```

### 4. Creating an Admin User
Public `/register` always creates a `user` account for security. To create or promote an admin:
- **Option A (Seed Script)**: Configure `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` and run:
  ```bash
  npm run seed:admin
  ```
- **Option B (Direct DB Update)**: Update the user document's `role` field from `"user"` to `"admin"` in MongoDB / Atlas.

### 5. Run Automated Tests
```bash
npm test
```

---

## Production Build & Live Deployment (Render)

Because the Express backend serves the built React frontend (`client/dist`) in production, you can deploy the **entire full-stack app as a single Web Service on Render**:

1. Push this repository to **GitHub**.
2. Create a free **MongoDB Atlas** cluster and copy the connection string (`MONGODB_URI`).
3. On **[Render](https://render.com/)**, create a **New Web Service** connected to your GitHub repo:
   - **Runtime**: `Node`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables in Render:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your-atlas-uri>`
   - `JWT_SECRET=<strong-random-secret>`
   - `JWT_EXPIRES_IN=7d`
   - *(Optional)* `GOOGLE_USER`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `EMAIL_FROM`
5. Deploy! Render will build the React app and serve both the UI and `/api/v1/*` from the same domain.

### Docker Deployment
```bash
docker compose up --build
```

---

## Implementation Decisions & Trade-Offs
- **MongoDB vs. PostgreSQL**: MongoDB with Mongoose was chosen for native JSON alignment with Express/React and flexible event metadata in `ActivityLog`, while maintaining relational integrity via `ObjectId` references and compound indexes.
- **Event-Driven Decoupling**: Using Node's `EventEmitter` (`ticketEvents`) decouples core HTTP controllers from side effects (activity logging, in-app notifications, emails), keeping controllers concise and making it easy to swap in Redis/BullMQ later.
- **Separate `Comment` & `ActivityLog` Collections**: Avoiding embedded arrays inside `Ticket` prevents MongoDB's 16MB document limit from ever becoming a bottleneck and enables independent pagination/querying.
- **Zod Validation**: Request payloads are validated at the route boundary via `validate(schema)` middleware before reaching controllers.

---

## Documentation
- [REST API Reference](docs/API.md)
- [Database Design & ER Diagram](docs/DATABASE_DESIGN.md)
- [Postman Collection](docs/postman_collection.json)
