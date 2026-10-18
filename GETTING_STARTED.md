# 🚀 Getting Started with BhoomiTech

Welcome! This guide will get you from zero to a working BhoomiTech system in **under 15 minutes**.

---

## ⚡ Super Quick Start (5 Steps)

### 1️⃣ Setup Database (2 minutes)

```powershell
# Open PostgreSQL command line
psql -U postgres

# Run these 4 commands:
CREATE DATABASE bhoomitech;
\c bhoomitech
CREATE EXTENSION postgis;
\q
```

✅ **Checkpoint**: PostgreSQL database 'bhoomitech' created with PostGIS extension

---

### 2️⃣ Configure Environment (1 minute)

```powershell
# In project root, create .env file from example
Copy-Item .env.example .env
```

Then edit `.env` and change ONLY these lines:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/bhoomitech
JWT_SECRET=any-random-string-you-want-here
AUTH_SECRET=another-random-string-here
```

✅ **Checkpoint**: `.env` file created with your PostgreSQL password

---

### 3️⃣ Setup Backend (5 minutes)

```powershell
# Navigate to backend
cd backend

# Create Python virtual environment
python -m venv venv

# Activate it (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install all dependencies (this takes ~2-3 minutes)
pip install -r requirements.txt

# Create database tables (apply the committed migrations)
alembic upgrade head

# Load demo data (12 scenarios)
python seed.py

# You should see: "Database seeded successfully!"

# Go back to project root
cd ..
```

✅ **Checkpoint**: Backend dependencies installed, database migrated, demo data loaded

---

### 4️⃣ Setup Frontend (3 minutes)

```powershell
# Navigate to frontend
cd frontend

# Install dependencies (this takes ~1-2 minutes)
npm install

# Create frontend environment file
"VITE_API_BASE_URL=http://localhost:8000" | Out-File .env.local -Encoding UTF8

