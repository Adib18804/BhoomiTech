# BhoomiTech

**"Check Before You Buy" | "জমি কেনার আগে যাচাই করুন"**

BhoomiTech is a digital land due-diligence and pre-purchase verification platform that helps citizens and authorized institutional users review land identity, ownership information, historical records, mutation information, transaction history, case signals, government-interest signals, acquisition signals, and other available land-related information before proceeding with a transaction.

## Important Notes

⚠️ **SYNTHETIC DEMONSTRATION DATA**: This system uses synthetic data for demonstration purposes only.

⚠️ **NOT AI-POWERED**: This is a deterministic, rule-based verification system. No AI/ML is used in the verification engine.

⚠️ **NOT LEGAL ADVICE**: Results do not constitute legal ownership certificates, government verification, title opinions, or legal advice.

## Purpose & Scope

BhoomiTech is a **demonstration / informational prototype** built for a hackathon
setting. Its purpose is to show how a citizen could review available land
information before a purchase, and to make the verification logic transparent and
explainable. It is **not** a production service, **not** a government system, and
**not** a provider of legal ownership verification. No endpoint claims or
represents any ministry, department or official land-record function.

## Synthetic Data Policy

- **All** land records, khatians, dags, parcels, owners, mutations, cases,
  acquisition notices and government-interest signals shipped with the project
  are **synthetic** and generated deterministically for demonstration.
- No real citizen data, no real title records, and no live government data are
  used anywhere in the application.
- Administrative place names (divisions, districts, upazilas) are drawn from the
  public administrative structure of Bangladesh for realism; every **mouza** and
  every **parcel/record** is a synthetic demonstration entry and is labelled as
  such in the UI.
- Government sites are **never** scraped or queried at runtime. The official
  references below are listed for information only.

## Administrative Hierarchy

The platform models the public administrative structure of Bangladesh:

- **8 Divisions** — Dhaka, Chattogram, Khulna, Rajshahi, Sylhet, Rangpur,
  Mymensingh and Barishal (each with English and Bengali names).
- **64 Districts** — all districts, bilingual, grouped under their division.
- **Upazilas** — a representative set of upazilas per district.
- **Mouzas** — synthetic demonstration mouzas (clearly marked `SYNTHETIC`) used
  by the demo scenarios.

Land search cascades Division → District → Upazila → Mouza. Selections with no
demonstration record show a clear empty state rather than an error.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy
- **Database**: PostgreSQL + PostGIS
- **Map**: React-Leaflet + GeoJSON
- **Authentication**: Argon2id + JWT
- **Authorization**: RBAC with object-level permissions

## Project Structure

The project is divided into two main directories: `backend` (FastAPI) and `frontend` (React + Vite).

```text
BhoomiTech/
├── backend/                   # FastAPI Backend Application
│   ├── alembic/               # Database migrations (PostGIS schemas)
│   ├── app/                   # Main application code
│   │   ├── api/               # API route controllers (auth, land, verify, etc.)
│   │   ├── core/              # Configuration, security, rate limiting
│   │   ├── db/                # Database session management
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── schemas/           # Pydantic data validation schemas
│   │   ├── services/          # Business logic (verification engine, seed data)
│   │   └── assets/            # Fonts for PDF generation
│   ├── tests/                 # Pytest suite (109 tests)
│   ├── main.py                # FastAPI application entry point
│   ├── seed.py                # Script to populate synthetic demo data
│   ├── requirements.txt       # Python dependencies
│   └── verify_*.py            # Standalone security and scenario test scripts
│
├── frontend/                  # React + TypeScript Frontend
│   ├── public/                # Static assets (logo, favicons)
│   ├── src/                   # Source code
│   │   ├── components/        # Reusable UI components (Layout, Map, Ticker, etc.)
│   │   ├── pages/             # Page components (Dashboard, Home, Auth, Verify)
│   │   ├── services/          # API integration (Axios clients)
│   │   ├── i18n/              # Bilingual translations (English & Bengali)
│   │   ├── utils/             # Helper functions
│   │   └── App.tsx            # Main routing component
│   ├── index.html             # Vite HTML template
│   ├── tailwind.config.js     # Tailwind CSS styling configuration
│   └── package.json           # Node dependencies
│
├── .env.example               # Environment variable template
├── start-backend.ps1          # PowerShell script to run backend
├── start-frontend.ps1         # PowerShell script to run frontend
├── README.md                  # Project documentation
└── TESTING_GUIDE.md           # Hackathon demo testing scenarios
```





## User Roles

1. **Citizen/Land Buyer**: Pre-purchase verification, report generation
2. **System Admin**: Case review, data management and audit access **scoped to
   their assigned upazila** — enforced **server-side** (cross-jurisdiction
   requests are rejected with HTTP 403, not merely hidden in the UI)
3. **Super Admin**: Highest application-level privileges — full user & role
   management, location reference data, security monitoring and audit trail.
   This is an **application** role within the prototype, not a government role.

Every privileged mutation is recorded in the audit trail.

## Key Features

