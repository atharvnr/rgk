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
infra/                # Docker Compose (Mongo, Redis, API, Watchtower), nginx, droplet bootstrap
```

## Roles

| Role | Description |
|------|-------------|
| `root` | Platform super-admin. Assigned by the `RGK_ROOT_USERS` env var at registration and on any later login (Gmail dots and `+tags` are ignored). |
| `school_admin` | Administers a school (1 per school). Manages staff and volunteers. |
| `school_user` | Teacher/staff who reviews and approves volunteer sessions. |
| `volunteer` | Student who accepts help requests and logs hours. |
| `needy` | Elderly person who creates help requests. |
| `needy_proxy` | Caregiver who acts on behalf of an elderly person. |

## Admin access

### Configuring root emails

Root users are listed in `RGK_ROOT_USERS`, a JSON array of emails, e.g. `["you@gmail.com"]`.
A user whose email matches is made root when they register and on their next authenticated request.
Existing root users are never demoted by removing them from the list.

- **New droplet:** set the GitHub repo variable `RGK_ROOT_USERS`. The Droplet Bootstrap workflow writes it to `infra/.env`.
- **Running droplet:** edit `RGK_ROOT_USERS` in `infra/.env`, then apply it:

```bash
docker compose -f infra/docker-compose.yml up -d api
```

### Calling the admin API with curl

Sign in on the web app, then in the browser devtools console run:

```js
localStorage.getItem("rgk_access_token")
```

```bash
export TOKEN="<paste token>"
API=https://api.rentgrandkids.org/api/v1
AUTH="Authorization: Bearer $TOKEN"

# Search users
curl -H "$AUTH" "$API/admin/users?q=alice&role=volunteer&limit=20"

# Change a user's role
curl -X PUT -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"role": "school_admin", "school_id": "<school_id>"}' "$API/admin/users/<user_id>"

# Delete a user
curl -X DELETE -H "$AUTH" "$API/admin/users/<user_id>"

# Create a school
curl -X POST -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"name":"Lincoln High","address":"1 Main St","city":"Springfield","state":"IL","zip_code":"62701","contact_email":"office@lincoln.org"}' \
  "$API/admin/schools"

# List schools (add include_inactive=true to see soft-deleted ones)
curl -H "$AUTH" "$API/admin/schools?include_inactive=true"
```

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

### Public
- `GET /api/v1/public/stats` — Public impact stats (no auth, cached 5 min)

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
- `GET /api/v1/admin/users` — List/search users (`q`, `role`, `verification_status`, `is_active`, `school_id`, `skip`, `limit`)
- `GET/PUT/DELETE /api/v1/admin/users/{id}` — Get, update (role, school, status, profile) or hard-delete a user
- `GET/POST /api/v1/admin/schools` — List schools (`include_inactive`, `q`) / create a school
- `PUT/DELETE /api/v1/admin/schools/{id}` — Update a school (incl. `is_active`) / soft-delete it

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

## Demo data

Seed a realistic demo world (one school, volunteers, elders, requests, sessions, ratings):

```bash
cd blackcortex
python -m app.seed.demo
```

All demo users have an `auth0_id` starting with `demo|` and a `@demo.rentgrandkids.org` email; the school is "Lincoln High School". Running it again is a no-op while the demo school exists. `--reset` deletes the previous demo data (and everything pointing at it) before seeding.

To land a real Auth0 login in a populated account, bind it with `--admin`, `--volunteer` and/or `--elder` (each `auth0_id:email`); the school admin, the most active volunteer and the most active elder then use that identity:

```bash
python -m app.seed.demo --reset --volunteer "google-oauth2|1234:me@example.com"
```

In Docker:

```bash
docker compose -f infra/docker-compose.yml exec api python -m app.seed.demo --reset
```

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

## Deployment

Production is a single DigitalOcean droplet (`s-1vcpu-2gb`, SFO3) behind Cloudflare.

- `infra/docker-compose.yml` runs MongoDB, Redis, the API image from GHCR and Watchtower.
- `infra/init.sh` bootstraps a fresh droplet (swap, Docker, nginx, origin cert, compose stack, nightly Mongo backup). It is run by the **Droplet Bootstrap** workflow against `vars.DROPLET_IP`.
- Pushes to `main` touching `blackcortex/` build and push the API image, then rewrite the droplet's `infra/.env` from the repo variables (`RGK_ROOT_USERS`, `CORS_ORIGINS`, Auth0 settings) and restart the API on the new image. Watchtower remains as a fallback.
- Pushes to `main` touching `frontporch/` export the web build and rsync it to `/var/www/rgk`.
- Both deploy workflows can also be run by hand from the Actions tab.

See `infra/MIGRATION.md` for moving the droplet to a new region or size.
