# BhoomiTech Quick Start Guide

Get BhoomiTech running in under 10 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ PostgreSQL 14+ installed
- ✅ PostGIS extension available
- ✅ Python 3.11+ installed
- ✅ Node.js 18+ installed

## 🚀 Quick Setup (First Time Only)

### Step 1: Database Setup (2 minutes)

```powershell
# Open PostgreSQL
psql -U postgres

# Run these commands:
CREATE DATABASE bhoomitech;
\c bhoomitech
CREATE EXTENSION postgis;
SELECT PostGIS_Version();  # Verify installation
\q
```

### Step 2: Configuration (1 minute)

```powershell
# In project root, create .env file:
Copy-Item .env.example .env

# Edit .env and update:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/bhoomitech
# JWT_SECRET=your-random-secret-key-here
# AUTH_SECRET=another-random-secret-key-here
```

### Step 3: Backend Setup (3 minutes)

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Apply the committed database migrations
alembic upgrade head

# Seed demonstration data
python seed.py
# You should see: "Database seeded successfully!"

# Go back to project root
cd ..
```

### Step 4: Frontend Setup (2 minutes)

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local file:
"VITE_API_BASE_URL=http://localhost:8000" | Out-File .env.local -Encoding UTF8

# Go back to project root
cd ..
```

## 🎬 Starting the Application (Every Time)

### Option A: Using Startup Scripts (Recommended)

Open **TWO** PowerShell terminals:

**Terminal 1 - Backend:**
```powershell
.\start-backend.ps1
```
Wait for: "Uvicorn running on http://0.0.0.0:8000"

**Terminal 2 - Frontend:**
```powershell
.\start-frontend.ps1
```
Wait for: "Local: http://localhost:5173/"

### Option B: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

## 🧪 Quick Test (2 minutes)

1. **Open Browser**: http://localhost:5173

2. **Login with Demo Account**:
   - Email: `citizen1@example.com`
   - Password: `Citizen@2026`

3. **Test Verification**:
   - Click "Start New Verification"
   - Select: Dhaka → Savar → Demo Mouza
   - Survey: RS, Khatian: 342, Dag: **121**
   - Click "Search Land"
   - View map with plot
   - Click "Continue to Verification"
   - Click "Run Verification" (form should be pre-filled)
   - View results: Should show **LOW CONCERN** ✅

## 📋 Demo Scenarios to Test

All scenarios use the same location:
- District: **Dhaka**
- Upazila: **Savar**
- Mouza: **Demo Mouza**
- Survey Type: **RS**
- Khatian: **342**
- **Change only the Dag number** (121-132)

Quick reference:
- **Dag 121**: ✅ LOW CONCERN (everything clean)
- **Dag 122**: ⚠️ OWNERSHIP MISMATCH (wrong seller)
- **Dag 123**: ⚠️ MUTATION PENDING
- **Dag 124**: ⚠️ AREA/SHARE CONFLICT
- **Dag 125**: 🚨 CASE SIGNAL (legal dispute)
- **Dag 126**: 🚨 TRANSACTION OVERLAP
- **Dag 127**: ⚠️ ACQUISITION SIGNAL
- **Dag 128**: 🚨 GOVERNMENT/KHAS LAND
- **Dag 129**: ℹ️ HISTORICAL TRANSITION
- **Dag 130**: 🚨 MULTIPLE RISKS
- **Dag 131**: ❓ INSUFFICIENT DATA
- **Dag 132**: 🚨🚨 CRITICAL COMBINED (worst case)

## 🎬 Demo / Development Mode (hackathon demo flow)

Instead of typing land identifiers, use the built-in **Demo/Development Mode**
selector on the "Check Land" page: it lists **Scenario A–L** and opens the
matching demonstration parcel in one click, pre-filling the seller claim.

⚠️ **Synthetic demonstration data only.** Every scenario, owner, khatian, case
and government record is synthetic and deterministic, generated for
demonstration. These are **not** real government records and carry no legal
weight.

**End-to-end demo flow:**

Login → Citizen Dashboard → Check Land → **Demo/Development Mode** → select a
**Scenario A–L** → Open Land Details → Review Map → Review Seller Information
→ Run Verification → View Risk Result → Generate Report → View/Download PDF.

Scenarios produce fixed, deterministic risk levels (e.g. Scenario A =
LOW_CONCERN, Scenario F = CRITICAL_SIGNAL, Scenario K = INSUFFICIENT_DATA), so
the demo behaves identically on every run.

## 🔍 Verification Checklist

✅ **Backend Running**: http://localhost:8000/docs shows API docs

