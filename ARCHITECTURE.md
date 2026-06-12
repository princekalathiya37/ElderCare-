# 🏗️ ElderCare+ System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (PWA)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React App (Vite)                                        │  │
│  │  - HomeScreen                                            │  │
│  │  - MedicineListScreen                                    │  │
│  │  - EmergencySOSScreen                                    │  │
│  │  - LoginScreen                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Service Worker                                          │  │
│  │  - Background Notifications                             │  │
│  │  - Offline Support                                       │  │
│  │  - Cache Management                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Push Notification Service                              │  │
│  │  - FCM Integration                                       │  │
│  │  - Browser Push API                                      │  │
│  │  - Subscription Management                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
              │ API Calls │ Push Events │ Geolocation
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Server (Port 5000)                                  │  │
│  │  - Auth Routes                                           │  │
│  │  - Medicine Routes                                       │  │
│  │  - SOS Routes                                            │  │
│  │  - Middleware (JWT, Cors, RateLimit)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Background Schedulers                                   │  │
│  │  - Medicine Reminder (Every minute)                      │  │
│  │  - Escalation (Every 5 minutes)                          │  │
│  │  - Daily Reset (Midnight)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Notification Services                                   │  │
│  │  - Push (Firebase FCM)                                   │  │
│  │  - SMS (Twilio)                                          │  │
│  │  - Email (Optional)                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
    │ SMS │ Push │ Logging │ Data
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
│  ┌───────────────┐ ┌──────────────┐ ┌───────────────┐         │
│  │  MongoDB      │ │  Firebase    │ │    Twilio     │         │
│  │  Database     │ │  FCM & Auth  │ │  SMS Service  │         │
│  └───────────────┘ └──────────────┘ └───────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components
```
App
├── LoginScreen
├── RegisterScreen
├── HomeScreen
│   ├── TodaysMedicines
│   ├── NextAppointment
│   └── EmergencySOS Button
├── MedicineListScreen
│   ├── MedicineCard (with Confirm button)
│   └── AddMedicineButton
├── EmergencySOSScreen
│   ├── SOS Button
│   ├── Location Display
│   ├── MedicalInfo
│   └── EmergencyContacts
└── ProfileScreen
    ├── UserInfo
    └── EmergencyContacts

Services
├── apiService
│   ├── auth endpoints
│   ├── medicine endpoints
│   └── SOS endpoints
└── pushNotificationService
    ├── Service Worker registration
    ├── Push subscription
    └── Notification handling
```

### Backend Structure
```
backend/
├── server.js (Main entry point)
├── package.json
├── .env (Configuration)
│
├── config/
│   └── database.js (MongoDB connection)
│
├── models/
│   ├── User.js
│   ├── Medicine.js
│   ├── Notification.js
│   └── EmergencySOS.js
│
├── controllers/
│   ├── authController.js
│   ├── medicineController.js
│   └── sosController.js
│
├── routes/
│   ├── authRoutes.js
│   ├── medicineRoutes.js
│   └── sosRoutes.js
│
├── services/
│   ├── notificationService.js
│   ├── schedulerService.js
│   └── authService.js
│
└── middleware/
    └── auth.js (JWT, Error Handler, Rate Limiter)
```

## Data Flow Diagrams

### Medicine Reminder Flow
```
1. User adds medicine with time: "8:00 AM"
   └─> Stored in MongoDB

2. Scheduler runs every minute
   ├─> Checks current time
   ├─> If matches scheduled time
   └─> Triggers reminder

3. Notification Service
   ├─> Sends push (if FCM token)
   ├─> Sends SMS (if enabled)
   └─> Saves notification record

4. User receives notification
   ├─> Browser shows notification (if PWA)
   ├─> SMS received on phone
   └─> Notification displayed even if app closed

5. User confirms medicine
   ├─> Click "Mark Taken" button
   ├─> Sends confirmation to backend
   └─> Escalation cancelled
```

### 30-Minute Escalation Flow
```
1. Medicine reminder sent at 8:00 AM
   └─> Confirmation record created: confirmed=false

2. Escalation scheduler checks every 5 minutes
   └─> Checks if >30 minutes passed

3. At 8:30 AM (30 minutes later)
   ├─> If still not confirmed
   └─> Sends SMS to caregiver

4. Caregiver receives escalation SMS
   ├─> "Alert: John has not taken Metformin since 8:00 AM"
   └─> Can contact John directly

5. If user confirms, escalation stops
   ├─> confirmed = true
   ├─> smsAlertSent = false
   └─> Escalation cancelled
```

