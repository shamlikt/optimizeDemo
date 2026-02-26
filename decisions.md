# Project Decisions Log — OptimizeFlow

> Auto-generated during project scoping. Last updated: 2026-02-24

## Summary
| # | Phase | Decision | Choice | Rationale |
|---|-------|----------|--------|-----------|
| 1 | Vision | Target Specialty | Ophthalmology only (MVP) | Focused scope, other specialties later |
| 2 | Vision | Timeline | ~24 hours (deadline Feb 25) | Hard deadline, MVP must be functional |
| 3 | Vision | Data Entry | Both CSV upload + manual entry | Required from day one per stakeholder |
| 4 | Vision | Tenancy Model | Multi-tenant from day one | SaaS model requires org isolation |
| 5 | Features | MVP Scope | 7 must-haves (see PRD) | Ruthlessly prioritized for deadline |
| 6 | Features | UI Fidelity | Pixel-perfect match to mockups | Stakeholder requirement |
| 7 | Architecture | Pattern | 3-tier SPA + API + DB | Standard SaaS architecture |
| 8 | Frontend | Framework | React + Vite + TypeScript | Fastest dev speed, Recharts for charts |
| 9 | Frontend | Styling | Tailwind CSS | Pixel-perfect control |
| 10 | Frontend | Charts | Recharts | Matches all chart types in mockups |
| 11 | Frontend | State | TanStack React Query | Server state caching |
| 12 | Backend | Framework | Python FastAPI | Pandas for CSV, Pydantic validation, async |
| 13 | Database | Engine | PostgreSQL | Analytics, JSONB, multi-tenant |
| 14 | Database | Multi-tenancy | Shared DB, shared schema, org_id filter | Simplest for MVP |
| 15 | DevOps | Deployment | Docker Compose (local/VPS) | Full stack in one command |

---

## Detailed Decisions

### Decision 1: Target Specialty
- **Phase:** Vision & Problem Statement
- **Date:** 2026-02-24
- **Choice:** Ophthalmology only (MVP)
- **Rationale:** Focused scope for tight deadline
- **Revisit If:** Early customer demand from non-ophthalmology practices

### Decision 2: Timeline
- **Phase:** Vision & Problem Statement
- **Date:** 2026-02-24
- **Choice:** Hard deadline — tomorrow (Feb 25, 2026)
- **Trade-offs Accepted:** Must ruthlessly prioritize

### Decision 3: Data Entry Method
- **Phase:** Vision & Problem Statement
- **Date:** 2026-02-24
- **Choice:** Both CSV upload and manual data entry
- **Rationale:** Stakeholder requirement — manual entry form in UI mockups

### Decision 4: Tenancy Model
- **Phase:** Vision & Problem Statement
- **Date:** 2026-02-24
- **Choice:** Multi-tenant from day one
- **Rationale:** Core SaaS requirement

### Decision 5: MVP Feature Scope
- **Phase:** Features & Prioritization
- **Date:** 2026-02-24
- **Choice:** Must-haves: CSV Upload, Visit Points calc, 5 Report Dashboards, Main Dashboard, Auth, Multi-tenancy, Location sidebar
- **Should-haves:** Manual data entry, Dataset versioning, Duplicate detection

### Decision 6: UI Fidelity
- **Phase:** Features & Prioritization
- **Date:** 2026-02-24
- **Choice:** Pixel-perfect match to UI mockups
- **Trade-offs Accepted:** More frontend time, but critical for stakeholder approval

### Decision 7-15: Tech Stack (Combined)
- **Phase:** Architecture & Tech Stack
- **Date:** 2026-02-24
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + Recharts + React Query + React Router v6 + Axios
- **Backend:** Python FastAPI + SQLAlchemy async + Pandas + Pydantic v2 + python-jose (JWT)
- **Database:** PostgreSQL + Alembic migrations
- **Deployment:** Docker Compose (frontend + backend + postgres)
- **Multi-tenancy:** Shared database, shared schema, organization_id on all tables
