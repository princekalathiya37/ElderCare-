# ElderCare+ Setup for Windows

Since you're on Windows, here's the simplified setup:

## ✅ Step 1: Verify Requirements (Already Done!)

```
✓ Node.js: v22.19.0
✓ npm: 10.9.3
✓ Git: (assumed installed)
```

## 📦 Step 2: Install Dependencies

### Frontend Dependencies
```powershell
npm install
```

### Backend Dependencies
```powershell
cd backend
npm install
cd ..
```

## ⚙️ Step 3: Configure Environment

### Create backend/.env
```powershell
# Copy the template
cp backend\.env.example backend\.env

# Edit it with your credentials
# Use Notepad or any text editor
notepad backend\.env
```

**Required fields to update:**
```
MONGO_URI=mongodb://localhost:27017/eldercare
# OR use MongoDB Atlas: mongodb+srv://user:pass@...

JWT_SECRET=your_32_character_secret_key_here_minimum

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your-firebase-email@...

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Create .env.local
```powershell
# Frontend environment
notepad .env.local
```

**Add:**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_key
```

## 🚀 Step 4: Start Development

### Terminal 1: Start Backend
```powershell
cd backend
npm run dev
# Should see: Server running on port 5000
```

### Terminal 2: Start Frontend
```powershell
# In a new PowerShell window
npm run dev
# Should see: http://localhost:5173
```

## ✅ Step 5: Verify Everything Works

### Open in Browser
```
Frontend: http://localhost:5173
Backend API: http://localhost:5000/health
```

### Run Tests
```powershell
bash run-e2e-tests.sh
# All tests should pass
```

---

## 🎯 What Each Script Does

| Script | Purpose | Command |
|--------|---------|---------|
| `run-e2e-tests.sh` | Test all 6 features | `bash run-e2e-tests.sh` |
| `run-tests.sh` | API tests | `bash run-tests.sh` |
| `setup-dev.sh` | Dev environment | `bash setup-dev.sh` |

## ❌ Troubleshooting

### "Port 5000 already in use"
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill it (replace PID)
taskkill /PID <PID> /F
```

### "Cannot find module"
```powershell
# Clear cache and reinstall
rm -Recurse node_modules, backend/node_modules
npm install
cd backend && npm install && cd ..
```

### "MongoDB connection refused"
```powershell
# Start MongoDB locally (if installed)
# OR use MongoDB Atlas connection string in .env
```

### "Firebase credentials error"
```powershell
# Verify FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY are set correctly
# Check no quotes or escaping issues in .env
```

## 📖 Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Configure `.env` files
3. ✅ Start backend (`cd backend && npm run dev`)
4. ✅ Start frontend (`npm run dev`)
5. ✅ Open http://localhost:5173
6. ✅ Run tests (`bash run-e2e-tests.sh`)
7. ✅ Deploy to production (see DEPLOYMENT_PLATFORMS.md)

## 🎯 After Setup Works Locally

### Deploy to Heroku
```powershell
heroku login
heroku create my-app
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

### Deploy to AWS
- See DEPLOYMENT_PLATFORMS.md AWS section

### Deploy to Railway
- Connect GitHub repo
- Set env variables
- Auto-deploys

## 📞 Quick Reference

```powershell
# Install all dependencies
npm install
cd backend && npm install && cd ..

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
npm run dev

# Run tests
bash run-e2e-tests.sh

# Stop services
# Press Ctrl+C in each terminal
```

---

**That's it! You're all set. 🚀**

Open http://localhost:5173 in your browser!