- ✓ Bilingual UI (Bangla/English)
- ✓ Interactive cadastral map with plot selection
- ✓ Multi-factor verification engine
- ✓ Explainable risk assessment
- ✓ Professional report generation
- ✓ Comprehensive audit logging
- ✓ Role-based access control
- ✓ Secure authentication
- ✓ Responsive design
- ✓ Performance optimized

## 🚀 Quick Start

**Want to get started in under 10 minutes?**  
See **[QUICKSTART.md](QUICKSTART.md)** for the fastest setup guide.

**Want comprehensive testing instructions?**  
See **[TESTING_GUIDE.md](TESTING_GUIDE.md)** for detailed test scenarios.

**Want implementation details?**  
See **[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)** for complete feature list.

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+ with PostGIS extension

### Quick Setup (Windows PowerShell)

**Step 1: Database**
```powershell
psql -U postgres
CREATE DATABASE bhoomitech;
\c bhoomitech
CREATE EXTENSION postgis;
\q
```

**Step 2: Configuration**
```powershell
# Copy and edit .env file
Copy-Item .env.example .env
# Update DATABASE_URL, JWT_SECRET, AUTH_SECRET
```

**Step 3: Backend**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head  # Applies the committed schema migrations
python seed.py  # Creates 12 demo scenarios
cd ..
```

**Step 4: Frontend**
```powershell
cd frontend
npm install
"VITE_API_BASE_URL=http://localhost:8000" | Out-File .env.local -Encoding UTF8
cd ..
```

### Running the Application

**Option A: Using Startup Scripts (Recommended)**

Open TWO PowerShell terminals:

Terminal 1:
```powershell
.\start-backend.ps1
```

Terminal 2:
```powershell
.\start-frontend.ps1
```

**Option B: Manual Start**

Terminal 1 - Backend:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

Terminal 2 - Frontend:
```powershell
cd frontend
npm run dev
# Frontend: http://localhost:5173
```

### First Test

1. Open: http://localhost:5173
2. Login: `citizen1@example.com` / `Citizen@2026`
3. Start New Verification
4. Search: Dhaka → Savar → Demo Mouza → RS → 342 → 121
5. View map → Continue → Run Verification
6. Result: Should show **LOW CONCERN** ✅

### Environment Configuration

**Backend (.env in project root):**
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/bhoomitech
JWT_SECRET=your-secure-secret-here
AUTH_SECRET=your-auth-secret-here
CORS_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env.local in frontend/):**
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🎬 Demo / Development Mode (recommended for the hackathon demo)

"Demo/Development Mode" is a built-in scenario selector that opens one of the
12 pre-loaded demonstration parcels in a single click, so the full workflow can
be shown without typing land identifiers manually.

⚠️ **Synthetic demonstration data**: every scenario, owner, khatian, case and
government record served by Demo/Development Mode is synthetic. These are
deterministic fixtures for demonstration only — they are **not** real
government records and must not be treated as such.

**End-to-end demo flow:**

1. **Login** — `citizen1@example.com` / `Citizen@2026`
2. **Citizen Dashboard**
3. **Check Land** (Start New Verification)
4. Open **Demo / Development Mode** and select a **Scenario A–L**
5. **Open Land Details** for the selected parcel
6. **Review the Map** (parcel geometry)
7. **Review Seller Information** (pre-filled from the scenario claim)
8. **Run Verification**
9. **View the Risk Result** (one of LOW_CONCERN, REVIEW_REQUIRED,
   HIGH_ATTENTION, CRITICAL_SIGNAL, INSUFFICIENT_DATA)
10. **Generate Report**
11. **View / Download the PDF**

Each scenario maps to a fixed parcel (BT-PARCEL-000001 … BT-PARCEL-000012) and
a deterministic expected risk level, so the demo repeats identically every run.

## Verification Engine

The system performs **deterministic rule-based checks** (NO AI/ML):

1. **Land Identity**: Validates parcel identifiers
2. **Ownership**: Compares recorded vs. claimed ownership
3. **Mutation**: Reviews mutation status and pending records
4. **Case Signals**: Identifies pending legal cases
5. **Government Status**: Checks khas/government interest
6. **Acquisition**: Reviews acquisition records
7. **Transaction Overlap**: Detects potential double-sale

## 🧪 Demo Scenarios

The system includes **12 pre-configured test scenarios** (Dag 121-132):

All scenarios use: **Dhaka** → **Savar** → **Demo Mouza** → **RS** → **342** → **[Dag Number]**

| Dag | Scenario | Expected Risk Level |
|-----|----------|-------------------|
| 121 | Clean/Normal Transaction | ✅ LOW CONCERN |
| 122 | Ownership Name Mismatch | ⚠️ REVIEW REQUIRED |
| 123 | Mutation Pending | ⚠️ REVIEW REQUIRED |
| 124 | Area/Share Conflict | 🚨 HIGH ATTENTION |
| 125 | Active Legal Case | 🚨 HIGH ATTENTION |
| 126 | Transaction Overlap | 🚨 CRITICAL SIGNAL |
| 127 | Acquisition Proceedings | ⚠️ HIGH ATTENTION |
| 128 | Government/Khas Land | 🚨 CRITICAL SIGNAL |
| 129 | Historical Inconsistency | ℹ️ REVIEW REQUIRED |
| 130 | Multiple Risk Factors | 🚨 CRITICAL SIGNAL |
| 131 | Insufficient Data | ❓ INSUFFICIENT DATA |
| 132 | Critical Combined Issues | 🚨🚨 CRITICAL SIGNAL |

## Risk Levels

- ✓ **LOW CONCERN**: No significant issues detected
- ⚠ **REVIEW REQUIRED**: Minor inconsistencies requiring review
- ! **HIGH ATTENTION**: Significant issues requiring investigation
- × **CRITICAL SIGNAL**: Critical issues requiring immediate attention
- ? **INSUFFICIENT DATA**: Missing data prevents complete verification

## Security Features

- Argon2id password hashing
- JWT-based authentication
- HTTP-only secure cookies
- Rate limiting
- RBAC enforcement
- Object-level authorization
- Audit logging
- Security event tracking
- Input validation
- SQL injection protection
- XSS protection
- CORS configuration

### Account Lockout and Rate Limiting (implemented)

- **Account lockout**: after `LOGIN_MAX_FAILED_ATTEMPTS` (default 5) consecutive
  failed logins, the account is temporarily locked for `LOGIN_LOCKOUT_MINUTES`
  (default 15). The lock is checked before the password, the counter resets on
  successful login, and failure messages are identical for existing and
  non-existing emails (no account enumeration). Locks are recorded as
  high-severity `account_locked` security events.
- **Rate limiting**: an in-memory sliding-window limiter (60 s window, per
  client IP, no external infrastructure) protects the sensitive endpoints:
  login, admin/login, register and forgot-password at
  `RATE_LIMIT_AUTH_PER_MINUTE` (default 10/min); verification check and detail
  at `RATE_LIMIT_VERIFICATION_PER_MINUTE` (default 20/min). Exceeding a limit
  returns HTTP 429 with a `Retry-After` header. Counters are per API process;
  `X-Forwarded-For` is deliberately not trusted (spoofable unless behind a
  trusted proxy).

## Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
vercel deploy
```

