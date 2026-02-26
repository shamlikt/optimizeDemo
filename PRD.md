# OptimizeFlow — Product Requirements Document

> Version: 1.0 (MVP)
> Last Updated: 2026-02-24
> Status: Approved
> Owner: Gauri Joshi
> Authors: AI Project Manager + Stakeholder
> Target Delivery: February 25, 2026

---

## 1. Executive Summary

OptimizeFlow is a multi-tenant SaaS platform that enables ophthalmology practices to measure and optimize the productivity of their Rooming Technicians (the clinical staff who work up patients before they see the provider).

The platform implements a "Visit Points" system inspired by the Duke Ophthalmology methodology (ASOA 2019). Each appointment type is assigned a point value reflecting its workload complexity. By tracking these points per technician, per location, per session (AM/PM), clinic managers can:

1. **Retrospectively** assess tech performance, identify imbalances, and manage accountability
2. **Prospectively** plan staffing needs by projecting points for upcoming weeks
3. **Compare** productivity across locations, specialties, and time periods

The MVP delivers CSV/Excel upload, automatic point calculation, 5 interactive report dashboards, a main overview dashboard, manual data entry, and role-based access — all within a pixel-perfect UI matching the provided mockup designs.

---

## 2. Problem Statement

**Who has this problem?**
Ophthalmology practice administrators and clinic managers overseeing multiple locations with teams of rooming technicians.

**What is the problem?**
- There is no standardized way to measure technician workload across appointment types
- High-performing techs burn out while low-performers go unnoticed
- Staffing decisions for upcoming weeks are based on gut feel, not data
- Practice administrators cannot compare productivity across locations
- Manual tracking via spreadsheets is error-prone and time-consuming

**Why do existing solutions fall short?**
- EMR systems track appointments but don't calculate productivity points
- Spreadsheet-based tracking (the current state) doesn't scale, lacks visualization, and has no role-based access
- No SaaS product currently digitizes the ASOA "technician points system"

---

## 3. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Data ingestion | Time to process 60K-row CSV | < 10 seconds |
| Dashboard performance | Report page load time | < 2 seconds |
| User adoption | Successful CSV uploads in first week | > 5 |
| Data accuracy | Point calculation correctness | 100% match to mapping |
| Usability | Admin can upload CSV without training | First-time success |

---

## 4. Target Users & Personas

### Persona 1: Sarah — Clinic Admin
- **Role:** Practice Administrator at a 10-location ophthalmology system
- **Pain Points:** Can't compare technician productivity across locations; spends hours in Excel
- **Goals:** Upload weekly data, see instant dashboards, make staffing decisions quickly
- **Technical Proficiency:** Moderate — comfortable with Excel, basic web apps
- **Key Actions:** Upload CSV, view all reports, manage point mappings, manage user access

### Persona 2: Mike — Clinic Manager
- **Role:** Clinical Operations Manager overseeing 3 locations
- **Pain Points:** Doesn't know which techs are underperforming until complaints arise
- **Goals:** Monitor tech points daily, plan weekly staffing, identify training needs
- **Technical Proficiency:** Low to moderate — uses web apps but not technical
- **Key Actions:** View reports filtered to their locations, review prospective staffing data

---

## 5. Scope

### 5.1 In Scope (MVP — Ship Feb 25)

1. **Authentication & Authorization** — JWT login, Clinic Admin & Clinic Manager roles
2. **Multi-tenancy** — Organization-scoped data isolation
3. **CSV/Excel Upload** — Retrospective and Prospective appointment data
4. **Data Validation** — Schema validation, required columns, date/time format checks
5. **Visit Points Calculation** — Auto-compute from Visit Type → Point mapping
6. **Duplicate Detection** — Within-file duplicate marking (excluded from reporting)
7. **Dataset Versioning** — New upload replaces previous version, history retained
8. **Main Dashboard** — Tech Points overview, location table, summary statistics
9. **5 Report Dashboards:**
   - Report 1: Tech Points by Location (daily bar chart, AM/PM, target line)
   - Report 2: Tech Points by Monthly Tech Point by Location (multi-tech, multi-location)
   - Report 3: Scheduled Points by Provider (horizontal bars, AM/PM, by clinic manager)
   - Report 4: Points Paid Tech FTE (month-over-month comparison by specialty/location)
   - Report 5: Weekly Scheduled Points by Location (prospective, day grid, AM/PM/Total)
10. **Location Sidebar** — Search and select locations to filter reports
11. **Manual Data Entry** — Form to enter individual appointment records
12. **Point Mapping Seeding** — Pre-load 49 ophthalmology visit types with point values

### 5.2 In Scope (Post-MVP)

- Announcements feature
- Employee management page
- Audit logging with detailed event tracking
- Point mapping admin UI (CRUD)
- Cross-version duplicate detection
- API integrations (EMR systems)
- Export reports to PDF/Excel
- Email notifications
- Advanced analytics / predictive modeling

