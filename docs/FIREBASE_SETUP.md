# ⚠️ Firebase Credentials Required

The backend started but needs Firebase credentials to run fully.

## 🔐 Quick Workaround (For Testing Without Firebase)

Edit `backend/services/notificationService.js` and comment out Firebase initialization:

**Option 1: Mock Firebase (Recommended for testing)**

Replace the Firebase initialization section with this:

```javascript
// Mock Firebase for development/testing
let admin = null;
try {
  admin = await import('firebase-admin');
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
  }
} catch (err) {
  console.log('⚠️  Firebase not configured - notifications will be skipped');
}
```

**Option 2: Setup Real Firebase Credentials**

### Get Firebase Credentials

1. Go to: https://firebase.google.com/
2. Create a new project or select existing one
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file

### Extract Credentials

From the JSON file:
```json
{
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
}
```

### Configure backend/.env

```
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Important:** The `\n` in the private key is critical - make sure it's escaped properly.

## 🚀 For Now: Use Mock Firebase

If you just want to test locally without Firebase:

1. Edit `backend/server.js`
2. Comment out or make Firebase optional
3. Backend will work without sending real push notifications

## ✅ Full Setup Steps

1. **Create Firebase Project**
   - Visit https://console.firebase.google.com
   - Click "Create Project"
   - Enable Cloud Messaging

2. **Get Service Account Key**
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download JSON file

3. **Update backend/.env**
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...
   ```

4. **Restart Backend**
   - Stop current server (Ctrl+C)
   - Run: `npm run dev`

## 🎯 Next Steps

### Option A: Continue Testing Without Firebase (5 min)
1. Mock Firebase in notificationService.js
2. Continue testing other features
3. Add Firebase later

### Option B: Setup Real Firebase (30 min)
1. Create Firebase project
2. Get credentials
3. Configure .env
4. Restart backend

### Option C: Use Heroku (Handles It)
- Deploy to Heroku
- Set env vars via Heroku dashboard
- Don't worry about local Firebase setup

## 📚 Frontend Still Works

The frontend will load at http://localhost:5173 even without Firebase - you just won't get push notifications until you configure Firebase.

---

**Choose your path and continue! 💚**