### Backend

Deploy using Docker, cloud platforms (AWS/Azure/GCP), or VPS with PostgreSQL + PostGIS.

## Public Administrative Reference Sources

The administrative place names used for realism are drawn from the public
administrative structure of Bangladesh. The following official portals are
listed **for reference only** — BhoomiTech does not scrape, query or mirror
them, and none of their data is bundled with this project:

- National Portal of Bangladesh — [bangladesh.gov.bd](https://bangladesh.gov.bd)
- Ministry of Land — [land.gov.bd](https://land.gov.bd)
- Land Mutation Portal — [mutation.land.gov.bd](https://mutation.land.gov.bd)
- Land Map Portal — [map.land.gov.bd](https://map.land.gov.bd)
- Bhumipedia (Land Knowledge Base) — [bhumipedia.land.gov.bd](https://bhumipedia.land.gov.bd)

All external links open in a new tab (`target="_blank"` with
`rel="noopener noreferrer"`) and are clearly labelled as official government
sources.

## AI-Assisted Development Disclosure

This project was developed with AI-assisted tooling under human direction, review, and testing. In the interest of transparency and in compliance with the LandTech 2026 Hackathon rules:

- **AI Tools Used:** Cursor (AI Code Editor), ChatGPT (for documentation, debugging, and prompt generation).
- **Scope of AI Use:** AI was used for development assistance only — scaffolding, code generation, refactoring, and test authoring.
- **Verification Engine:** The verification engine itself is 100% deterministic and rule-based. No AI, LLM, or ML model is used at runtime for verification, risk scoring, or any decision-making. Results are fully explainable and reproducible.
- **Data Privacy:** No citizen data is sent to any AI service. The application does not call any external AI/LLM API during runtime.
- **Human Review:** All AI-assisted output was reviewed, corrected, and validated by the team, and is covered by the automated test suite. Both student members can fully explain the codebase and logic.

## Demo Instructions (Quick Run)
To test the 12 deterministic scenarios quickly:
1. Login with `citizen1@example.com` / `Citizen@2026`.
2. Go to "Check Land" → Open "Demo / Development Mode".
3. Select any scenario (A to L). The seller claim is pre-filled. 
4. Click "Run Verification" to see the rule-based results and risk score.
5. Click "Generate Report" to download the bilingual PDF.

## Database Reset (Troubleshooting)
If you need to reset the database to its default demo state (e.g., if login fails or scenarios don't load):
```bash
cd backend
python seed.py
## License

Proprietary - BhoomiTech Platform

## Disclaimer

BhoomiTech is a digital due-diligence assistance platform. Results are generated from the available dataset and predefined verification rules. This result does not constitute a legal ownership certificate, government verification, title opinion, or legal advice. Users should conduct appropriate legal and official verification before completing a land transaction.