### 5.3 Explicitly Out of Scope

- Predictive modeling / forecasting algorithms
- EMR/EHR API integrations
- Mobile app
- Real-time collaboration
- Billing/subscription management
- HIPAA compliance certification (MVP is for internal use / demo)

---

## 6. Feature Requirements

### 6.1 Feature: Authentication & Authorization

- **Priority:** Must Have
- **User Story:** As a user, I want to log in securely so that I can access my organization's data.
- **Acceptance Criteria:**
  - [ ] Login with email and password
  - [ ] JWT token issued on successful login
  - [ ] Token expires after 30 minutes (configurable)
  - [ ] Two roles: Clinic Admin (full access) and Clinic Manager (view-only, location-scoped)
  - [ ] Clinic Admin can create/manage users within their organization
  - [ ] All API endpoints require valid JWT
  - [ ] Organization isolation — users cannot access other orgs' data

### 6.2 Feature: CSV/Excel Upload (Retrospective)

- **Priority:** Must Have
- **User Story:** As a Clinic Admin, I want to upload historical appointment data so that I can see retrospective tech productivity reports.
- **Acceptance Criteria:**
  - [ ] Upload .xlsx or .csv file
  - [ ] Validate required columns: Location, Rooming Tech, Provider, Specialty, Appt Date, Appt Time, Session, Visit Type
  - [ ] Optional columns: Department, Patient Encounter Number, Day of Week, Week of Month, Check In/Out times, Visit Duration, Tech Level, Rooming Time, Tech In/Out, Visit Points, Primary Diagnosis, Appt Comments
  - [ ] If Visit Points column is present and populated, use those values
  - [ ] If Visit Points column is missing or empty, auto-calculate from Visit Type → Point mapping
  - [ ] Detect within-file duplicates (by Provider + Location + Appt Date + Appt Time + Visit Type + Rooming Tech)
  - [ ] Mark duplicates as excluded from reporting
  - [ ] Create new dataset version, mark previous as inactive
  - [ ] Show upload progress and validation results
  - [ ] Process 15,000 rows in < 10 seconds

### 6.3 Feature: CSV/Excel Upload (Prospective)

- **Priority:** Must Have
- **User Story:** As a Clinic Admin, I want to upload upcoming appointment schedules so that I can plan staffing based on projected points.
- **Acceptance Criteria:**
  - [ ] Upload .xlsx or .csv file
  - [ ] Validate required columns: Location, Provider, Specialty, Appt Date, Appt Time, Visit Type
  - [ ] Optional columns: Department/Organization, Patient Encounter Number, Day of Week, Week of Month, Appt Comments
  - [ ] Auto-calculate Visit Points from Visit Type → Point mapping
  - [ ] Detect within-file duplicates (by Provider + Location + Appt Date + Appt Time + Visit Type)
  - [ ] Create new dataset version
  - [ ] Process 60,000 rows in < 10 seconds

### 6.4 Feature: Visit Points Calculation

- **Priority:** Must Have
- **User Story:** As a system, I want to automatically calculate Visit Points for each appointment so that dashboards show accurate productivity data.
- **Acceptance Criteria:**
  - [ ] Pre-seeded mapping of 49 visit types to point values (from VisitType_and_PointMapping.csv)
  - [ ] Point value = 1 point per 15-minute work interval (base unit)
  - [ ] Lookup visit type → point value on upload
  - [ ] If visit type not found in mapping, flag for review and assign 0 points
  - [ ] If CSV already has Visit Points populated, prefer those values
  - [ ] Target per session: 12 points per half-day (4-hour session)

### 6.5 Feature: Main Dashboard

- **Priority:** Must Have
- **User Story:** As a user, I want to see an overview of my organization's tech productivity when I log in.
- **Acceptance Criteria:**
  - [ ] Greeting with user name and current date
  - [ ] Tech Points Overview widget: multi-location line chart (configurable locations, default 10 days)
  - [ ] Summary statistics: Total Locations, Total Employees, Total Managers
  - [ ] Organization Locations table: Address, Location Name, Abbreviation, Manager, # Employees, YTD Paid FTEs, YTD Points, Activity sparkline, Actions
  - [ ] Search locations in table
  - [ ] Organization Growth % widget with trend sparkline
  - [ ] Quick-action cards: "+ Announcement" and "+ Daily data"
  - [ ] Navigation: Dashboard, Reports, Locations, Employees, Announcements

### 6.6 Feature: Report 1 — Tech Points by Location

