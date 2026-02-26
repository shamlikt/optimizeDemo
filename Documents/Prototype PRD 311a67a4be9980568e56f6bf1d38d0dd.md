# Prototype PRD

# OptimizeFlow – Product Requirements Document (PRD)

Version: 1.0 (MVP)

Owner: Gauri Joshi

Target Delivery: March 31

---

# 1. Overview

OptimizeFlow MVP enables structured ingestion of appointment-level operational data, controlled validation, role-based access, dataset versioning, and automated dashboard generation.

This document defines the functional and technical requirements for the MVP only.

---

# 2. Goals

The MVP is designed to:

- Ingest prospective and retrospective appointment data via CSV
- Standardize productivity reporting across providers and locations
- Ensure controlled validation and auditability of operational data
- Provide secure, role-based access to dashboards
- Establish a scalable data foundation for future forecasting and interoperability

---

# 3. Scope

The MVP includes:

- CSV upload (prospective and retrospective appointment data)
- Data validation (schema and row-level)
- Dataset versioning and overwrite capability
- Role-based access control (RBAC)
- Automated dashboard generation
- Audit logging

The MVP excludes predictive modeling, API integrations, and advanced forecasting.

---

# 4. Functional Requirements

## 4.1 Data Ingestion

### Upload UI

- Dedicated Upload tab
- Clinic Admin can upload and overwrite
- Clinic Manager is view-only

### Supported Upload Types

### Retrospective Appointment Data (Required Columns)

- Location
- Provider
- Specialty (optional)
- Clinic Manager
- Appointment Date
- Appointment Time
- Appointment Type
- Room Tech

### Prospective Appointment Data (Required Columns)

- Location
- Provider
- Specialty (optional)
- Appointment Date
- Appointment Time
- Appointment Type

If required columns are missing, the upload fails.

---

## 4.2 Data Validation

Validation occurs before persistence.

### Schema Validation

- Required columns exist
- Column names match expected structure

### Row-Level Validation

- Valid date format
- Valid time format
- Non-null Provider and Location

### Duplicate Handling (Within-File Only)

For Retrospective uploads, duplicates are defined by:

- Provider
- Location
- Appointment Date
- Appointment Time
- Appointment Type
- Room Tech

For Prospective uploads, duplicates are defined by:

- Provider
- Location
- Appointment Date
- Appointment Time
- Appointment Type

MVP Behavior:

- Detect within-file duplicates
- Persist all rows
- Mark duplicates with:
    - is_duplicate = true
    - is_excluded_from_reporting = true
    - exclusion_reason = ‘WITHIN_FILE_DUPLICATE’
- Dashboards must filter out is_excluded_from_reporting = true

Incremental uploads and cross-version duplicate detection are out of scope for MVP.

---

## 4.3 Dataset Versioning

When a new file is uploaded:

1. Validate file
2. Persist as new dataset version
3. Mark previous version inactive
4. Regenerate dashboards
5. Log audit event

Previous versions remain stored.

---

# 5. Reporting Specifications

## Report 1 – Tech Points by Location (Retrospective)

- Filter by Clinic Manager
- Default time period (configurable)
- Morning vs Afternoon split
- Two side-by-side bars per tech
- Built from retrospective data only

---

## Report 2 – Points by Location Over Time (Retrospective)

- Multi-location selector
- Time range selector (default: last 10 days)
- Line chart by day
- Summary stats panel (Total Locations, Employees, Managers)
- Built from retrospective data only

---

## Report 3 – Points by Location and Provider (Retrospective)

- Filter by Location
- Time period selector
- Horizontal bars per Provider
- Morning vs Afternoon split
- Built from retrospective data only

---

## Report 4 – Points by Specialty Month Comparison (Retrospective)

- Compare two selected months
- Specialty optional; missing values bucketed into “Other”
- Horizontal grouped bars
- Built from retrospective data only

---

## Report 5 – Weekly Scheduled Points by Specialty (Prospective)

- Built from prospective data only
- Group by Specialty
- Split by day (week view)
- Morning / Afternoon / Total
- Missing specialty bucketed into “Other”

---

# 6. Data Model

Relationships:

- One Organization has many Locations
- One Location has many Appointments
- One Location has many Appointment Types
- One Location has many Techs
- One Tech may work across multiple Locations
- One Manager oversees multiple Locations
- One Appointment belongs to one Location and one Provider
- One Appointment has one Appointment Type

### Appointment Type Points

- Stored in appointment_types table
- Configurable per Organization
- Referenced by appointment_type_id

### Point Mapping Configuration (MVP)

- Clinic Admin can add, update, deactivate appointment types
- Changes logged in audit_log
- Scoped per Organization

### Productivity Calculation

Productivity = sum(point_value) per grouping.

---

# 7. Architecture

### uploads

- id
- version_number
- uploaded_by
- uploaded_at
- file_hash
- row_count
- status
- is_active

### appointments

- id
- upload_id
- provider
- location
- specialty
- appointment_date
- appointment_time
- appointment_type_id
- room_tech
- is_duplicate
- is_excluded_from_reporting
- exclusion_reason

### appointment_types

- id
- organization_id
- name
- point_value

### audit_log

- id
- user_id
- action_type
- entity_type
- entity_id
- timestamp
- metadata_json

---

# 8. Non-Functional Requirements

## Security

- Role-based access control
- HTTPS enforced
- Encrypted storage at rest

## Performance

- Process 10,000 rows under 10 seconds
- Dashboard load under 2 seconds

## Scalability

- Support up to 100,000 rows per upload
- Support 100 concurrent viewers

[Notes Feb 23rd, 2026](https://www.notion.so/Notes-Feb-23rd-2026-311a67a4be998000ba99de689caea688?pvs=21)