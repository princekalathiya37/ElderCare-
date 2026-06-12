# ElderCare+ Backend Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Twilio Account (for SMS)
- Firebase Project (for push notifications)

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Configure .env with your credentials**
   ```
   MONGO_URI=mongodb://localhost:27017/eldercare
   JWT_SECRET=your_secret_key_here
   PORT=5000
   
   # Firebase
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   
   # Twilio
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

5. **Start the server**
   ```bash
   npm run dev    # Development with auto-reload
   npm start      # Production
   ```

---

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/update-fcm` - Update FCM token (for push)
- `POST /api/auth/subscribe` - Save push subscription
- `POST /api/auth/emergency-contacts` - Update emergency contacts
- `GET /api/auth/profile` - Get user profile

### Medicine Management
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/today/list` - Get today's medicines
- `POST /api/medicines` - Add new medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine
- `POST /api/medicines/:id/confirm` - Confirm medicine taken
- `GET /api/medicines/:id/confirmations` - Get confirmation history

### Emergency SOS
- `POST /api/sos/trigger` - Trigger emergency SOS
- `GET /api/sos/active` - Get active SOS alerts
- `POST /api/sos/:id/resolve` - Resolve SOS
- `GET /api/sos/history` - Get SOS history

---

## 🔔 Features Implemented

### 1. Push Notifications
- Firebase Cloud Messaging (FCM) integration
- Browser Push API support
- Background notification delivery

### 2. SMS Alerts
- Twilio SMS for escalation alerts (after 30 minutes)
- Emergency contact notifications
- SOS alerts via SMS

### 3. Medicine Reminders
- Automated reminders at scheduled times
- 30-minute escalation to caregiver
- Confirmation tracking

### 4. Emergency SOS
- Instant notifications to emergency contacts
- Location sharing
- Medical information delivery

### 5. Service Worker
- Offline support
- Background sync
- Notification handling

---

## 🛠 Configuration

### Firebase Setup
1. Create Firebase project at https://console.firebase.google.com
2. Create service account key
3. Download JSON and extract credentials
4. Add to .env file

### Twilio Setup
1. Create account at https://www.twilio.com
2. Get Account SID and Auth Token
3. Get verified phone number
4. Add to .env file

### MongoDB Setup
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Get connection string and add to MONGO_URI in .env
```

---

## 📱 Frontend Integration

### 1. Initialize Push Notifications
```javascript
import PushNotificationService from './services/pushNotificationService';

const pushService = new PushNotificationService();
await pushService.initialize();
```

### 2. Use API Service
```javascript
import apiService from './services/apiService';

// Login
const data = await apiService.login('email@example.com', 'password');
apiService.setToken(data.token);

// Add medicine
await apiService.addMedicine({
  name: 'Metformin',
  dosage: '500mg',
  frequency: 'twice-daily',
  scheduledTimes: ['8:00 AM', '8:00 PM'],
  smsContact: '+1234567890'
});

// Confirm medicine taken
await apiService.confirmMedicineTaken(medicineId, '8:00 AM');

// Trigger SOS
await apiService.triggerEmergencySOS({
  latitude: 40.7128,
  longitude: -74.0060,
  address: '123 Main St, New York, NY'
});
```

---

## 🔄 Schedulers

The backend runs automated schedulers:

### Medicine Reminder Scheduler (Every minute)
- Checks for medicines scheduled at current time
- Sends push & SMS notifications
- Creates confirmation records

### Escalation Scheduler (Every 5 minutes)
- Checks for unconfirmed medicines
- If >30 min passed, sends SMS to caregiver
- Marks escalation as sent

### Daily Reset Scheduler (Every day at midnight)
- Clears old confirmations
- Prepares for next day

---

## 📊 Database Schema

### User
```javascript
{
  name: String,
  email: String (unique),
  phone: String,
  role: 'elder' | 'caretaker',
  fcmToken: String,
  pushSubscription: Object,
  emergencyContacts: Array,
  caretakers: Array
}
```

### Medicine
```javascript
{
  userId: ObjectId,
  name: String,
  dosage: String,
  frequency: String,
  scheduledTimes: Array,
  smsAlert: Boolean,
  smsContact: String,
  confirmations: Array,
  escalationMinutes: Number
}
```

### EmergencySOS
```javascript
{
  userId: ObjectId,
  location: Object,
  status: 'active' | 'resolved',
  notifiedContacts: Array,
  emergencyDetails: Object
}
```

---

## 🧪 Testing

### Test Medicine Reminder
```bash
curl -X POST http://localhost:5000/api/medicines/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test SOS
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

---

## 🐛 Troubleshooting

### Service Worker not registering
- Check browser support (Chrome, Firefox, Edge)
- Ensure HTTPS in production
- Clear browser cache

### Push notifications not working
- Verify FCM token is saved
- Check Firebase credentials
- Ensure notification permission granted

### SMS not sending
- Verify Twilio credentials
- Ensure phone numbers are in E.164 format (+1234567890)
- Check Twilio account balance

### Medicine reminders not triggering
- Verify MongoDB connection
- Check scheduler logs
- Ensure medicine times are in correct format (HH:MM AM/PM)

---

## 📝 Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRE` | Token expiration time |
| `PORT` | Server port |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |
| `NODE_ENV` | Environment (development/production) |

---

## 📚 Resources

- [Firebase Admin SDK](https://firebase.google.com/docs/database)
- [Twilio API](https://www.twilio.com/docs)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MongoDB Guide](https://docs.mongodb.com)

---

## 📞 Support

For issues or questions, contact the development team.

**Happy coding! 🚀**
