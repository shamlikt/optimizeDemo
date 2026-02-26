# OrderGuard - Restaurant Refund Dispute Management Platform

## Project Overview

A web platform enabling restaurants to dispute refunded orders from delivery platforms (Uber Eats, Deliveroo). The system follows a **Franchise → Branch** hierarchy where:
- Admins upload platform-specific CSV files containing refunded orders
- Clients (restaurant staff) submit proof images for each order
- The system tracks status transitions and auto-expires old orders

---

## ⚠️ IMPORTANT: Test Data Policy

- **DO NOT** remove, delete, or untrack the `test_data/` directory from git or production.
- **DO NOT** add `test_data/` to `.gitignore`.
- Only remove test data if the user **explicitly** requests it.

---

## ⚠️ IMPORTANT: Git Push Policy

- **NEVER** push code to `main` (or any branch) unless the user **explicitly** says to push.
- Always commit locally first and wait for the user's instruction before pushing.

---

## ⚠️ IMPORTANT: Mandatory Steps for Every Code Change

The following steps are **non-negotiable** and must be followed for **every** code change — features, bug fixes, refactors, CI changes, etc. **No exceptions.**

### 1. Jira Ticket (BEFORE writing any code)

- **Create a Jira ticket** under Epic **KAN-32** (OrderGuard) using the Atlassian MCP tools.
- The ticket must have a clear summary and description of the change.
- **Transition to "In Progress"** when starting work.
- **Transition to "In QA"** after completing work.
- **No code change should be committed without a corresponding Jira ticket.**

### 2. Commit & Push (AFTER completing the change)

- Stage and commit the changes with a descriptive commit message.
- Push to the appropriate branch on GitHub.
- Reference the Jira ticket key in the commit message when possible.

### 3. Build & Deploy (AFTER pushing)

Rebuild the Docker containers from scratch:

```bash
docker compose down && docker compose up --build
```

Do NOT use cached builds. Always use `--build` to ensure changes are picked up.

---

## Tech Stack

### Backend
- **Framework**: Python FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy (async with asyncpg)
- **Authentication**: JWT tokens with python-jose
- **Password Hashing**: passlib with bcrypt
- **CSV Processing**: pandas with platform-specific parsers
- **File Storage**: Local filesystem
- **Background Jobs**: APScheduler (order expiration)
- **Validation**: Pydantic v2

### Frontend
- **Framework**: React 18+ with TypeScript
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Internationalization**: i18next (English/French)
- **Charts**: Recharts (dashboard)
- **Icons**: Lucide React

### Development Tools
- **Backend**: uvicorn, alembic (migrations)
- **Frontend**: Vite, ESLint

---

## Entity Model

### User Roles
| Role | Description |
|------|-------------|
| `super_admin` | Full system access, can manage all franchises and users |
| `admin` | Can upload CSVs, view all data, manage users within scope |
| `super_client` | Can access multiple branches |
| `client` | Restaurant staff, can view and submit proofs for assigned branches |

### Entity Hierarchy

```
Franchise (e.g., "Chamas Tacos")
├── Branch (e.g., "Lyon Centre", "Paris 15ème")
│   └── ContestationList (CSV upload session)
│       └── OrderItem (individual refunded order)
│           └── OrderItemImage (proof photos)
└── Restaurant (auto-created from CSV, linked to branch via default_branch_id)
    └── RestaurantPlatformMapping (platform-specific name variations)
```

### Access Control
- Users are assigned to **Branches** via `user_branches` table
- Users can ONLY see ContestationLists for their assigned branches
- Branch assignment determines all data visibility

---

## Database Schema

### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- admin, client, super_client, super_admin
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Franchises
```sql
CREATE TABLE franchises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Branches
```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    external_id VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    number_of_employees INTEGER DEFAULT 0,
    manager_name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User-Branch Association
```sql
CREATE TABLE user_branches (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, branch_id)
);
```