# Go back to project root
cd ..
```

✅ **Checkpoint**: Frontend dependencies installed, environment configured

---

### 5️⃣ Start the Application (1 minute)

Open **TWO** PowerShell terminals side-by-side:

**Terminal 1 - Backend:**
```powershell
.\start-backend.ps1
```
Wait for: `"Uvicorn running on http://0.0.0.0:8000"`

**Terminal 2 - Frontend:**
```powershell
.\start-frontend.ps1
```
Wait for: `"Local: http://localhost:5173/"`

✅ **Checkpoint**: Both servers running without errors

---

## 🧪 First Test (2 minutes)

### Test the Complete Workflow:

1. **Open Browser**: http://localhost:5173

2. **Login with Demo Account**:
   - Email: `citizen1@example.com`
   - Password: `Citizen@2026`
   - Click "Login"

3. **Start Verification**:
   - Click "Start New Verification" button

4. **Search for Land**:
   - District: **Dhaka**
   - Upazila: **Savar**
   - Mouza: **Demo Mouza**
   - Survey Type: **RS**
   - Khatian: **342**
   - Dag: **121**
   - Click "Search Land"

5. **View the Map**:
   - You should see a green polygon on the map
   - Map should zoom to the selected plot
   - Land information displayed below map

6. **Continue to Verification**:
   - Click "Continue to Verification" button

7. **Run Verification**:
   - Form should be pre-filled with recorded owner information
   - Click "Run Verification" button

8. **View Results**:
   - Should show **LOW CONCERN** with green checkmark ✅
   - Risk Score: 10
   - All checks passed
   - No critical issues

✅ **SUCCESS!** If you see this, BhoomiTech is fully working!

---

## 🎯 What Just Happened?

You just completed a full land verification:

1. ✅ **Logged in** as a citizen user
2. ✅ **Searched** for a land parcel using administrative identifiers
3. ✅ **Viewed** the plot on an interactive map
4. ✅ **Entered** seller information
5. ✅ **Ran** deterministic verification with 7 checks
6. ✅ **Received** risk assessment with detailed findings

This is the **complete BhoomiTech workflow** in action!

---

## 🧪 Try More Scenarios

Now that Dag 121 works, try the other 11 scenarios:

Keep everything the same (Dhaka → Savar → Demo Mouza → RS → 342) but change the **Dag number**:

| Dag | What to Expect |
|-----|----------------|
| **121** | ✅ LOW CONCERN - Everything clean |
| **122** | ⚠️ Name mismatch warning |
| **123** | ⚠️ Mutation pending warning |
| **124** | 🚨 Area/share conflict alert |
| **125** | 🚨 Legal case detected |
| **126** | 🚨 Transaction overlap warning |
| **127** | ⚠️ Acquisition proceedings |
| **128** | 🚨 Government/khas land alert |
| **129** | ℹ️ Historical inconsistency |
| **130** | 🚨 Multiple risk factors |
| **131** | ❓ Insufficient data |
| **132** | 🚨🚨 Critical combined issues |

Each scenario demonstrates different verification outcomes!

---

## 📚 Next Steps

### Learn More:

1. **Quick Reference**: Read `PROJECT_STATUS.txt` for overview
2. **Detailed Testing**: Read `TESTING_GUIDE.md` for all scenarios
3. **Features List**: Read `IMPLEMENTATION_STATUS.md` for complete features
4. **Implementation**: Read `IMPLEMENTATION_COMPLETE.md` for technical details

### Explore Features:

1. **Try Different Users**:
   - Citizen: `citizen1@example.com` / `Citizen@2026`
   - Admin: `admin1@bhoomitech.example` / `Admin@2026`
   - Super Admin: `superadmin@bhoomitech.example` / `SuperAdmin@2026`

2. **Test Bilingual Support**:
   - Click language switcher in header
   - Switch between English and বাংলা

3. **Test Responsive Design**:
   - Resize browser window
   - Try on mobile, tablet, desktop sizes

4. **Explore the Map**:
   - Zoom in/out
   - Pan around
   - See how plot highlights

5. **Review Verification Findings**:
   - Read explanations carefully
   - Check recommendations
   - Notice cautious language (never "fraud confirmed")

### Customize:

1. **Modify Demo Data**:
   - Edit `backend/app/services/seed_data.py`
   - Add more scenarios
   - Change owner names, areas, etc.
   - Re-run: `python seed.py`

2. **Adjust Verification Rules**:
   - Edit `backend/app/services/verification_engine.py`
   - Modify risk scoring
   - Add new checks
   - Change thresholds

3. **Customize UI**:
   - Edit components in `frontend/src/components/`
   - Modify pages in `frontend/src/pages/`
   - Adjust colors in `frontend/src/index.css`

---

## 🆘 Troubleshooting

### Issue: "Database does not exist"
**Solution:**
```powershell
psql -U postgres -c "CREATE DATABASE bhoomitech;"
```

### Issue: "PostGIS extension not found"
**Solution:**
```powershell
psql -U postgres -d bhoomitech -c "CREATE EXTENSION postgis;"
```

### Issue: Backend won't start
**Solution:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Issue: Frontend won't start
**Solution:**
```powershell
cd frontend
npm install
```

### Issue: Map not showing
**Possible causes:**
1. Check browser console (F12) for errors
2. Verify backend is running on port 8000
3. Check `.env.local` has correct API URL
4. Try different browser

### Issue: "401 Unauthorized"
**Solution:**
1. Logout and login again
2. Clear browser localStorage (F12 → Application → Storage → Clear)
3. Restart backend server

### Issue: Can't find land (Dag 121-132)
**Solution:**
1. Make sure you ran `python seed.py`
2. Check backend logs for errors
3. Verify database has data:
   ```sql
   psql -U postgres -d bhoomitech -c "SELECT COUNT(*) FROM dags;"
   ```

---

## 🎓 Understanding the System

### Backend Architecture:
```
backend/
├── main.py              ← FastAPI app entry point
├── app/
│   ├── api/            ← REST API endpoints
│   ├── models/         ← Database models
│   ├── schemas/        ← Pydantic schemas
│   ├── services/       ← Business logic
│   └── core/           ← Configuration, security
```

### Frontend Architecture:
```
frontend/src/
├── pages/              ← Page components
├── components/         ← Reusable UI components
├── services/           ← API integration
├── i18n/              ← Translations (EN/বাংলা)
└── utils/             ← Helper functions
```

### Key Files to Understand:

**Backend:**
- `app/services/verification_engine.py` - Core verification logic
- `app/api/verification.py` - Verification API endpoint
- `app/services/seed_data.py` - Demo data creation

**Frontend:**
- `pages/citizen/VerificationResultPage.tsx` - Results display
- `pages/citizen/LandSearchPage.tsx` - Search & map
- `services/verificationService.ts` - API integration

---

## 💡 Pro Tips

1. **Keep Both Servers Running**: Don't close backend while using frontend
2. **Check Backend Logs**: Terminal 1 shows useful debug information
3. **Use Browser DevTools**: F12 to see network requests and errors
4. **Test Clean First**: Always verify Dag 121 works before testing others
5. **Read Findings Carefully**: Each finding has explanation and recommendation
6. **Note the Language**: System never claims "fraud" - uses "potential", "signal"
7. **Check Disclaimers**: Important legal disclaimers always shown

---

## 🎉 You're Ready!

If you can:
- ✅ Login successfully
- ✅ Search for land (Dag 121)
- ✅ See green plot on map
- ✅ Run verification
- ✅ See LOW CONCERN result

**Congratulations! BhoomiTech is fully operational!** 🎊

---

## 📖 What's Next?

### For Users:
- Test all 12 scenarios (Dag 121-132)
- Try different user roles
- Test bilingual support
- Try on mobile devices

### For Developers:
- Review code architecture
- Add new verification checks
- Customize UI components
- Add new features

### For Deployment:
- Set up production database
- Configure cloud hosting
- Set up SSL certificates
- Configure domain

---

## 🚀 Ready to Deploy?

When you're ready for production:

1. **Read Deployment Docs**: Check README.md deployment section
2. **Secure Configuration**: Update all secrets and keys
3. **Production Database**: Set up managed PostgreSQL with PostGIS
4. **Deploy Backend**: Use Docker, AWS, Azure, or DigitalOcean
5. **Deploy Frontend**: Use Vercel, Netlify, or S3
6. **Configure Domain**: Set up custom domain and SSL
7. **Monitor**: Set up logging and monitoring

---

## ❓ Need Help?

- **Setup Issues**: Re-read this guide step-by-step
- **Testing Help**: Check `TESTING_GUIDE.md`
- **Technical Details**: Check `IMPLEMENTATION_STATUS.md`
- **Feature Questions**: Check `IMPLEMENTATION_COMPLETE.md`
- **Code Questions**: Check inline comments in source files

---

## 🎯 Success Checklist

Before moving forward, verify:

- [x] PostgreSQL database created with PostGIS
- [x] Backend starts without errors on port 8000
- [x] Frontend starts without errors on port 5173
- [x] Can access http://localhost:5173
- [x] Can login with demo account
- [x] Can search for land (Dag 121)
- [x] Map renders with green polygon
- [x] Can run verification
- [x] Results show LOW CONCERN
- [x] No console errors in browser (F12)

**All checked?** You're all set! 🎉

---

**Enjoy using BhoomiTech!** 🚀

For questions, issues, or enhancements, check the documentation or modify the code to suit your needs.

**Happy Verifying!** ✨
