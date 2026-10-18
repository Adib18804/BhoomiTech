# BhoomiTech Testing Guide

## Prerequisites

### Required Software:
- ✅ PostgreSQL 14+ with PostGIS extension
- ✅ Python 3.11+
- ✅ Node.js 18+
- ✅ npm or yarn

### Check PostgreSQL and PostGIS:
```powershell
psql --version
# Should show PostgreSQL 14 or higher

psql -U postgres -c "SELECT PostGIS_Version();"
# Should return PostGIS version
```

## Complete Setup Steps

### 1. Database Setup

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bhoomitech;

# Connect to the database
\c bhoomitech

# Enable PostGIS
CREATE EXTENSION postgis;

# Verify PostGIS installation
SELECT PostGIS_Version();
# Should return version info like "3.3 USE_GEOS=1 USE_PROJ=1..."

# Exit psql
\q
```

### 2. Backend Setup

```powershell
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create .env file in PROJECT ROOT (not in backend/)
# Copy from .env.example and update:
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/bhoomitech
# JWT_SECRET=your-secure-random-secret-key
# AUTH_SECRET=another-secure-random-secret-key

# Apply the committed Alembic migrations
alembic upgrade head

# Seed demonstration data (12 scenarios)
python seed.py

# Expected output:
# ✅ Seeding users...
# ✅ Seeding locations...
# ✅ Seeding demo land parcels...
# ✅ Seeding ownership records...
# ✅ Seeding historical records...
# ✅ Seeding mutation records...
# ✅ Seeding case records...
# ✅ Seeding government status...
# ✅ Seeding acquisition records...
# ✅ Seeding transaction records...
# Database seeded successfully!

# Start backend server
python main.py

# Expected output:
# INFO:     Started server process
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. Verify Backend APIs

Open browser: http://localhost:8000/docs

Test these endpoints:
- ✅ POST /api/auth/register
- ✅ POST /api/auth/login
- ✅ GET /api/locations/districts
- ✅ POST /api/land/search
- ✅ GET /api/land/{parcel_id}/geometry
- ✅ POST /api/verification/check

### 4. Frontend Setup

Open a NEW PowerShell terminal:

```powershell
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env.local file in frontend/ folder with:
# VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev

# Expected output:
# VITE v5.1.0  ready in 500 ms
# ➜  Local:   http://localhost:5173/
```

### 5. Verify Frontend

Open browser: http://localhost:5173

Expected:
- ✅ Homepage loads
- ✅ Language switcher (EN/BN) works
- ✅ "Login" and "Register" buttons visible

## Complete Testing Workflow

### Test 1: User Registration & Login

1. **Register New User**:
   - Click "Get Started" → "Register"
   - Fill form:
     - Full Name: Test User
     - Email: test@example.com
     - Phone: 01712345678
     - NID: 1234567890123
     - Password: Test@2026
   - Click "Register"
   - Expected: Success message, redirect to login

2. **Login**:
   - Email: test@example.com (or use pre-seeded: citizen1@example.com)
   - Password: Test@2026 (or Citizen@2026 for pre-seeded)
   - Expected: Redirect to Citizen Dashboard

### Test 2: Land Search

1. **Navigate to Land Search**:
   - From Dashboard, click "Start New Verification"
   - OR navigate to /land-search

2. **Search for Demo Land**:
   - District: Dhaka
   - Upazila: Savar
   - Mouza: Demo Mouza
   - Survey Type: RS
   - Khatian No: 342
   - Dag No: 121 (or 122-132 for different scenarios)
   - Click "Search Land"

3. **Expected Results**:
   - ✅ Land parcel information displayed
   - ✅ Map renders with plot geometry (green polygon)
   - ✅ Map zooms to selected plot
   - ✅ "SYNTHETIC DEMONSTRATION DATA" warning visible
   - ✅ Ownership information shown
   - ✅ Area displayed: 50.00 decimal
   - ✅ "Continue to Verification" button enabled

### Test 3: Verification Flow

1. **Click "Continue to Verification"**

2. **On Seller Information Page**:
   - Review land summary (should match search)
   - See recorded ownership reference
   - Form should be pre-filled with recorded data
   - Modify if testing different scenarios

3. **For Scenario A (Dag 121 - LOW CONCERN)**:
   - Seller Name: Md. Karim Ahmed (keep as is)
   - Claimed Share: 50.00 decimal
   - Transaction Area: 25.00 decimal
   - Click "Run Verification"