### Restaurants (Auto-created from CSV)
```sql
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    external_id VARCHAR(100) UNIQUE,
    franchise_id UUID REFERENCES franchises(id),
    default_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    city VARCHAR(100),
    address VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Restaurant Platform Mappings
```sql
CREATE TABLE restaurant_platform_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- deliveroo, uber_eats
    platform_name VARCHAR(255) NOT NULL, -- Name as appears on platform
    confidence_score NUMERIC(5,2),
    is_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, platform_name)
);
```

### Contestation Lists (CSV Upload Sessions)
```sql
CREATE TABLE contestation_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    platform_type VARCHAR(20), -- deliveroo, uber_eats
    total_items INTEGER DEFAULT 0,
    pending_items INTEGER DEFAULT 0,
    submitted_items INTEGER DEFAULT 0,
    refunded_items INTEGER DEFAULT 0,
    has_updates BOOLEAN DEFAULT FALSE, -- Admin notification flag
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Order Items (Individual CSV Rows)
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contestation_list_id UUID REFERENCES contestation_lists(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    order_external_id VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- uber_eats, deliveroo
    order_date DATE NOT NULL,
    refund_amount NUMERIC(10,2) NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id),
    platform_type VARCHAR(20),
    raw_data JSONB, -- All platform-specific CSV fields
    order_uuid VARCHAR(255), -- Deliveroo UUID
    status VARCHAR(30) DEFAULT 'pending', -- pending, submitted, refunded, rejected, expired
    created_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contestation_list_id, row_number)
);
```

### Order Item Images (Proof Photos)
```sql
CREATE TABLE order_item_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 for deduplication
    original_filename VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(50),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Status Workflow

```
pending → submitted (when image(s) uploaded)
submitted → refunded (when refund CSV uploaded)
pending → expired (auto, when order_date > 14 days old)
```

### Status Definitions
| Status | Description |
|--------|-------------|
| `pending` | Initial status, awaiting image upload from client |
| `submitted` | Images uploaded, awaiting platform response |
| `refunded` | Dispute won, refund confirmed via CSV |
| `rejected` | Dispute lost (manual) |
| `expired` | Order date > 14 days, no longer contestable |

---

## CSV Processing

### Platform-Specific Parsers
The system uses specialized parsers for each delivery platform:

#### Deliveroo CSV Format
- Restaurant name in first column
- Order UUID used for matching
- Fields: Restaurant, Order UUID, Order Date/Time, Refund Amount, etc.

#### Uber Eats CSV Format
- Store Name column identifies restaurant
- Order ID used for matching
- Fields: Store Name, Order ID, Order Date, Net Payout, etc.

### Upload Workflow
1. Admin selects platform type (deliveroo/uber_eats)
2. System parses CSV with platform-specific parser
3. Restaurants auto-created/matched by name
4. ContestationList created with all OrderItems
5. Counters updated (total_items, pending_items)

### Refund CSV Upload
1. Admin uploads refund CSV for a ContestationList
2. System matches orders by order_external_id
3. Matched orders updated to `refunded` status
4. Counters updated

---

## API Endpoints

### Authentication (`/api/v1/auth`)
```
POST /login              # Login, returns JWT
POST /logout             # Logout
GET  /me                 # Get current user
```

### Super Admin (`/api/v1/super-admin`)
```
GET    /users                     # List all users
POST   /users                     # Create user
GET    /users/{id}                # Get user
PUT    /users/{id}                # Update user
DELETE /users/{id}                # Delete user
POST   /users/{id}/reset-password # Reset password
GET    /users/{id}/branches       # Get user's branches
PUT    /users/{id}/branches       # Update user's branches
```

### Franchises (`/api/franchises`)
```
GET    /                  # List franchises
POST   /                  # Create franchise (admin)
GET    /{id}              # Get franchise with branches
PUT    /{id}              # Update franchise (admin)
DELETE /{id}              # Delete franchise (admin)
GET    /{id}/users        # Get users in franchise
```