### Emergency SOS Flow
```
1. User taps SOS button
   └─> 5-second countdown starts

2. User doesn't cancel
   └─> SOS triggered

3. Backend:
   ├─> Gets user's emergency contacts
   ├─> Gets user's medical info
   ├─> Gets user's location
   └─> Creates EmergencySOS record

4. Notifications sent instantly:
   ├─> SMS to all emergency contacts
   ├─> Message includes: location, medical info, allergies
   └─> Marked as urgent

5. Emergency contacts notified:
   ├─> Receive SMS with critical info
   ├─> Can contact emergency services
   └─> Can also see in app if they're registered

6. SOS can be resolved:
   ├─> User or caregiver marks as resolved
   ├─> Follow-up SMS sent
   └─> Status updated in system
```

## Authentication Flow

```
1. User Registration
   ├─> POST /api/auth/register
   ├─> Data: email, password, name, phone, role
   └─> Response: JWT token, user data

2. Login
   ├─> POST /api/auth/login
   ├─> Data: email, password
   └─> Response: JWT token, user data

3. Token Usage
   ├─> Stored in localStorage
   ├─> Sent in Authorization header
   └─> Expires in 7 days (configurable)

4. Protected Routes
   ├─> All medicine/SOS routes require JWT
   ├─> Middleware validates token
   └─> Returns 401 if invalid
```

## Push Notification Flow

```
1. User opens app
   ├─> Service Worker registers
   ├─> Browser requests permission
   └─> User grants permission

2. Subscribe to Push
   ├─> Get VAPID key
   ├─> Subscribe to push manager
   └─> Save subscription to backend

3. Backend sends notification
   ├─> Use Firebase FCM (if token available)
   ├─> Use Web Push API (if subscription available)
   └─> Notification queued

4. Browser receives notification
   ├─> Service Worker handles push event
   ├─> Shows notification to user
   └─> User can interact with it

5. Offline Support
   ├─> Service Worker caches responses
   ├─> Stores failed requests
   ├─> Background sync when online
   └─> User doesn't lose data
```

## Database Relationships

```
User (1) ──────> (Many) Medicine
  │
  ├─ emergencyContacts Array
  ├─ fcmToken String
  └─ pushSubscription Object

User (1) ──────> (Many) EmergencySOS
  └─ location, status, notifiedContacts

Medicine ──────> confirmations Array
  └─ {date, time, confirmed, smsAlertSent, smsAlertSentAt}

User (1) ──────> (Many) Notification
  ├─ type: medicine-reminder | escalation | emergency-sos
  └─ channel: push | sms | email
```

## Timeline

### Request-Response Times

```
Medicine Reminder:
  - Scheduled time arrives
  - Scheduler checks (1 ms)
  - Creates confirmation (10 ms)
  - Sends push (100-500 ms)
  - Sends SMS (500-2000 ms)
  ─────────────────────────
  Total: ~2-3 seconds

Escalation Alert (30 min later):
  - Scheduler detects overdue (1 ms)
  - Creates escalation record (10 ms)
  - Sends SMS (500-2000 ms)
  ─────────────────────────
  Total: ~2 seconds

Emergency SOS:
  - User taps button (0 ms)
  - 5-second countdown
  - Get location (1-3 seconds)
  - Send SMS to 3 contacts (5-6 seconds)
  ─────────────────────────
  Total: 11-14 seconds
```

## Scalability Considerations

### Current Capacity
- Users: ~10,000
- Medicines/day: ~50,000
- Notifications/day: ~200,000+

### Optimization for Scale
1. Database indexing on timestamps
2. Scheduler optimization (batch processing)
3. Cache layer (Redis) for frequent queries
4. Rate limiting to prevent abuse
5. Async processing for heavy operations
6. Database sharding if needed

## Security Measures

1. **Authentication**: JWT tokens with expiration
2. **Authorization**: User can only access own data
3. **Rate Limiting**: 100 requests per minute per IP
4. **Password Hashing**: bcryptjs with salt rounds
5. **CORS**: Whitelist specific origins
6. **Input Validation**: Express-validator on all inputs
7. **HTTPS**: Required in production
8. **Sensitive Data**: Filtered from API responses

## Monitoring & Logging

### Key Metrics to Track
- API response times
- Failed medicine reminders
- SMS delivery rates
- Push notification success rate
- User retention
- Error rates

### Logs
- All API requests
- Scheduler execution
- Notification delivery
- Authentication events
- Error stack traces

## Deployment Checklist

- [ ] MongoDB connection verified
- [ ] Firebase credentials configured
- [ ] Twilio credentials configured
- [ ] Environment variables set
- [ ] JWT secret strong and unique
- [ ] CORS origins configured
- [ ] Database backups enabled
- [ ] Error monitoring setup (e.g., Sentry)
- [ ] SSL certificate installed
- [ ] Rate limiting tested
- [ ] Load testing completed
- [ ] API documentation reviewed
