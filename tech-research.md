# Technology Research — OptimizeFlow

> Compiled during project scoping. Last updated: 2026-02-24

## Table of Contents
- [Frontend Framework](#frontend-framework)
- [Backend Framework](#backend-framework)
- [Database](#database)
- [Chart Library](#chart-library)
- [CSS Framework](#css-framework)
- [Deployment](#deployment)

---

## Frontend Framework

### Research Context
- **Decision Phase:** Phase 6
- **Key Requirements:** Pixel-perfect dashboard UI, 5 report types with complex charts, rapid development
- **Research Date:** 2026-02-24

### Tools Evaluated

| Tool | Version | License | Maintained | Our Pick? |
|------|---------|---------|------------|-----------|
| React + Vite | React 18.3 / Vite 6.x | MIT | Active | ⭐ Selected |
| Next.js | 15.x | MIT | Active | |
| Vue 3 + Vite | 3.5.x | MIT | Active | |
| Svelte 5 | 5.x | MIT | Active | |

### Selected: React + Vite + TypeScript
**Why:** Largest ecosystem, best chart library support (Recharts), team familiarity, fastest path to pixel-perfect dashboards.

---

## Backend Framework

### Tools Evaluated

| Tool | Version | License | Maintained | Our Pick? |
|------|---------|---------|------------|-----------|
| FastAPI | 0.115.x | MIT | Active | ⭐ Selected |
| Django + DRF | 5.1.x | BSD | Active | |
| Express.js | 5.x | MIT | Active | |
| Go Gin | 1.10.x | MIT | Active | |

### Selected: FastAPI
**Why:** Pandas integration for CSV processing (14K-60K rows), auto-generated API docs, Pydantic validation, async support.

---

## Database

### Tools Evaluated

| Tool | Version | License | Maintained | Our Pick? |
|------|---------|---------|------------|-----------|
| PostgreSQL | 16.x | PostgreSQL License | Active | ⭐ Selected |
| SQLite | 3.x | Public Domain | Active | |
| MySQL | 8.4.x | GPL | Active | |

### Selected: PostgreSQL
**Why:** Best analytics functions (window, aggregation), JSONB for raw data, multi-tenant SaaS ready.

---

## Chart Library

### Tools Evaluated

| Tool | Version | License | Maintained | Our Pick? |
|------|---------|---------|------------|-----------|
| Recharts | 2.15.x | MIT | Active | ⭐ Selected |
| Chart.js + react-chartjs-2 | 4.x | MIT | Active | |
| Nivo | 0.88.x | MIT | Active | |
| Victory | 37.x | MIT | Active | |

### Selected: Recharts
**Why:** Native React, supports all needed chart types (BarChart, LineChart, horizontal bars, grouped bars), highly customizable for pixel-perfect matching.

---

## CSS Framework

### Tools Evaluated

| Tool | Version | License | Maintained | Our Pick? |
|------|---------|---------|------------|-----------|
| Tailwind CSS | 4.x | MIT | Active | ⭐ Selected |
| CSS Modules | N/A | N/A | N/A | |
| Styled Components | 6.x | MIT | Active | |
| shadcn/ui + Tailwind | N/A | MIT | Active | |

### Selected: Tailwind CSS
**Why:** Utility-first approach enables pixel-perfect matching of mockups, rapid iteration, consistent design system.

---

## Deployment

### Selected: Docker Compose
- Frontend: nginx serving built React app
- Backend: uvicorn running FastAPI
- Database: PostgreSQL 16
- All in one `docker-compose.yml`