### Branches (`/api/branches`)
```
GET    /                  # List branches
POST   /                  # Create branch (admin)
GET    /{id}              # Get branch
PUT    /{id}              # Update branch (admin)
DELETE /{id}              # Delete branch (admin)
GET    /{id}/users        # Get branch users
```

### Restaurants (`/api/restaurants`)
```
GET    /                  # List restaurants
POST   /                  # Create restaurant (admin)
GET    /{id}              # Get restaurant
PUT    /{id}              # Update restaurant (admin)
DELETE /{id}              # Delete restaurant (admin)
```

### Contestation Lists (`/api/contestation-lists`)
```
GET    /                          # List contestation lists
POST   /upload                    # Upload platform CSV (admin)
GET    /{id}                      # Get contestation list
POST   /{id}/refunds              # Upload refund CSV (admin)
```

### Order Items (`/api/order-items`)
```
GET    /                          # List order items
GET    /{id}                      # Get order item
POST   /{id}/images               # Upload proof image
GET    /{id}/images               # List images
GET    /{id}/images/{image_id}    # Get image
DELETE /{id}/images/{image_id}    # Delete image
PUT    /{id}/status               # Update status (admin)
GET    /contestation-list/{cl_id} # Get items for contestation list
GET    /grouped                   # Get items grouped by restaurant
```

### Dashboard (`/api/dashboard`)
```
GET    /metrics    # Get dashboard metrics (client or admin)
```

### Restaurant Mappings (`/api/restaurant-mappings`)
```
GET    /                    # List mappings
POST   /                    # Create mapping
GET    /unmatched           # Get unmatched platform names
POST   /{id}/confirm        # Confirm mapping
DELETE /{id}                # Delete mapping
```

---

## Project Structure

### Backend
```
backend/
├── alembic/
│   └── versions/                # Database migrations
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app, router setup
│   ├── config.py                # Settings from environment
│   ├── database.py              # SQLAlchemy async setup
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py              # User, UserRole
│   │   ├── franchise.py         # Franchise
│   │   ├── branch.py            # Branch, UserBranch
│   │   ├── restaurant.py        # Restaurant, user_restaurants
│   │   ├── restaurant_platform_mapping.py
│   │   ├── contestation_list.py # ContestationList
│   │   └── order_item.py        # OrderItem, OrderItemImage
│   ├── schemas/
│   │   ├── user.py, franchise.py, branch.py, ...
│   │   ├── contestation_list.py
│   │   ├── order_item.py
│   │   └── dashboard.py
│   ├── api/
│   │   ├── deps.py              # Dependencies (auth, etc.)
│   │   ├── auth.py              # Authentication endpoints
│   │   ├── super_admin.py       # User management
│   │   ├── admin.py             # Admin endpoints
│   │   ├── client.py            # Client endpoints
│   │   ├── franchises.py        # Franchise CRUD
│   │   ├── branches.py          # Branch CRUD
│   │   ├── restaurants.py       # Restaurant CRUD
│   │   ├── contestation_lists.py
│   │   ├── order_items.py       # Order items + images
│   │   ├── dashboard.py         # Analytics
│   │   └── restaurant_mappings.py
│   ├── services/
│   │   ├── auth.py              # JWT handling
│   │   ├── user_management.py   # User CRUD logic
│   │   ├── franchise_service.py
│   │   ├── branch_service.py
│   │   ├── contestation_service.py
│   │   ├── image_service.py     # Image upload/storage
│   │   ├── dashboard_service.py # Metrics calculation
│   │   ├── expiration_service.py # Auto-expire orders
│   │   ├── scheduler.py         # APScheduler setup
│   │   ├── platform_csv_service.py
│   │   ├── name_matching_service.py
│   │   └── csv_parsers/
│   │       ├── factory.py
│   │       ├── deliveroo_parser.py
│   │       └── uber_eats_parser.py
│   └── utils/
│       ├── security.py          # Password hashing
│       └── file_storage.py      # File operations
├── uploads/                     # Stored images
├── requirements.txt
├── alembic.ini
└── Dockerfile
```