4. **Expected Result**:
   - Loading screen: "Running Verification..."
   - Results page displays:
     - ✅ Overall Status: **LOW CONCERN** with green checkmark
     - ✅ Risk Score: 10
     - ✅ Total Checks: 7
     - ✅ Passed Checks: 6-7
     - ✅ Warnings: 0-1
     - ✅ Critical Issues: 0
     - ✅ All verification findings displayed
     - ✅ Recommendations listed
     - ✅ Disclaimer shown

### Test 4: Test All 12 Scenarios

Run verification for each Dag (121-132) with appropriate seller information:

#### Scenario A: Dag 121 - LOW CONCERN ✅
- Seller: Md. Karim Ahmed
- Share: 50.00
- Area: 25.00
- **Expected**: LOW_CONCERN, risk score ~10

#### Scenario B: Dag 122 - OWNERSHIP MISMATCH ⚠️
- Seller: **Wrong Name** (e.g., "Ali Hassan")
- Share: 50.00
- Area: 25.00
- **Expected**: HIGH_ATTENTION or REVIEW_REQUIRED
- Finding: "Potential ownership mismatch"

#### Scenario C: Dag 123 - MUTATION PENDING ⚠️
- Seller: Fatema Begum
- Share: 50.00
- Area: 25.00
- **Expected**: REVIEW_REQUIRED
- Finding: "Mutation application pending"

#### Scenario D: Dag 124 - AREA/SHARE CONFLICT ⚠️
- Seller: Abdul Jabbar
- Share: 25.00 (50% of 50 decimal)
- **Claim full area**: 50.00 decimal (should be 25.00 max)
- **Expected**: HIGH_ATTENTION
- Finding: "Claimed sale area exceeds available share"

#### Scenario E: Dag 125 - CASE SIGNAL 🚨
- Seller: Rahim Mia
- Share: 50.00
- Area: 25.00
- **Expected**: HIGH_ATTENTION
- Finding: "Active legal case found"

#### Scenario F: Dag 126 - TRANSACTION OVERLAP 🚨
- Seller: Shahin Alam
- Share: 50.00
- Area: 30.00
- **Expected**: CRITICAL_SIGNAL
- Finding: "Potential transaction overlap detected"

#### Scenario G: Dag 127 - ACQUISITION SIGNAL ⚠️
- Seller: Nasrin Akter
- Share: 50.00
- Area: 25.00
- **Expected**: HIGH_ATTENTION
- Finding: "Land acquisition proceedings detected"

#### Scenario H: Dag 128 - GOVERNMENT/KHAS 🚨
- Seller: Kamrul Islam
- Share: 50.00
- Area: 25.00
- **Expected**: CRITICAL_SIGNAL
- Finding: "Government interest or khas land detected"

#### Scenario I: Dag 129 - HISTORICAL TRANSITION ℹ️
- Seller: Habibur Rahman
- Share: 50.00
- Area: 25.00
- **Expected**: REVIEW_REQUIRED
- Finding: "Historical record transitions require review"

#### Scenario J: Dag 130 - MULTIPLE RISKS 🚨
- Seller: Jamal Uddin
- Share: 50.00
- Area: 25.00
- **Expected**: CRITICAL_SIGNAL (multiple issues)
- Multiple findings from different checks

#### Scenario K: Dag 131 - INSUFFICIENT DATA ❓
- Seller: Unknown Owner
- Share: 50.00
- Area: 25.00
- **Expected**: INSUFFICIENT_DATA
- Finding: "Insufficient data for comprehensive verification"

#### Scenario L: Dag 132 - CRITICAL COMBINED 🚨🚨
- Seller: Troubled Parcel
- Share: 50.00
- Area: 25.00
- **Expected**: CRITICAL_SIGNAL (highest risk)
- Multiple critical findings

## Verification Checks Breakdown

Each verification runs these checks:

1. **Land Identity Check** ✓
   - Confirms parcel exists
   - Validates parcel ID

2. **Ownership Verification** 👤
   - Compares seller name vs recorded owner
   - Checks if names match

3. **Mutation Status Check** 📝
   - Reviews mutation records
   - Flags pending/rejected mutations

4. **Legal Case Check** ⚖️
   - Searches for active cases
   - Identifies legal disputes

5. **Government Status Check** 🏛️
   - Checks for khas land
   - Identifies government interest

6. **Acquisition Check** 🏗️
   - Detects acquisition proceedings
   - Flags proposed/notified status

7. **Transaction Overlap Check** 🔄
   - Calculates total transaction area
   - Detects potential double-sales

## Expected Behaviors

### ✅ Success Indicators:
- Green checkmarks for passed checks
- Positive findings clearly marked
- Low risk score (0-30)
- "LOW CONCERN" status

### ⚠️ Warning Indicators:
- Yellow warnings for review items
- Medium risk score (31-60)
- "REVIEW REQUIRED" status
- Clear explanations provided