- **Priority:** Must Have
- **User Story:** As a Clinic Manager, I want to see daily tech points for each tech at a selected location to monitor individual performance.
- **Acceptance Criteria:**
  - [ ] Select report from dropdown: "Tech Points by Location"
  - [ ] Select Month filter
  - [ ] Left sidebar: searchable location list with "Selected location" highlight
  - [ ] For each Rooming Tech at that location:
    - Tech name, Tech type, Location name
    - Percentage change indicator (↑ or ↓)
    - Bar chart: one bar per day, split into Morning (dark) and Afternoon (light)
    - X-axis: dates in the selected month, Y-axis: Visit Points
    - Today's date highlighted
    - Target line (configurable, default 10)
    - Time range selector: "One week" / "Four weeks"
  - [ ] Clinic Manager name and avatar shown
  - [ ] Chart tooltip showing exact AM/PM values on hover

### 6.7 Feature: Report 2 — Tech Points by Monthly Tech Point by Location

- **Priority:** Must Have
- **User Story:** As an Admin, I want to see tech points over time across multiple techs at a location to compare performance trends.
- **Acceptance Criteria:**
  - [ ] Title: "Organization Reports"
  - [ ] Select report: "Tech Points by Monthly Tech Point by Location"
  - [ ] Select Month filter
  - [ ] Same location sidebar
  - [ ] For each Rooming Tech:
    - Tech name, type, location, percentage change
    - Combined bar + line chart across the full month
    - Bars: Morning (teal/dark) and Afternoon (teal/light)
    - Target line (red, configurable, default 10)
    - X-axis: all dates in month, Y-axis: Visit Points
  - [ ] Time range: "Four weeks" view
  - [ ] Tooltip with date, AM points, PM points

### 6.8 Feature: Report 3 — Scheduled Points by Provider

- **Priority:** Must Have
- **User Story:** As a Clinic Manager, I want to see total scheduled points grouped by provider to understand provider workload distribution.
- **Acceptance Criteria:**
  - [ ] Select report: "Scheduled Points by Provider (5.1 - 5.5)" (section reference)
  - [ ] Select Month filter
  - [ ] Location sidebar
  - [ ] Title: "Scheduled Points by Provider"
  - [ ] Morning / Afternoon legend
  - [ ] Search providers
  - [ ] Grouped by Clinic Manager (with avatar)
  - [ ] For each Provider under each Manager:
    - Horizontal bar: Morning (dark blue) + Afternoon (light blue)
    - X-axis: Visit Points (0-140+)
  - [ ] Tooltip: Provider name, AM points, PM points
  - [ ] Built from prospective data

### 6.9 Feature: Report 4 — Points Paid Tech FTE (Month Comparison)

- **Priority:** Must Have
- **User Story:** As an Admin, I want to compare total points across specialties/locations between two months to identify trends.
- **Acceptance Criteria:**
  - [ ] Select report: "Points Paid Tech FTE"
  - [ ] Two month selectors for comparison (e.g., February vs March)
  - [ ] Title: "Points Paid Tech FTE"
  - [ ] Horizontal grouped bars per specialty/location
  - [ ] Two bars per row: Month 1 (dark purple/blue) and Month 2 (teal/cyan)
  - [ ] Legend: Month 1 name, Month 2 name
  - [ ] X-axis: Visit Points (0-700+)
  - [ ] Tooltip: Location name, Month 1 total, Month 2 total
  - [ ] Built from retrospective data

### 6.10 Feature: Report 5 — Weekly Scheduled Points by Location (Prospective)

- **Priority:** Must Have
- **User Story:** As a Clinic Manager, I want to see projected points for the upcoming week by location to plan technician staffing.
- **Acceptance Criteria:**
  - [ ] Select report: "Weekly Points by day by Location"
  - [ ] Select Month filter
  - [ ] Week selector (Week 1-5)
  - [ ] Search filter
  - [ ] Title: "Scheduled Points by day by Location"
  - [ ] Grid layout: Department/HCA rows × Day columns (Mon-Fri)
  - [ ] Each cell: horizontal stacked bar with Morning (dark) + Afternoon (light)
  - [ ] Legend: Morning, Afternoon, Total (green)
  - [ ] Hover on cell: shows Morning, Afternoon, Total values
  - [ ] X-axis per column: Visit Points (0-200+)
  - [ ] Y-axis: Department/Location names
  - [ ] Built from prospective data

### 6.11 Feature: Manual Data Entry

- **Priority:** Must Have
- **User Story:** As a Clinic Admin, I want to manually enter individual appointment records for daily data updates.
- **Acceptance Criteria:**
  - [ ] Data Entry page with sidebar: New Data, Drafts, Previous data
  - [ ] Title: "Daily data"
  - [ ] "Upload file" button (links to CSV upload)
  - [ ] Editable table with columns:
    - Location (dropdown)
    - Encounter # (text)
    - Appointment Type/Abbreviation (dropdown)
    - Day of Appointment (date picker)
    - Time of Appointment (time picker)
    - Provider (dropdown/autocomplete)
    - Staff Member (Who Worked Up Patient) — i.e., Rooming Tech (dropdown)
    - Staff Member (Who Checked In Patient) (dropdown)
  - [ ] Add row button (+)
  - [ ] Save as draft / Save actions
  - [ ] Cancel button
  - [ ] Visit Points auto-calculated on save based on Appointment Type

