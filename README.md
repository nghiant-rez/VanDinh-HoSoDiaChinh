# Van Dinh Land Management System

**Hệ thống Quản lý Hồ sơ Đất đai Vân Đình**

Local-first land records and digital map management system for commune-level administration.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue)

---

## 📋 Overview

This system provides:
- 🗺️ **Digital map management** - Import, index, and search parcel data
- 📂 **Record management** - Store and track land records with physical location mapping
- 🔍 **Advanced search** - Find records by parcel number, owner, or storage location
- 📊 **Dashboard & audit logs** - Monitor system activity and data statistics
- 🔐 **Role-based access** - Admin and Staff permission levels
- 🇻🇳 **Vietnamese-first** - Full Vietnamese localization

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- MapLibre GL (open-source map rendering)

**Backend:**
- Python 3.12+ (FastAPI) at localhost:8000
- PostgreSQL 18+ with PostGIS extension
- SQLAlchemy ORM

**Authentication:**
- Iron Session (encrypted cookie-based sessions)
- bcryptjs (frontend) / bcrypt (backend) password hashing
- Python FastAPI auth endpoints

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** 20 or higher ([Download](https://nodejs.org/))
- **Python** 3.12 or higher ([Download](https://www.python.org/downloads/))
- **PostgreSQL** 16 or higher with **PostGIS extension** ([Download](https://www.postgresql.org/download/windows/))
- **npm** (comes with Node.js) or **pnpm**

### Installing PostgreSQL with PostGIS (Windows)

1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. During installation, use Stack Builder to install PostGIS extension
3. Or manually enable PostGIS:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

---

## 🚀 Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd digital-archive-map-system
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Configure environment variables

Create a `.env.local` file from the template:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure:

```env
# Update with your PostgreSQL credentials
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/vandinh?schema=public"

# Generate a secure random secret (at least 32 characters)
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
SECRET_COOKIE_PASSWORD="your-generated-secret-here"
```

Backend config is read from `backend/.env` — copy and edit:

```bash
cp .env.example backend/.env
```

### 5. Create the database

```bash
# Using psql or pgAdmin, create the database:
createdb vandinh

# Enable PostGIS extension
psql -d vandinh -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 6. Initialize database schema

The schema is auto-created on backend startup via SQLAlchemy. Run the backend once:

```bash
cd backend && uvicorn app.main:app --reload --port 8000
```

### 7. Start development servers

**Terminal 1 — Frontend:**
```bash
npm run dev
```

**Terminal 2 — Backend:**
```bash
cd backend && uvicorn app.main:app --reload --port 8000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Accounts

After seeding, you can log in with:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Staff | `staff` | `staff123` |

⚠️ **IMPORTANT:** Change these passwords before deploying to production!

---

## 📁 Project Structure

```
digital-archive-map-system/
├── backend/                   # Python FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entrypoint
│   │   ├── config.py          # pydantic-settings
│   │   ├── database.py        # SQLAlchemy engine + session
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── dependencies.py    # get_db, get_current_user, require_roles
│   │   ├── routers/           # API route handlers
│   │   └── services/          # Business logic (GIS, OCR)
│   ├── data/                  # Uploads, temp files
│   └── requirements.txt
├── docs/                       # Documentation
│   ├── README.md                   # Docs index (read first)
│   ├── architecture.md             # System split, auth flow, DB, GIS
│   ├── use-cases.md                # UC-01 to UC-10 specifications
│   ├── feature-ownership.md        # Per-UC owner/files/status
│   ├── security.md                 # Open security issues
│   ├── changelog.md                # Dated log of applied fixes
│   └── references.md               # Jira/Figma links
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # API routes (Next.js, proxying to FastAPI)
│   │   ├── login/             # Login page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles + design tokens
│   ├── components/
│   │   ├── layout/            # Layout components (Sidebar, Header, AppShell)
│   │   ├── map/               # Map components (MapView, MapToolsPanel, MapLegend)
│   │   ├── storage/           # Storage explorer components
│   │   └── ui/                # Reusable UI components
│   └── lib/
│       ├── auth.ts            # Auth helpers (requireAuth, requireAdmin)
│       └── session.ts         # Iron Session configuration
├── .env.example               # Environment variables template
├── AGENTS.md                  # AI agent guidelines
├── CLAUDE.md                  # AI agent pointer
├── Db/                        # Full database schema reference
└── README.md                  # This file
```

---

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server (http://localhost:3000) |
| `npm run build` | Build frontend for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `cd backend && uvicorn app.main:app --reload --port 8000` | Start Python FastAPI backend |

---

## 🗺️ Use Cases

The system implements 10 use cases (UC-01 to UC-10):

| ID | Use Case | Status |
|----|----------|--------|
| UC-01 | Login system | ✅ Complete |
| UC-02 | Account management | ⚠️ Partial |
| UC-03 | Record entry | 🔄 In progress |
| UC-04 | Digital map import | 🔄 In progress |
| UC-05 | Record search | 🔄 In progress |
| UC-06 | Find parcel on map | 🔄 In progress |
| UC-07 | Export/print records | 🔄 In progress |
| UC-08 | Record mutation tracking | 📋 Planned |
| UC-09 | Scan vs map comparison | 📋 Planned |
| UC-10 | System activity monitoring | ⚠️ Partial |

See [docs/use-cases.md](./docs/use-cases.md) for detailed specifications.

---

## 🎨 Design

Figma designs are available at:
- [Design File](https://www.figma.com/make/FulVhQi6cecmb5S1RxmowM/Digital-Archive-Map-System--Copy-)

Implemented screens:
- ✅ Dashboard (home)
- ✅ Search
- ✅ Digital map
- ✅ Activity logs
- ✅ Login

---

## 🔐 Security Notes

- Passwords are hashed with bcrypt before storage
- Sessions are encrypted using iron-session
- Role-based access control (ADMIN/STAFF)
- Middleware protects all authenticated routes
- Audit logs track all critical operations

---

## 🌍 Deployment

This system is designed for **local-first, single-PC deployment**.

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

The `output: 'standalone'` configuration in `next.config.ts` creates a self-contained production build that can run on a local Windows PC without external dependencies.

---

## 📖 Documentation

- **[Docs Index](./docs/README.md)** - Start here for the doc map
- **[Use Cases & Specifications](./docs/use-cases.md)** - Detailed use case documentation
- **[Architecture](./docs/architecture.md)** - System split, auth flow, database, GIS
- **[Feature Ownership](./docs/feature-ownership.md)** - Per-UC owner/files/status
- **[Security](./docs/security.md)** - Open security issues and fix plan
- **[References](./docs/references.md)** - Jira board and Figma links
- **[Agent Guidelines](./AGENTS.md)** - AI coding agent instructions

---

## ⚠️ Known Issues

1. **Next.js 16 Middleware Deprecation Warning** - `middleware.ts` should be migrated to `proxy.ts` convention
2. **PostGIS Geometry Column** - Manual migration needed for `parcels.geometry` column — the GIS module currently uses in-memory caching instead of PostGIS
3. **API Placeholder Routes** - 7 API routes need full implementation (users, records, parcels, maps, logs, exports)
4. **OCR not yet implemented** - PaddleOCR dependency is listed in `requirements.txt` but the OCR router and service are not yet built

---

## 🔮 Roadmap

### Phase 2A (Current)
- [ ] Complete record entry form (UC-03)
- [ ] Implement search backend (UC-05)
- [ ] Add map import functionality (UC-04)
- [ ] Parcel map interaction (UC-06)
- [ ] Account management CRUD (UC-02)

### Phase 2B
- [ ] Export/print functionality (UC-07)
- [ ] Dashboard data integration (UC-10)
- [ ] Mutation tracking (UC-08)

### Phase 3
- [ ] OCR integration (Python PaddleOCR)
- [ ] Scan comparison (UC-09)

---

## 📄 License

[Specify your license or mark as Proprietary]

---

## 💡 Support

For questions or issues:
- Check the [Use Case Documentation](./docs/use-cases.md)
- Contact the development team

