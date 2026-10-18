# BhoomiTech Setup Guide

Complete setup instructions for the BhoomiTech Digital Land Due-Diligence Platform.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/))
- **PostgreSQL** 14+ with PostGIS extension ([Download](https://www.postgresql.org/))
- **Git** ([Download](https://git-scm.com/))

## Database Setup

### 1. Install PostgreSQL and PostGIS

```bash
# Windows (using installer from postgresql.org)
# Download and install PostgreSQL 14+ with Stack Builder
# Use Stack Builder to install PostGIS extension

# Verify installation
psql --version
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bhoomitech;

# Connect to the database
\c bhoomitech

# Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

# Verify PostGIS
SELECT PostGIS_Version();

# Exit
\q
```

### 3. Create Database User (Optional but Recommended)

```sql
CREATE USER bhoomitech_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE bhoomitech TO bhoomitech_user;
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Verify activation
which python  # Should show venv path
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
# Copy example environment file
copy .env.example ..\.env

# Edit .env file and configure:
# - DATABASE_URL=postgresql://postgres:your_password@localhost:5432/bhoomitech
# - JWT_SECRET=<generate secure random string>
# - AUTH_SECRET=<generate another secure random string>
# - CORS_ORIGINS=http://localhost:5173
```

### 5. Initialize Database

```bash
# Apply the committed migrations (do NOT run `alembic revision` on a fresh clone —
# the schema migrations are already committed and `--autogenerate` would create a
# spurious empty revision).
alembic upgrade head
```

### 6. Seed Synthetic Data

```bash
python seed.py
```

This will create:
- Super Admin: `superadmin@bhoomitech.example` / `SuperAdmin@2026`
- Admin: `admin1@bhoomitech.example` / `Admin@2026`
- Citizen: `citizen1@example.com` / `Citizen@2026`
- 5 Districts, 5+ Upazilas, 3+ Mouzas
- 50+ Land Parcels with deterministic geometry
- Comprehensive synthetic demonstration data

### 7. Run Backend Server

```bash
# Development server with auto-reload
python main.py

# Alternative using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy example environment file
copy .env.example .env.local

# Edit .env.local:
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Add Logo Files

**IMPORTANT**: Place your BhoomiTech logo files in `frontend/public/`:
- `logo.svg` (primary, vector format)
- `logo.png` (fallback, PNG format)

A placeholder logo has been created. Replace with your actual logo maintaining similar dimensions.

### 5. Generate Favicons

Create favicon files from your logo:
- `favicon.ico` (16x16, 32x32, 48x48 multi-size)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180x180)

Use online tools like [RealFaviconGenerator](https://realfavicongenerator.net/) or [Favicon.io](https://favicon.io/)

### 6. Run Frontend Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## Testing the Application

### 1. Access the Application

Open your browser and navigate to: `http://localhost:5173`

### 2. Test User Registration

1. Click "Register"
2. Fill in the form
3. Select language (English/Bengali)
4. Create account

### 3. Test Citizen Login

Use one of the seeded accounts:
- Email: `citizen1@example.com`
- Password: `Citizen@2026`

### 4. Test Admin Login

1. Navigate to `/admin/login`
2. Use admin credentials:
   - Email: `admin1@bhoomitech.example`
   - Password: `Admin@2026`

### 5. Test Super Admin Login

1. Navigate to `/admin/login`
2. Use super admin credentials:
   - Email: `superadmin@bhoomitech.example`
   - Password: `SuperAdmin@2026`

## Development Workflow

### Backend Development

```bash
# Activate virtual environment
cd backend
.\venv\Scripts\Activate.ps1

# Run with auto-reload
python main.py

# Create new migration after model changes
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

### Frontend Development

```bash
cd frontend

# Development server
npm run dev

# Type checking
npm run build  # TypeScript compilation + Vite build

# Lint code
npm run lint
```

## Building for Production

### Backend

```bash
# Install production dependencies
pip install -r requirements.txt

# Set production environment variables
# DATABASE_URL should point to production database
# Set secure JWT_SECRET and AUTH_SECRET

# Run with production server (Gunicorn recommended)
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend

```bash
cd frontend

# Build for production
npm run build

# Output will be in dist/ directory
# Deploy dist/ directory to:
# - Vercel (recommended)
# - Netlify
# - Any static hosting service
```

### Deployment to Vercel (Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel deploy --prod
```

Configure environment variables in Vercel dashboard:
- `VITE_API_BASE_URL=https://your-backend-url.com`

## Troubleshooting

### Database Connection Error

```
Error: could not connect to server
```

**Solution**: Ensure PostgreSQL is running and credentials are correct in `.env`

### PostGIS Not Found

```
ERROR:  extension "postgis" is not available
```

**Solution**: Install PostGIS extension using Stack Builder or package manager

### CORS Error in Frontend

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Ensure `CORS_ORIGINS` in backend `.env` includes frontend URL

### Module Not Found (Frontend)

```
Cannot find module 'react' or its corresponding type declarations
```

**Solution**: Delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Python Package Conflicts

```
ERROR: pip's dependency resolver does not currently take into account all the packages
```

**Solution**: Create fresh virtual environment:
```bash
rm -rf venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Security Checklist for Production

- [ ] Change all default passwords
- [ ] Generate secure random `JWT_SECRET` and `AUTH_SECRET`
- [ ] Use environment variables, never commit secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Configure logging and monitoring
- [ ] Review and test authentication flows
- [ ] Audit security events regularly
- [ ] Keep dependencies updated

## Project Structure Reference

```
BhoomiTech/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core configuration
│   │   ├── db/           # Database session
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   ├── alembic/          # Database migrations
│   ├── main.py           # FastAPI application
│   ├── seed.py           # Data seeding script
│   └── requirements.txt  # Python dependencies
│
├── frontend/
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── i18n/         # Translations
│   │   ├── utils/        # Utilities
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   ├── index.html        # HTML template
│   └── package.json      # Node dependencies
│
├── .env                  # Environment configuration
├── README.md             # Project overview
└── SETUP.md              # This file
```

## Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Documentation**: https://react.dev/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **PostGIS Documentation**: https://postgis.net/documentation/
- **Tailwind CSS**: https://tailwindcss.com/docs

## Support

For issues or questions:
1. Check this setup guide
2. Review error messages carefully
3. Check browser console (F12) for frontend errors
4. Check backend terminal for API errors
5. Verify database connection and data

## Next Steps

All core features listed below are already implemented and working in this
repository; the remaining items are optional future enhancements.

Implemented and working:
1. ✓ Verification engine (10 deterministic, rule-based checks — no AI/ML)
2. ✓ Map component (React-Leaflet + PostGIS GeoJSON)
3. ✓ Report generation (bilingual English/Bengali PDF)
4. ✓ Citizen dashboard
5. ✓ Admin dashboard
6. ✓ Super admin dashboard
7. ✓ Demo scenario selector ("Demo/Development Mode", Scenarios A–L)
8. ✓ Bilingual UI translations (English/বাংলা)

Optional future enhancements (not required for the demo):
- ⚠ Real government data integration
- ⚠ Verification history page
- ⚠ Email notifications
- ⚠ Performance optimization
- ⚠ Mobile app

The platform is complete for demonstration and pre-purchase due-diligence
review; it is an informational tool using synthetic demonstration data.