### 6.12 Feature: Location Sidebar (Global)

- **Priority:** Must Have
- **User Story:** As a user, I want to quickly select a location to filter all reports.
- **Acceptance Criteria:**
  - [ ] Present on all Report pages
  - [ ] Searchable location list
  - [ ] Selected location highlighted in indigo/purple
  - [ ] "20+ Show More" expandable list
  - [ ] Location hierarchy: Head Quarter Name → individual locations

---

## 7. Technical Architecture

### 7.1 System Overview

```
┌─────────────────────────────────────────────────┐
│              Nginx (reverse proxy)              │
├────────────────────┬────────────────────────────┤
│   React SPA        │      FastAPI Backend       │
│   (Static files)   │      (API + CSV processing)│
│   Port 80          │      Port 8000             │
├────────────────────┴────────────────────────────┤
│              PostgreSQL 16                       │
│              Port 5432                           │
└─────────────────────────────────────────────────┘
```

### 7.2 Design Patterns

- **Frontend:** Component-based architecture with container/presentation pattern
- **Backend:** Layered architecture (Routes → Services → Repositories)
- **Database:** Repository pattern via SQLAlchemy ORM
- **Multi-tenancy:** Row-level security via organization_id
- **State Management:** Server-state via React Query, minimal client-state via React Context

### 7.3 Data Flow

**CSV Upload Flow:**
1. Frontend: User selects file → sends to `/api/v1/uploads/retrospective` or `/api/v1/uploads/prospective`
2. Backend: FastAPI receives file → Pandas reads Excel/CSV
3. Backend: Validates schema (required columns) → Validates rows (dates, non-null)
4. Backend: Matches Visit Type → Point mapping, calculates points
5. Backend: Detects within-file duplicates → Marks as excluded
6. Backend: Creates Upload record (new version) → Bulk inserts Appointments
7. Backend: Marks previous upload version as inactive
8. Frontend: Shows success/error summary

**Report Query Flow:**
1. Frontend: User selects report type + filters (location, month, etc.)
2. Frontend: React Query fetches from `/api/v1/reports/{report_type}`
3. Backend: Queries appointments WHERE organization_id = X AND filters
4. Backend: Aggregates (GROUP BY tech/location/day, SUM points, split AM/PM)
5. Backend: Returns JSON response
6. Frontend: Recharts renders the visualization

---

## 8. Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Frontend Framework | React + TypeScript | 18.3+ | Largest ecosystem, team familiarity |
| Build Tool | Vite | 6.x | Fast HMR, optimized builds |
| Styling | Tailwind CSS | 4.x | Pixel-perfect control, utility-first |
| Charts | Recharts | 2.15+ | Native React, all needed chart types |
| HTTP Client | Axios | 1.7+ | JWT interceptors |
| Server State | TanStack React Query | 5.x | Caching, refetching, optimistic updates |
| Routing | React Router | 6.x | Nested layouts for dashboard |
| Icons | Lucide React | Latest | Clean aesthetic matching mockups |
| File Upload | react-dropzone | 14.x | Drag-and-drop UX |
| Date Utils | date-fns | 4.x | Lightweight date formatting |
| Backend Framework | FastAPI | 0.115+ | Async, auto-docs, Pydantic validation |
| ORM | SQLAlchemy | 2.0+ (async) | Mature, async support, migrations |
| DB Driver | asyncpg | 0.30+ | Fast async PostgreSQL driver |
| CSV/Excel | Pandas + openpyxl | Latest | Robust file parsing, 60K+ rows |
| Auth | python-jose + passlib | Latest | JWT + bcrypt password hashing |
| Validation | Pydantic v2 | 2.x | Request/response schemas |
| Migrations | Alembic | 1.14+ | Database schema versioning |
| Server | Uvicorn | Latest | ASGI server for FastAPI |
| Database | PostgreSQL | 16.x | Analytics, JSONB, multi-tenant |
| Deployment | Docker Compose | Latest | Frontend + Backend + DB in one command |

---

## 9. Data Model

### 9.1 Entity Relationship Overview

```
Organization (tenant)
├── User (Clinic Admin or Clinic Manager)
├── Location
│   └── ClinicManagerAssignment (which manager oversees which location)
├── AppointmentType (Visit Type → Point mapping)
├── Upload (CSV upload session, versioned)
│   └── Appointment (individual row from CSV)
│       ├── Location (FK)
│       ├── Provider
│       ├── Rooming Tech
│       ├── Visit Type → AppointmentType (FK)
│       └── Visit Points (calculated or imported)
└── ManualEntry (daily data entry, same as Appointment but entered via form)
```

### 9.2 Key Entities

