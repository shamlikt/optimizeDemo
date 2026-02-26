# OptimizeFlow

A multi-tenant SaaS platform for ophthalmology practices to measure and optimize rooming technician productivity using a **Visit Points** system.

Built on the Duke Ophthalmology methodology (ASOA 2019), OptimizeFlow assigns point values to each appointment type, enabling clinics to track tech performance, compare productivity across locations, and plan staffing for upcoming weeks.

## Key Features

- **CSV/Excel Upload** — Bulk import appointment data (retrospective + prospective), with automatic deduplication and validation. Processes 60K rows in under 10 seconds.
- **Visit Points Engine** — 49 pre-seeded appointment types mapped to point values. Automatic lookup and calculation on import.
- **5 Report Dashboards** — Tech Points by Location, Monthly Points by Tech, Scheduled Points by Provider, Points Paid Tech FTE, Weekly Scheduled Points.
- **Overview Dashboard** — 10-day tech points trend chart, location summary table with YTD stats.
- **Manual Data Entry** — Single-appointment form with auto-populated dropdowns.
- **Role-Based Access** — Admins manage everything; Managers get read-only, location-scoped views.
- **Multi-Tenancy** — Strict organization isolation across all queries.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Query, Recharts |
| Backend | Python, FastAPI, SQLAlchemy (async), Pydantic v2 |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Deployment | Docker Compose, Caddy (TLS), GitHub Actions CI/CD |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose v2+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/shamlikt/optimizeDemo.git
cd optimizeDemo
```

### 2. Start development stack

```bash
docker compose up --build
```

This starts PostgreSQL, the FastAPI backend (with hot-reload), and the React frontend behind Nginx.

### 3. Open the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8001/api/v1 |
| Swagger Docs | http://localhost:8001/docs |
| Database | localhost:5433 |

### 4. Login with demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@optimizeflow.com` | `admin123` |
| Manager | `manager@optimizeflow.com` | `manager123` |

Demo data (organization, 12 locations, 49 appointment types) is auto-seeded on first startup.

---

## Project Structure

```
optimizeFlow/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Environment settings
│   │   ├── database.py          # Async SQLAlchemy setup
│   │   ├── seed.py              # Demo data seeder
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── api/                 # Route handlers
│   │   │   ├── auth.py          # Login, logout, /me
│   │   │   ├── users.py         # User CRUD (admin)
│   │   │   ├── locations.py     # Location management
│   │   │   ├── appointments.py  # Appointments + batch create
│   │   │   ├── uploads.py       # CSV upload processing
│   │   │   ├── dashboard.py     # Overview metrics
│   │   │   └── reports.py       # 5 report endpoints
│   │   └── services/            # Business logic
│   ├── alembic/                 # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Route definitions
│   │   ├── contexts/AuthContext.tsx
│   │   ├── pages/               # Page components
│   │   ├── components/          # UI + feature components
│   │   ├── services/api.ts      # Axios API client
│   │   └── types/               # TypeScript interfaces
│   ├── nginx.conf               # SPA routing + API proxy
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml           # Development stack
├── docker-compose.prod.yml      # Production stack (+ Caddy TLS)
├── Caddyfile                    # Caddy reverse proxy config
├── .env                         # Dev environment variables
├── .env.production.example      # Production env template
├── test_data/                   # Sample CSV files for testing
├── scripts/server-setup.sh      # Production server bootstrap
└── .github/workflows/deploy.yml # CI/CD pipeline
```

---

## Architecture

### Development

```
Browser → [Nginx :3000] → serves React SPA
                        → proxies /api/ → [FastAPI :8001] → [PostgreSQL :5433]
```

### Production

```
Internet → [Caddy :80/:443] → [Nginx :80] → serves React SPA
              TLS termination              → proxies /api/ → [FastAPI :8000] → [PostgreSQL :5432]
```

Caddy handles automatic Let's Encrypt certificate provisioning and HTTP-to-HTTPS redirection.

---

## API Overview

Base URL: `/api/v1`

| Group | Endpoints | Auth |
|-------|-----------|------|
| **Auth** | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | Public / Bearer |
| **Users** | `GET/POST /users/`, `PUT/DELETE /users/{id}`, `PUT /users/{id}/locations` | Admin |
| **Locations** | `GET/POST /locations/`, `PUT/DELETE /locations/{id}` | Admin |
| **Appointment Types** | `GET/POST /appointment-types/`, `PUT /appointment-types/{id}` | Admin |
| **Appointments** | `GET/POST /appointments/`, `PUT/DELETE /appointments/{id}` | Admin |
| **Uploads** | `POST /uploads/{type}`, `GET /uploads/` | Admin |
| **Dashboard** | `GET /dashboard/overview`, `GET /dashboard/location-table` | Authenticated |
| **Reports** | `GET /reports/tech-points-by-location`, + 4 more | Authenticated |
| **Health** | `GET /health` | Public |

Full interactive documentation available at `/docs` (Swagger UI) or `/redoc`.

---

## Environment Variables

### Development (`.env`)

```env
DATABASE_URL=postgresql+asyncpg://optimizeflow:optimizeflow@db:5432/optimizeflow
POSTGRES_USER=optimizeflow
POSTGRES_PASSWORD=optimizeflow
POSTGRES_DB=optimizeflow
SECRET_KEY=optimizeflow-secret-key-change-in-production-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://frontend:80"]
```

### Production (`.env.production`)

Copy `.env.production.example` and set strong values:

```bash
cp .env.production.example .env.production
# Edit: POSTGRES_PASSWORD, SECRET_KEY (openssl rand -hex 32), CORS_ORIGINS
```

---

## Database

### Migrations

```bash
# Apply all migrations
alembic upgrade head

# Create a new migration
alembic revision -m "Add new column"

# Rollback one step
alembic downgrade -1
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant isolation |
| `users` | Staff accounts with roles |
| `locations` | Clinic branches |
| `user_locations` | User-to-location assignments (M2M) |
| `appointment_types` | Visit type to point value mapping |
| `appointments` | Individual appointment records |
| `uploads` | CSV/Excel upload metadata |

---

## Production Deployment

### Server Setup

```bash
# Bootstrap a fresh Ubuntu server
sudo bash scripts/server-setup.sh
```

This installs Docker, Docker Compose, creates the `optimize` user, and configures UFW firewall (ports 80, 443, 22).

### Environment Configuration

```bash
# On server
cp .env.production.example .env.production
nano .env.production
# Set POSTGRES_PASSWORD, SECRET_KEY, CORS_ORIGINS
```

### Deploy

Pushing to `main` triggers automatic deployment via GitHub Actions.

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `SSH_HOST` | Server IP address |
| `SSH_USER` | SSH username (e.g., `optimize`) |
| `SSH_PRIVATE_KEY` | SSH private key |

### Manual Deploy

```bash
ssh optimize@your-server
cd /home/optimize/optimizeFlow
docker compose -f docker-compose.prod.yml down --remove-orphans
docker compose -f docker-compose.prod.yml up --build -d
```

### HTTPS

Production uses Caddy for automatic TLS with Let's Encrypt. The domain (`optimizeflow.duckdns.org`) is configured in the `Caddyfile`. Certificates are auto-provisioned and renewed.

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL=postgresql+asyncpg://optimizeflow:optimizeflow@localhost:5433/optimizeflow
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173 with proxy to backend
```

---

## User Roles

| Role | Permissions |
|------|------------|
| `clinic_admin` | Full access: upload CSV, manage users/locations/appointment types, view all reports |
| `clinic_manager` | Read-only: view dashboard and reports for assigned locations |

---

## License

Proprietary. All rights reserved.