### Frontend
```
frontend/
├── src/
│   ├── App.tsx                  # Routes setup
│   ├── main.tsx                 # Entry point
│   ├── i18n.ts                  # i18next config
│   ├── components/
│   │   ├── AuthProvider.tsx     # Auth context
│   │   ├── ui/                  # Base components
│   │   │   ├── Button.tsx, Card.tsx, Input.tsx, Table.tsx, Modal.tsx
│   │   ├── layout/
│   │   │   ├── Layout.tsx, Header.tsx, Sidebar.tsx
│   │   ├── features/
│   │   │   ├── AllOrdersTable.tsx
│   │   │   ├── ImageGallery.tsx
│   │   │   ├── ImageManageModal.tsx
│   │   │   ├── FranchiseAccordion.tsx
│   │   │   ├── BranchCard.tsx
│   │   │   ├── UserForm.tsx
│   │   │   └── MappingConfirmModal.tsx
│   │   └── dashboard/
│   │       ├── ClientDashboard.tsx
│   │       ├── MetricsCard.tsx
│   │       ├── TrendChart.tsx
│   │       └── StatusBreakdownChart.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ContestationLists.tsx
│   │   ├── ContestationListDetail.tsx
│   │   ├── ContestationDashboard.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── UploadCSV.tsx
│   │       ├── Franchises.tsx
│   │       ├── Branches.tsx
│   │       ├── Users.tsx
│   │       └── RestaurantMappings.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useDashboard.ts
│   ├── services/
│   │   └── api.ts               # Axios client
│   ├── types/
│   │   ├── index.ts
│   │   └── dashboard.ts
│   └── locales/
│       ├── en.json
│       └── fr.json
├── tailwind.config.js
├── package.json
└── vite.config.ts
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/orderguard

# Security
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# Scheduler
EXPIRATION_DAYS=14
EXPIRATION_CHECK_INTERVAL_HOURS=1

# CORS
CORS_ORIGINS=["http://localhost:5173"]
```

---

## Access Control Rules

### Branch-Based Permissions (IMPORTANT)
- Users are assigned to Branches via `user_branches` table
- All data visibility is determined by branch assignment
- ContestationList has `branch_id` - users only see lists for their branches
- OrderItem visibility is determined by its ContestationList's branch_id

### Permission Matrix
| Action | Super Admin | Admin | Super Client | Client |
|--------|-------------|-------|--------------|--------|
| Manage all users | ✓ | ✗ | ✗ | ✗ |
| Manage franchises/branches | ✓ | ✓ | ✗ | ✗ |
| Upload CSV | ✓ | ✓ | ✗ | ✗ |
| View all data | ✓ | ✓ | ✗ | ✗ |
| View assigned branch data | ✓ | ✓ | ✓ | ✓ |
| Upload proof images | ✗ | ✗ | ✓ | ✓ |
| Upload refund CSV | ✓ | ✓ | ✗ | ✗ |

---

## File Storage

```
/uploads
  /order_items
    /{order_item_id}
      /{file_hash}_{original_filename}.jpg
```

### Image Rules
- Max 10MB per image
- Only JPG/PNG accepted
- SHA-256 hash for deduplication
- Multiple images per order item allowed

---

## Key Services

### Expiration Service
Runs hourly via APScheduler:
- Finds OrderItems where `order_date` > 14 days ago
- Updates status to `expired`
- Updates ContestationList counters

### Name Matching Service
- Fuzzy matches restaurant names across platforms
- Uses token-based similarity scoring
- Creates RestaurantPlatformMapping entries
- Admin can confirm/reject matches

---

## Design System

### Colors
- Primary: Slate blue (#475569)
- Accent: Soft indigo (#6366F1)
- Success: Muted green (#10B981)
- Warning: Warm amber (#F59E0B)
- Error: Soft red (#EF4444)
- Background: White (#FFFFFF), Gray (#F9FAFB)

### Components
- Clean, minimal design
- Subtle shadows (shadow-sm)
- Rounded corners (rounded-lg)
- Pill-shaped status badges
- No harsh gradients or neon colors