#### organizations
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) NOT NULL, -- 'clinic_admin', 'clinic_manager'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, email)
);
```

#### locations
```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    manager_name VARCHAR(255),
    num_employees INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_locations (manager → location assignment)
```sql
CREATE TABLE user_locations (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, location_id)
);
```

#### appointment_types (Visit Type → Point mapping)
```sql
CREATE TABLE appointment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    point_value NUMERIC(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);
```

#### uploads (CSV upload sessions, versioned)
```sql
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    uploaded_by UUID REFERENCES users(id) NOT NULL,
    upload_type VARCHAR(20) NOT NULL, -- 'retrospective', 'prospective'
    filename VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64),
    version_number INTEGER NOT NULL DEFAULT 1,
    row_count INTEGER DEFAULT 0,
    valid_row_count INTEGER DEFAULT 0,
    duplicate_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    error_message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### appointments (individual rows from CSV or manual entry)
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    data_type VARCHAR(20) NOT NULL, -- 'retrospective', 'prospective'

    -- Core fields (both types)
    department VARCHAR(255),
    location_id UUID REFERENCES locations(id),
    location_name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    patient_encounter_number VARCHAR(100),
    appointment_date DATE NOT NULL,
    day_of_week VARCHAR(20),
    week_of_month INTEGER,
    appointment_time TIME NOT NULL,
    session VARCHAR(5), -- 'AM', 'PM'
    visit_type VARCHAR(255) NOT NULL,
    visit_points NUMERIC(5,2) DEFAULT 0,
    appointment_type_id UUID REFERENCES appointment_types(id),
    appt_comments TEXT,

    -- Retrospective-only fields
    rooming_tech VARCHAR(255),
    check_in_time TIME,
    check_in_comment TEXT,
    check_out_time TIME,
    check_out_comment TEXT,
    visit_duration_min NUMERIC(10,2),
    total_wait_duration NUMERIC(10,2),
    tech_level VARCHAR(50),
    rooming_time TIME,
    rooming_comment TEXT,
    tech_in TIME,
    tech_out TIME,
    tech_duration NUMERIC(10,2),
    tech_comment TEXT,
    check_in_to_tech NUMERIC(10,2),
    appt_time_to_tech NUMERIC(10,2),
    pt_check_time NUMERIC(10,2),
    primary_diagnosis TEXT,

    -- Duplicate tracking
    is_duplicate BOOLEAN DEFAULT FALSE,
    is_excluded_from_reporting BOOLEAN DEFAULT FALSE,
    exclusion_reason VARCHAR(50),

    -- Source tracking
    source VARCHAR(20) DEFAULT 'csv', -- 'csv', 'manual'
    row_number INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_appointments_org_date ON appointments(organization_id, appointment_date);
CREATE INDEX idx_appointments_org_location ON appointments(organization_id, location_name);
CREATE INDEX idx_appointments_org_type ON appointments(organization_id, data_type);
CREATE INDEX idx_appointments_reporting ON appointments(organization_id, is_excluded_from_reporting, data_type);
CREATE INDEX idx_appointments_upload ON appointments(upload_id);
```

### 9.3 Data Storage Strategy

- **Structured data:** PostgreSQL for all appointment data, user data, configuration
- **File storage:** Uploaded CSV/Excel files stored on local filesystem (Docker volume), referenced by upload record
- **Raw data preservation:** All original CSV columns stored in the appointments table; unmapped columns in JSONB if needed
- **Multi-tenancy:** `organization_id` on every table, enforced at the service layer

---

## 10. API Design

### 10.1 API Style
REST API with JSON request/response bodies. All endpoints prefixed with `/api/v1/`.

### 10.2 Key Endpoints

#### Authentication
```
POST   /api/v1/auth/login           # Login → JWT token
POST   /api/v1/auth/logout          # Logout (client-side token removal)
GET    /api/v1/auth/me              # Get current user + organization
```

#### Users (Clinic Admin only)
```
GET    /api/v1/users                # List org users
POST   /api/v1/users                # Create user
PUT    /api/v1/users/{id}           # Update user
DELETE /api/v1/users/{id}           # Deactivate user
```

#### Locations
```
GET    /api/v1/locations            # List org locations
POST   /api/v1/locations            # Create location (auto-created from CSV too)
PUT    /api/v1/locations/{id}       # Update location
```

#### Appointment Types (Point Mapping)
```
GET    /api/v1/appointment-types     # List org appointment types + point values
POST   /api/v1/appointment-types     # Create (admin)
PUT    /api/v1/appointment-types/{id} # Update point value (admin)
```

#### Uploads
```
POST   /api/v1/uploads/retrospective  # Upload retrospective CSV/Excel
POST   /api/v1/uploads/prospective    # Upload prospective CSV/Excel
GET    /api/v1/uploads                # List upload history
GET    /api/v1/uploads/{id}           # Get upload details + validation results
```