✅ **Frontend Running**: http://localhost:5173 shows homepage

✅ **Can Login**: Demo account works

✅ **Can Search**: Land search returns results

✅ **Map Renders**: Green plot polygon visible

✅ **Verification Works**: Results show risk level with findings

✅ **No Errors**: Check browser console (F12)

## 🆘 Common Issues

### "Database does not exist"
```powershell
psql -U postgres -c "CREATE DATABASE bhoomitech;"
```

### "PostGIS extension not found"
```powershell
psql -U postgres -d bhoomitech -c "CREATE EXTENSION postgis;"
```

### "Module not found" (Backend)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### "Dependencies error" (Frontend)
```powershell
cd frontend
rm -r node_modules
npm install
```

### "Cannot connect to backend" (Frontend)
Check `.env.local` contains:
```
VITE_API_BASE_URL=http://localhost:8000
```

### "401 Unauthorized"
- Logout and login again
- Clear browser localStorage
- Restart backend

### Map not showing
- Check browser console for errors
- Verify geometry API works: http://localhost:8000/docs
- Test: GET `/api/land/{parcel_id}/geometry`

## 📊 What to Expect

### ✅ Successful Setup Shows:
- Backend: API docs at `/docs`
- Frontend: Professional homepage with logo
- Login: Redirects to Citizen Dashboard
- Search: Returns land parcel with map
- Verification: Shows risk level with detailed findings
- Map: Green polygon with plot boundaries

### 🎨 UI Should Have:
- Government-inspired green theme
- Clean white backgrounds
- Professional cards and layouts
- Language switcher (EN/বাংলা)
- Responsive design
- No console errors

## 📖 Next Steps

After successful quick start:

1. **Review**: Read `IMPLEMENTATION_STATUS.md` for detailed features
2. **Test All**: Try all 12 demo scenarios (Dag 121-132)
3. **Explore**: Check `TESTING_GUIDE.md` for comprehensive tests
4. **Customize**: Modify data, add features, enhance UI
5. **Deploy**: Prepare for production deployment

## 🎯 5-Minute Demo Script

Perfect for presentations:

1. **Show Homepage** (15 sec)
   - "This is BhoomiTech - Bangladesh land verification platform"

2. **Login** (15 sec)
   - Use demo account

3. **Search Clean Land** (30 sec)
   - Dhaka → Savar → RS → 342 → **121**
   - Show map rendering

4. **Run Verification - Good Result** (45 sec)
   - Show LOW CONCERN result
   - Explain deterministic checks

5. **Search Risky Land** (45 sec)
   - Change to Dag **132**
   - Show CRITICAL result
   - Show multiple red findings

6. **Highlight Features** (30 sec)
   - Bilingual support
   - Map visualization
   - Explainable findings
   - NO AI - pure rules

7. **Wrap Up** (30 sec)
   - Mention synthetic data
   - Emphasize due-diligence tool
   - Show disclaimer

**Total: 4 minutes + 1 minute Q&A**

## 💡 Pro Tips

1. **Keep Both Servers Running**: Don't stop backend while using frontend
2. **Use Demo Account**: `citizen1@example.com` / `Citizen@2026`
3. **Test Clean First**: Always start with Dag 121 to verify setup
4. **Check Logs**: Backend terminal shows useful debugging info
5. **Browser DevTools**: F12 to see network requests and errors
6. **Language Switch**: Test EN/বাংলা to show bilingual support
7. **Mobile Test**: Resize browser to test responsive design

## 🎓 Learning the System

Recommended order:
1. ✅ Run quick test with Dag 121
2. ✅ Try Dag 132 to see critical findings
3. ✅ Read verification findings carefully
4. ✅ Check database seed data in `backend/app/services/seed_data.py`
5. ✅ Review verification logic in `backend/app/services/verification_engine.py`
6. ✅ Explore frontend components in `frontend/src/`

## 🚀 Ready to Go!

If you can:
- ✅ Login successfully
- ✅ Search land (Dag 121)
- ✅ See map with plot
- ✅ Run verification
- ✅ See LOW CONCERN result

**You're all set!** 🎉

The complete BhoomiTech system is working correctly.

---

**Need Help?**
- Check `TESTING_GUIDE.md` for detailed testing
- Review `IMPLEMENTATION_STATUS.md` for features
- Check backend logs for errors
- Check browser console (F12) for frontend errors

**Ready for Production?**
- Add real land data
- Configure production database
- Set up proper authentication
- Deploy to cloud (AWS/Azure/DigitalOcean)
- Add SSL certificates
- Configure domain