### 🚨 Critical Indicators:
- Red alerts for serious issues
- High risk score (61-100)
- "HIGH ATTENTION" or "CRITICAL SIGNAL" status
- Detailed recommendations

### ❓ Insufficient Data:
- Gray indicators
- "INSUFFICIENT DATA" status
- Recommendation to gather more information

## UI/UX Verification

### Check these UI elements:

1. **Accessibility**:
   - ✅ Icons + Text + Color (not color alone)
   - ✅ Clear visual hierarchy
   - ✅ Readable font sizes
   - ✅ High contrast

2. **Responsive Design**:
   - ✅ Works on desktop (1920x1080)
   - ✅ Works on tablet (768x1024)
   - ✅ Works on mobile (375x667)

3. **Bilingual Support**:
   - ✅ Language switcher works
   - ✅ English translations complete
   - ✅ Bengali translations (partial)
   - ✅ Font switches correctly

4. **Professional Design**:
   - ✅ Government-inspired green theme
   - ✅ Clean white backgrounds
   - ✅ Professional cards and layouts
   - ✅ Clear step indicators

5. **Map Display**:
   - ✅ OpenStreetMap base layer loads
   - ✅ Plot geometry renders (green polygon)
   - ✅ Map controls work (zoom in/out)
   - ✅ Auto-fit to plot works
   - ✅ "SYNTHETIC DEMONSTRATION DATA" label visible

## Common Issues & Solutions

### Issue: "PostGIS extension not found"
**Solution**: 
```sql
psql -U postgres -d bhoomitech
CREATE EXTENSION postgis;
```

### Issue: Backend won't start - "Module not found"
**Solution**:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Issue: Frontend won't start - Dependencies missing
**Solution**:
```powershell
cd frontend
npm install
```

### Issue: Map not rendering
**Solution**:
1. Check browser console for errors
2. Verify `react-leaflet` and `leaflet` installed
3. Import Leaflet CSS in component
4. Check geometry API returns valid GeoJSON

### Issue: "401 Unauthorized" errors
**Solution**:
1. Ensure you're logged in
2. Check token in localStorage
3. Verify backend is running
4. Check CORS configuration

### Issue: Verification fails with 500 error
**Solution**:
1. Check backend console logs
2. Verify all seed data loaded correctly
3. Ensure parcel_id exists
4. Check database connection

## Performance Benchmarks

Expected response times:
- Land search: < 500ms
- Geometry fetch: < 200ms
- Verification run: < 1000ms
- Map render: < 500ms

## Security Checks

Verify these security features:

1. ✅ Passwords hashed (Argon2id)
2. ✅ JWT authentication working
3. ✅ Protected routes redirect to login
4. ✅ Users can only access own verifications
5. ✅ Admin routes protected by role
6. ✅ SQL injection protection (ORM)
7. ✅ CORS configured correctly

## Final Verification Checklist

Before considering implementation complete:

- [ ] Database created with PostGIS
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] User can register
- [ ] User can login
- [ ] Land search works for all 12 scenarios
- [ ] Map renders correctly for each scenario
- [ ] Verification runs successfully for all scenarios
- [ ] Risk levels calculated correctly
- [ ] All findings display with explanations
- [ ] Recommendations provided
- [ ] Disclaimer shown
- [ ] Language switcher works
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Responsive on mobile/tablet/desktop

## Demo Presentation Flow

For demo/presentation purposes:

1. **Introduction** (2 min):
   - Explain BhoomiTech purpose
   - Emphasize synthetic data for prototype
   - Highlight NO AI/ML - pure deterministic rules

2. **Show Low Concern** (2 min):
   - Search Dag 121
   - Show map
   - Run verification
   - Show green result

3. **Show High Risk** (2 min):
   - Search Dag 132 (Critical Combined)
   - Show multiple red findings
   - Explain recommendations

4. **Highlight Features** (2 min):
   - Bilingual support
   - Map visualization
   - Explainable AI (deterministic rules)
   - Professional design

5. **Q&A** (2 min)

**Total: 10 minutes**

## Next Steps

After successful testing:

1. ✅ Report generation (PDF/HTML)
2. ✅ Verification history page
3. ✅ Admin dashboard features
4. ✅ Bengali translations for findings
5. ✅ Performance optimization
6. ✅ Export functionality
7. ✅ Email notifications
8. ✅ User verification history
9. ✅ Neighboring plots on map
10. ✅ Advanced filtering and search

---

**Implementation Status**: Phases 1-5 Complete ✅
**Ready for**: Demo, Testing, User Feedback, Hackathon Submission
