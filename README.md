# RGK — RentGrandKids.org

A platform connecting student volunteers with elderly people who need help. Schools manage volunteer hours, and the platform handles identity verification, session tracking, and ratings.

## Architecture

```
blackcortex/          # FastAPI backend (Python 3.12+)
  app/
    api/v1/           # Route handlers
    auth/             # JWT validation, role/verification middleware
    models/           # Beanie ODM documents (MongoDB)
    schemas/          # Pydantic request/response DTOs
    services/         # Business logic layer
    middleware/       # Rate limiting
    utils/            # Custom HTTP exceptions
  tests/              # pytest-asyncio test suite
frontporch/           # React Native (Expo) frontend
infra/                # Docker Compose, local dev scripts
```

## Roles

| Role | Description |
|------|-------------|
| `root` | Platform super-admin. Auto-assigned via `RGK_ROOT_USERS` env var. |
| `school_admin` | Administers a school (1 per school). Manages staff and volunteers. |
| `school_user` | Teacher/staff who reviews and approves volunteer sessions. |
| `volunteer` | Student who accepts help requests and logs hours. |
| `needy` | Elderly person who creates help requests. |
| `needy_proxy` | Caregiver who acts on behalf of an elderly person. |

## Setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- MongoDB
- Redis

### Backend

```bash
cd blackcortex
pip install -e ".[dev]"
cp .env.example .env
# Edit .env with your Auth0 and MongoDB settings
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontporch
npm install
cp .env.local.example .env.local
# Edit .env.local with your Auth0 settings
npx expo start --web
```

### Running Tests

```bash
# Backend
cd blackcortex
pytest tests/ -v

# Frontend
cd frontporch
npx jest
```

## API Overview

### Auth
- `POST /api/v1/auth/register` — Register (auto-assigns root if email in `RGK_ROOT_USERS`)

### Users
- `GET /api/v1/users/me` — Current user profile
- `PUT /api/v1/users/me` — Update profile
- `GET /api/v1/users/me/ratings` — My ratings (volunteer)
- `GET /api/v1/users/{id}` — Get user by ID

### Schools
- `POST /api/v1/schools/` — Create school (root, school_admin)
- `GET /api/v1/schools/` — List schools
- `GET /api/v1/schools/{id}` — Get school
- `PUT /api/v1/schools/{id}` — Update school (school_admin)
- `GET /api/v1/schools/{id}/students` — List volunteers
- `GET /api/v1/schools/{id}/hours` — Aggregated hours
- `GET /api/v1/schools/{id}/dashboard` — School metrics
- `GET /api/v1/schools/{id}/ratings` — Volunteer ratings
- `POST /api/v1/schools/{id}/association-requests` — Request school association
- `GET /api/v1/schools/{id}/association-requests` — List association requests
- `PUT /api/v1/schools/{id}/association-requests/{req_id}` — Review association
- `DELETE /api/v1/schools/{id}/users/{user_id}` — Remove user from school

### Health
- `GET /health` — Basic liveness check
- `GET /health/ready` — Readiness probe (MongoDB + Redis)

### Requests
- `POST /api/v1/requests/` — Create help request (needy, needy_proxy)
- `GET /api/v1/requests/` — List requests
- `GET /api/v1/requests/{id}` — Get request by ID
- `PUT /api/v1/requests/{id}` — Update request
- `POST /api/v1/requests/{id}/accept` — Accept request (volunteer, verified)
- `PUT /api/v1/requests/{id}/unassign` — Unassign from request (volunteer)
- `PUT /api/v1/requests/{id}/status` — Update request status

### Sessions
- `POST /api/v1/sessions/` — Log session (volunteer)
- `GET /api/v1/sessions/` — List sessions
- `GET /api/v1/sessions/{id}` — Get session by ID
- `PUT /api/v1/sessions/{id}/elder-confirm` — Elder confirms session (needy, needy_proxy)
- `PUT /api/v1/sessions/{id}/approve` — Approve/reject session (school_admin, school_user)
- `POST /api/v1/sessions/{id}/rating` — Rate volunteer (needy, needy_proxy)

### Admin (root only)
- `POST/GET/PUT/DELETE /api/v1/admin/config[/{key}]` — App config CRUD
- `GET /api/v1/admin/analytics` — Platform metrics
- `GET /api/v1/admin/audit-log` — Audit trail
- `PUT /api/v1/admin/users/{id}/verify` — Update verification status
- `PUT /api/v1/admin/schools/{id}/assign-admin` — Assign school admin

### Proxy
- `POST /api/v1/proxy/link` — Request proxy link (needy_proxy)
- `GET /api/v1/proxy/links` — My proxy links
- `PUT /api/v1/proxy/link/{id}/confirm` — Approve link (root)
- `PUT /api/v1/proxy/link/{id}/reject` — Reject link (root)
- `PUT /api/v1/proxy/link/{id}/revoke` — Revoke link (root, needy)

### Internal (cron jobs, requires `INTERNAL_API_KEY`)
- `POST /api/v1/internal/jobs/expire-associations` — Expire stale association requests
- `POST /api/v1/internal/jobs/expire-sessions` — Expire unconfirmed sessions (7d)
- `POST /api/v1/internal/jobs/notify-stale-requests` — Flag stale open requests (14d)

## Key Workflows

### Session Approval Flow
```
Volunteer logs session → pending_elder_confirmation
  → Elder/Proxy confirms → pending_approval
    → School user/admin approves → approved (hours counted)
```

### Identity Verification (KYC)
Required for `volunteer`, `needy`, `needy_proxy`. Users email documents to root, who updates status via admin panel.

### School Association
School-affiliated users (admin, user, volunteer) request association with a school. School admin requests are approved by root; others by school admin.

### Proxy Link
`needy_proxy` requests a link to a `needy` user. Root approves after reviewing emailed proof of relation. The proxy then creates requests and confirms sessions on behalf of the elderly.

## Environment Variables

### Backend (`blackcortex/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/rgk` |
| `DATABASE_NAME` | MongoDB database name | `rgk` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `AUTH0_DOMAIN` | Auth0 domain | — |
| `AUTH0_AUDIENCE` | Auth0 API audience | — |
| `CORS_ORIGINS` | Allowed CORS origins (JSON array) | `["http://localhost:8081"]` |
| `RGK_ROOT_USERS` | Emails auto-assigned root role (JSON array) | `[]` |
| `INTERNAL_API_KEY` | Shared secret for cron job endpoints | `change-me-in-production` |
| `DEBUG` | Debug mode | `false` |

### Frontend (`frontporch/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `EXPO_PUBLIC_AUTH0_DOMAIN` | Auth0 tenant domain | — |
| `EXPO_PUBLIC_AUTH0_CLIENT_ID` | Auth0 SPA client ID | — |
| `EXPO_PUBLIC_AUTH0_AUDIENCE` | Auth0 API audience | — |
