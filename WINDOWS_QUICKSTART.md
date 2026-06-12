# 🚀 ElderCare+ - Windows Quick Start

## ✅ Setup Done!

Your environment is ready. Now follow these steps:

---

## 📝 Step 1: Configure Your Credentials (5 minutes)

Edit `backend\.env` with your actual credentials:

```powershell
notepad backend\.env
```

### Required Configurations:

**MongoDB** (Pick one):
```
# Option 1: Local MongoDB
MONGO_URI=mongodb://localhost:27017/eldercare

# Option 2: MongoDB Atlas (Free Tier)
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/eldercare
```

**Firebase** (Get from Firebase Console):
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Twilio** (Get from Twilio Dashboard):
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**JWT Secret** (Create a random string):
```
JWT_SECRET=your_very_secure_random_string_min_32_chars_long_abcdef123456
```

---

## 🎯 Step 2: Start the Backend (Terminal 1)

```powershell
cd backend
npm run dev
```

**Expected output:**
```
✓ Server running on port 5000
✓ MongoDB connected
✓ Background schedulers started
```

---

## 🎨 Step 3: Start the Frontend (Terminal 2)

**Open a new PowerShell window** and run:

```powershell
# Make sure you're in the ElderCare+ folder
cd c:\Users\DELL\Downloads\ElderCare+

npm run dev
```

**Expected output:**
```
  VITE v5.0.0  ready in 1234 ms
  ➜  Local:   http://localhost:5173/
```

---

## 🌐 Step 4: Open in Browser

Click or go to: **http://localhost:5173**

You should see the ElderCare+ app loaded!

---

## ✅ Step 5: Test All Features

### Option A: Automated Testing
```powershell
bash run-e2e-tests.sh
```

This will test all 6 features:
- ✓ Daily medicine reminders
- ✓ Confirmation system
- ✓ 30-min escalation
- ✓ Emergency SOS
- ✓ Background notifications
- ✓ Offline support

### Option B: Manual Testing
1. **Register** a new user account
2. **Add a medicine** with a scheduled time
3. **Check notification** appears (in 1 minute)
4. **Tap "I took it"** to confirm
5. **Trigger SOS** to test emergency alerts

---

## 🐛 Troubleshooting

### Backend won't start?

**Port 5000 already in use:**
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the number)
taskkill /PID <PID> /F
```

**MongoDB connection error:**
```powershell
# Make sure MongoDB is running
# Or use MongoDB Atlas connection string

# Verify in backend/.env:
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/eldercare
```

**Firebase error:**
```powershell
# Verify .env has:
✓ FIREBASE_PROJECT_ID
✓ FIREBASE_PRIVATE_KEY (with \n line breaks)
✓ FIREBASE_CLIENT_EMAIL
```

---

### Frontend won't connect to backend?

**Check backend is running:**
```powershell
curl http://localhost:5000/health
```

Should return: `{"status":"ok"}`

**Check CORS:**
```powershell
# In backend/.env, verify:
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
```

---

### Notifications not working?

1. Check browser notifications are enabled
2. Check browser console for errors (F12)
3. Verify VAPID key in `.env.local`
4. Check Firebase credentials in `backend/.env`

---

## 📱 Testing the 6 Features

### 1️⃣ Daily Medicine Reminders
- Add medicine with time "14:05"
- Wait until 14:05
- Should receive push notification

### 2️⃣ Confirmation
- Add medicine
- Receive notification
- Tap "I took it"
- Should confirm in database

### 3️⃣ 30-Min Escalation
- Add medicine but don't confirm
- Wait 30 minutes
- Caregiver should receive SMS alert

### 4️⃣ Emergency SOS
- Go to Emergency SOS screen
- Tap "PRESS FOR EMERGENCY"
- Allow location sharing
- SMS sent to emergency contacts

### 5️⃣ Background Notifications
- Minimize/close the app
- Receive push notification at scheduled time
- Notification appears even with app closed

### 6️⃣ Offline Support
- Disconnect internet
- App still works (offline mode)
- Data syncs when connection returns

---

## 📦 What's Running

| Service | Port | URL |
|---------|------|-----|
| **Frontend (Vite)** | 5173 | http://localhost:5173 |
| **Backend (Express)** | 5000 | http://localhost:5000 |
| **MongoDB** | 27017 | Local or Atlas |

---

## 🚀 Next Steps After Testing

### Deploy to Production

**Heroku (Easiest):**
```powershell
heroku create my-eldercare-app
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

📖 Full guide: See **DEPLOYMENT_PLATFORMS.md**

**AWS (Full Control):**
- Launch EC2 instance
- Install Node.js, nginx
- Deploy with PM2
- Configure SSL

📖 Full guide: See **DEPLOYMENT_PLATFORMS.md**

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **START_HERE.md** | Quick navigation |
| **WINDOWS_SETUP.md** | Windows-specific setup |
| **COMPLETE_IMPLEMENTATION.md** | Full overview |
| **SYSTEM_ARCHITECTURE.md** | How it works |
| **DEPLOYMENT_PLATFORMS.md** | Deploy to production |
| **SCALABILITY_GUIDE.md** | Scale to 10K+ users |

---

## ✋ Common Commands

```powershell
# Start backend
cd backend && npm run dev

# Start frontend (new terminal)
npm run dev

# Stop services
Ctrl+C (in each terminal)

# Run tests
bash run-e2e-tests.sh

# View logs
# Backend logs: Check Terminal 1
# Frontend logs: Check Terminal 2

# Clear node_modules and reinstall
rm -Recurse node_modules, backend/node_modules -Force
npm install
cd backend && npm install && cd ..
```

---

## 🎯 You're Ready!

✅ **Backend configured and running**
✅ **Frontend configured and running**
✅ **All 6 features ready to test**
✅ **Ready for production deployment**

---

## 🎉 Success Checklist

After following these steps, you should see:

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] App loads in browser (login screen visible)
- [ ] Can register new user
- [ ] Can add medicine reminder
- [ ] Receive push notifications
- [ ] All tests pass (bash run-e2e-tests.sh)

If everything works, you're ready to deploy! 🚀

---

**Questions?** Check the relevant documentation file or troubleshooting section above.

**Ready to deploy?** See DEPLOYMENT_PLATFORMS.md

**Let's go! 💚**
