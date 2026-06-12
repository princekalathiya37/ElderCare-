# 🚀 Quick Start Guide - 5 Minutes

## Step 1: Install Dependencies (1 min)
```bash
cd backend
npm install
```

## Step 2: Create .env File (1 min)
```bash
cp .env.example .env
```

Edit `.env` with your values:
```
MONGO_URI=mongodb://localhost:27017/eldercare
JWT_SECRET=your_secret_key_here_min_32_characters
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-email
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
NODE_ENV=development
```

## Step 3: Start MongoDB (1 min)
```bash
# Option 1: Local MongoDB
mongod

# Option 2: MongoDB Atlas (cloud)
# Update MONGO_URI in .env
```

## Step 4: Start Backend (1 min)
```bash
npm run dev
```

You should see:
```
╔══════════════════════════════════════════╗
║     ElderCare+ Backend Server Started     ║
╠══════════════════════════════════════════╣
║ 🚀 Server running on port: 5000         
║ 📝 Environment: development
║ 🔌 Database: Connected
║ 📱 API Base: http://localhost:5000/api
╚══════════════════════════════════════════╝
```

## Step 5: Test the API (1 min)
```bash
# Test health check
curl http://localhost:5000/health

# Response
{"status":"Server is running","timestamp":"2024-01-15T10:30:00.000Z"}
```

## ✅ Done! Backend is Running

### Test Features

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "phone": "+1234567890"
  }'
```

**Add Medicine:**
```bash
# First get token from login response, then:
curl -X POST http://localhost:5000/api/medicines \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aspirin",
    "dosage": "100mg",
    "frequency": "once-daily",
    "scheduledTimes": ["8:00 AM"],
    "smsContact": "+1234567890"
  }'
```

**Trigger SOS:**
```bash
curl -X POST http://localhost:5000/api/sos/trigger \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St"
    }
  }'
```

## 📱 Frontend Integration

In another terminal:
```bash
cd ..
npm install
npm run dev
```

Frontend will be on http://localhost:5173

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Solution: Start MongoDB with: mongod
Or update MONGO_URI to your cloud database
```

### Firebase/Twilio Errors
```
Solution: Check .env has correct credentials
Verify credentials from your Firebase & Twilio accounts
```

### Port Already in Use
```
Solution: Change PORT in .env to 5001 or similar
Or kill process: lsof -i :5000 | kill -9
```

## 📚 Full Documentation

- See `README.md` for detailed setup
- See `../ARCHITECTURE.md` for system design
- See `../DEPLOYMENT.md` for production deployment

## 🎯 Next Steps

1. ✅ Backend running locally
2. ✅ API endpoints working
3. ⏭️ Connect frontend to backend
4. ⏭️ Test all 6 features
5. ⏭️ Deploy to production

**Happy coding! 🚀**