#### Appointments (Manual Entry)
```
POST   /api/v1/appointments           # Create manual appointment entry
GET    /api/v1/appointments           # List appointments (with filters)
PUT    /api/v1/appointments/{id}      # Update appointment
DELETE /api/v1/appointments/{id}      # Delete manual entry
POST   /api/v1/appointments/draft     # Save as draft
GET    /api/v1/appointments/drafts    # List drafts
```

#### Reports
```
GET    /api/v1/reports/tech-points-by-location
       ?location_id=X&month=2025-08&period=one_week|four_weeks

GET    /api/v1/reports/monthly-tech-points-by-location
       ?location_id=X&month=2025-08

GET    /api/v1/reports/scheduled-points-by-provider
       ?location_id=X&month=2025-08

GET    /api/v1/reports/points-paid-tech-fte
       ?month1=2025-02&month2=2025-03

GET    /api/v1/reports/weekly-points-by-location
       ?month=2025-08&week=2
```

#### Dashboard
```
GET    /api/v1/dashboard/overview
       ?locations=X,Y,Z&days=10

GET    /api/v1/dashboard/location-table
       ?search=keyword
```

### 10.3 Authentication & Rate Limiting

- JWT Bearer token in Authorization header
- Token expiry: 24 hours (extended for MVP usability)
- Organization ID extracted from JWT claims
- Rate limiting: Not implemented for MVP (post-MVP)

---

## 11. Third-Party Integrations

| Service | Purpose | Pricing Model |
|---------|---------|--------------|
| None (MVP) | — | — |

The MVP has no third-party integrations. All data comes via CSV upload or manual entry.

---

## 12. Security & Compliance

### 12.1 Authentication Method
- JWT tokens with HS256 signing
- Passwords hashed with bcrypt (12 rounds)
- Login returns access token

### 12.2 Authorization Model
- Role-based: `clinic_admin` (full access within org) and `clinic_manager` (view reports, location-scoped)
- Organization isolation: every query filtered by organization_id from JWT
- Clinic Manager can only see locations assigned to them via user_locations

### 12.3 Data Protection
- Passwords never stored in plaintext
- JWT secret key in environment variable
- Database credentials in environment variables
- CORS restricted to frontend origin

### 12.4 Compliance Requirements
- MVP is for demo/internal use — HIPAA compliance deferred to post-MVP
- No PHI (Protected Health Information) stored — patient encounter numbers are synthetic/anonymized
- Recommend adding BAA and encryption at rest for production

---

## 13. Testing Strategy

| Type | Tool | Coverage Target |
|------|------|----------------|
| Manual Testing | Browser | All 5 reports + upload + dashboard |

Testing is manual for MVP due to timeline. Post-MVP will add:
- Unit tests: pytest (backend), Vitest (frontend)
- Integration tests: pytest + httpx
- E2E tests: Playwright

---

## 14. DevOps & Infrastructure

### 14.1 Hosting
Docker Compose on local machine or VPS (for MVP demo)

### 14.2 CI/CD Pipeline
Not implemented for MVP

### 14.3 Environment Strategy
- Single environment (local development = demo environment)
- Environment variables via `.env` file

### 14.4 Docker Compose Configuration
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:80"]
  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [db]
    env_file: .env
  db:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]
    env_file: .env
```

---

## 15. Monitoring & Observability

### 15.1 Logging
- Backend: Python logging to stdout (Docker captures)
- Frontend: Browser console

### 15.2 Metrics & Alerting
[TO BE IMPLEMENTED POST-MVP]

### 15.3 Error Tracking
[TO BE IMPLEMENTED POST-MVP]

---

## 16. Performance Requirements

| Metric | Target |
|--------|--------|
| CSV Upload (15K rows) | < 10 seconds |
| CSV Upload (60K rows) | < 30 seconds |
| Report API response | < 1 second |
| Dashboard page load | < 2 seconds |
| Concurrent users | 10 (MVP) |

---

## 17. Cost Estimation

| Item | Monthly Estimate | Notes |
|------|-----------------|-------|
| VPS (if deployed) | $10-20/mo | DigitalOcean/Hetzner droplet |
| Domain | $1/mo | Optional for MVP |
| Total (MVP) | $0-20/mo | Can run entirely locally |

---

## 18. Milestones & Timeline

| Milestone | Description | Target | Dependencies |
|-----------|------------|--------|--------------|
| M1 | Project setup (Docker, DB, auth) | Feb 24 AM | None |
| M2 | CSV upload + validation + point calc | Feb 24 Mid | M1 |
| M3 | Main Dashboard | Feb 24 PM | M2 |
| M4 | Reports 1-3 (retrospective) | Feb 24 Evening | M2 |
| M5 | Reports 4-5 (comparison + prospective) | Feb 24 Night | M2 |
| M6 | Manual Data Entry | Feb 25 AM | M1 |
| M7 | Polish + pixel-perfect UI | Feb 25 | M3-M6 |

---

## 19. Epics & Task Breakdown

### Epic 1: Project Foundation
| Story | Description | Complexity | Dependencies |
|-------|-------------|-----------|--------------|
| 1.1 | Docker Compose setup (frontend + backend + postgres) | M | None |
| 1.2 | FastAPI project structure with routers, services, models | M | None |
| 1.3 | React + Vite + Tailwind + Router project setup | M | None |
| 1.4 | Database schema + Alembic migrations | M | 1.2 |
| 1.5 | Seed appointment types (49 visit types + points) | S | 1.4 |
| 1.6 | Seed demo organization, admin user, locations | S | 1.4 |

### Epic 2: Authentication & Multi-tenancy
| Story | Description | Complexity | Dependencies |
|-------|-------------|-----------|--------------|
| 2.1 | JWT auth endpoints (login, me, logout) | M | 1.2 |
| 2.2 | Auth middleware + organization_id injection | S | 2.1 |
| 2.3 | Frontend login page + auth context + protected routes | M | 1.3, 2.1 |
| 2.4 | User management API (CRUD) | M | 2.1 |
| 2.5 | Role-based route guards (admin vs manager) | S | 2.3 |

### Epic 3: Data Ingestion
| Story | Description | Complexity | Dependencies |
|-------|-------------|-----------|--------------|
| 3.1 | Retrospective CSV/Excel parser (Pandas) | L | 1.4 |
| 3.2 | Prospective CSV/Excel parser (Pandas) | M | 1.4 |
| 3.3 | Schema validation (required columns, data types) | M | 3.1 |
| 3.4 | Visit Points calculation (type → points lookup) | S | 1.5, 3.1 |
| 3.5 | Within-file duplicate detection | M | 3.1 |
| 3.6 | Dataset versioning (new upload → mark previous inactive) | M | 3.1 |
| 3.7 | Upload API endpoints + file storage | M | 3.1, 3.2 |
| 3.8 | Frontend Upload page (file picker, progress, results) | M | 1.3, 3.7 |
| 3.9 | Auto-create locations from CSV data | S | 3.1 |

### Epic 4: Main Dashboard
| Story | Description | Complexity | Dependencies |
|-------|-------------|-----------|--------------|
| 4.1 | Dashboard API: overview metrics + location table | M | 1.4 |
| 4.2 | Frontend: Dashboard layout (pixel-perfect) | L | 1.3 |
| 4.3 | Tech Points Overview line chart widget | M | 4.1 |
| 4.4 | Summary stats cards (Total Locations, Employees, Managers) | S | 4.1 |
| 4.5 | Organization Locations table with search | M | 4.1 |
| 4.6 | Organization Growth sparkline widget | S | 4.1 |

### Epic 5: Report Dashboards
| Story | Description | Complexity | Dependencies |
|-------|-------------|-----------|--------------|
| 5.1 | Reports layout: sidebar + report area + filters | M | 1.3 |
| 5.2 | Location sidebar component (search, select, highlight) | M | 5.1 |
| 5.3 | Report 1: Tech Points by Location API + Chart | L | 3.1, 5.1 |
| 5.4 | Report 2: Monthly Tech Points by Location API + Chart | L | 3.1, 5.1 |
| 5.5 | Report 3: Scheduled Points by Provider API + Chart | L | 3.2, 5.1 |
| 5.6 | Report 4: Points Paid Tech FTE API + Chart | L | 3.1, 5.1 |
| 5.7 | Report 5: Weekly Points by Location API + Chart | L | 3.2, 5.1 |

### Epic 6: Manual Data Entry
| Story | Description | Complexity | Dependencies |
|-------|-------------|-----------|--------------|
| 6.1 | Manual entry API (create, draft, list) | M | 1.4 |
| 6.2 | Data Entry page layout (pixel-perfect) | M | 1.3 |
| 6.3 | Editable table with dropdowns + date/time pickers | L | 6.2 |
| 6.4 | Save / Save as Draft / Cancel logic | M | 6.1, 6.3 |
| 6.5 | Auto-calculate points on save | S | 6.1, 1.5 |

### Epic 7: Navigation & Global Components
| Story | Description | Complexity | Dependencies |
|-------|-------------|-----------|--------------|
| 7.1 | Top navigation bar (pixel-perfect) | M | 1.3 |
| 7.2 | Header: Dashboard, Reports, Locations, Employees, Announcements | S | 7.1 |
| 7.3 | User avatar + settings + notification icons | S | 7.1, 2.3 |

**Complexity Guide:** S = < 4 hours, M = 4-8 hours, L = 8-16 hours

---

## 20. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 24-hour deadline impossible for all features | High | High | Ruthlessly prioritize; reports are highest value |
| Pixel-perfect UI takes longer than expected | High | Medium | Use Tailwind utilities aggressively; focus on layout over micro-details |
| Large CSV (60K rows) slow to process | Medium | Medium | Pandas bulk insert with copy_from; batch processing |
| Chart library limitations | Low | Medium | Recharts is highly customizable; fallback to custom SVG |
| Multi-tenancy bugs (data leakage) | Low | High | Organization_id filter in every query; service-layer enforcement |

---

## 21. Open Questions

- [ ] Should Clinic Manager mapping (which manager oversees which location) come from the CSV's "Clinic Manager Mapping" sheet, or be manually configured?
- [ ] The prospective data has no "Rooming Tech" column — is this expected? (Prospective = scheduled appointments before tech assignment)
- [ ] Should "Points per session" in the sidebar link to a specific report, or is it a separate view?
- [ ] What is the Organization Growth % calculation methodology?
- [ ] Should YTD metrics on the dashboard use calendar year or rolling 12 months?

---

## 22. Appendix

### A. Decision Log Reference
See: [decisions.md](./decisions.md)

### B. Technology Research Reference
See: [tech-research.md](./tech-research.md)

### C. Visit Type Point Mapping (49 types)
Source: `TestData/VisitType_and_PointMapping.csv`

| Visit Type | Points |
|-----------|--------|
| New Patient | 2 |
| Return Visit | 1.5 |
| Urgent | 1.5 |
| Inmates | 2 |
| Return Contact Lens | 1.5 |
| Specialty Lens Fitting | 1.5 |
| Post-Op 1 Day | 1 |
| Post-Op | 1 |
| New Contact Lens | 2 |
| Botox | 2 |
| New Neuro-Opthalmology | 2 |
| Return Neuro | 1.5 |
| Studies Only-Ophthalmology | 1.5 |
| Laser | 2 |
| New Cataract Evaluation | 3 |
| Tech Only | 1.5 |
| Post-Op Month | 1 |
| Injection | 2 |
| New Visual Field | 3 |
| New Adult Eye Patient | 2 |
| New Lasik | 2 |
| Return Visual Field | 1.5 |
| Procedure | 2 |
| Visual Acuity | 1.5 |
| New Cataract | 3 |
| New Glaucoma | 3 |
| Dry Eye Consult | 3 |
| New Cornea | 2 |
| Procedure (With Copay) | 2 |
| Complete Eye Exam | 2 |
| Cosmetic | 2 |
| Cpc | 2 |
| New Cicatricial Pemphigoid | 2 |
| New Tumor | 3 |
| Injection-Retina | 2 |
| Return Uveitis | 1.5 |
| Return Long | 1.5 |
| New Uveitis | 2 |
| Driving Eval | 1 |
| New Photodynamic Therapy | 2 |
| Return Tumor | 1.5 |
| Return Photodynamic Therapy | 1.5 |
| New Nicu Baby | 2 |
| Evaluation | 2 |
| Surgical Work Up | 2 |
| Return Dry Eye | 1.5 |
| Minor Room | 2 |
| Office Visit | 2 |

### D. Data File Specifications

**Retrospective (full_historical_data.xlsx):**
- 14,637 rows
- 32 columns
- Date range: Aug 2025+
- Pre-computed Visit Points in column index 29
- Includes: Department, Location, Rooming Tech, Provider, Specialty, Encounter #, Appt Date/Time, Session (AM/PM), Check In/Out times, Visit Duration, Tech Level, Rooming Time, Tech In/Out/Duration, Visit Type, Visit Points, Primary Diagnosis
- 12 unique locations, 11 specialties, 48 visit types

**Prospective (OptimizeFlow Prospective - Sample Data Set 022226.xlsx):**
- 59,625 rows
- 11 columns
- Date range: Mar 2026+
- No Visit Points column (must be calculated)
- No Rooming Tech column (not yet assigned)
- Includes: Department/Organization, Location, Provider, Specialty, Encounter #, Appt Date/Time, Day of Week, Week of Month, Visit Type, Comments
- 11 unique locations, 48 visit types

### E. UI Design Reference

**Design System (from mockups):**
- **Font:** Inter / system sans-serif
- **Primary Color:** Deep indigo/purple (#6366F1 for accents, links)
- **Text Color:** Dark slate (#1E293B for headings, #475569 for body)
- **Background:** White (#FFFFFF) with light gray sections (#F9FAFB)
- **Chart Colors:**
  - Report 1 AM bars: Dark indigo (#4338CA)
  - Report 1 PM bars: Light indigo (#A5B4FC)
  - Report 2 AM bars: Teal (#0D9488)
  - Report 2 PM bars: Light teal (#5EEAD4)
  - Report 4 Month 1: Dark indigo
  - Report 4 Month 2: Teal/cyan
  - Target line: Red (#EF4444)
- **Navigation:** Clean top bar, white background, active item has purple dot
- **Cards:** White with subtle border, rounded-lg, shadow-sm
- **Sidebar:** Light background, location list with purple highlight for selected
