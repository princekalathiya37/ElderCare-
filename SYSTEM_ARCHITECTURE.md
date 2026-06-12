# ElderCare+ Complete System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ELDERCARE+ COMPLETE SYSTEM                           │
│                    (Local Development & Production Ready)                   │
└─────────────────────────────────────────────────────────────────────────────┘

                              USER DEVICES
                          ┌───────────────────┐
                          │  Elderly Users    │
                          │   (PWA App)       │
                          │ ┌─────────────┐   │
                          │ │ React/Vite  │   │
                          │ │ Service     │   │
                          │ │ Worker      │   │
                          │ └─────────────┘   │
                          └────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
            Browser Push API   IndexedDB       Cache API
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │   Nginx / CDN       │
                        │  Load Balancer      │
                        │  (Production)       │
                        └──────────┬──────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
       ┌────▼─────┐           ┌────▼─────┐           ┌────▼─────┐
       │Backend 1  │           │Backend 2  │           │Backend 3  │
       │(Node/Exp) │           │(Node/Exp) │           │(Node/Exp) │
       │ :5000     │           │ :5001     │           │ :5002     │
       └────┬──────┘           └────┬──────┘           └────┬──────┘
            │                       │                       │
            │    ┌──────────────────┼──────────────────┐    │
            │    │                  │                  │    │
            └────┼──────────────────┼──────────────────┼────┘
                 │                  │                  │
         ┌───────▼──────────────────▼──────────────────▼────┐
         │            Cache Layer (Redis)                   │
         │  ┌─────────────────────────────────────────┐    │
         │  │ Medicines (300s TTL)                    │    │
         │  │ User Profiles (3600s TTL)               │    │
         │  │ Session Tokens (86400s TTL)             │    │
         │  └─────────────────────────────────────────┘    │
         └───────┬──────────────────────────────────────────┘
                 │
         ┌───────▼─────────────────────────────────┐
         │      Message Queue (Bull/Redis)         │
         │  ┌──────────────┐  ┌──────────────┐   │
         │  │ Medicine     │  │ Escalation   │   │
         │  │ Reminders    │  │ Alerts       │   │
         │  └──────────────┘  └──────────────┘   │
         │  ┌──────────────┐  ┌──────────────┐   │
         │  │ SOS Alerts   │  │ SMS Queue    │   │
         │  └──────────────┘  └──────────────┘   │
         └───────┬─────────────────────────────────┘
                 │
         ┌───────▼──────────────────────────┐
         │  MongoDB Database                │
         │  ┌────────────────────────────┐  │
         │  │ Users                      │  │
         │  │ Medicines                  │  │
         │  │ Confirmations              │  │
         │  │ Notifications              │  │
         │  │ Emergency Contacts         │  │
         │  │ SOS Records                │  │
         │  └────────────────────────────┘  │
         │                                  │
         │  Replication:                    │
         │  Primary (Write)                 │
         │  Secondary Replicas (Read)       │
         │  Automated Failover              │
         └──────────────────────────────────┘
                 │
         ┌───────┴──────────────────────┐
         │                              │
     ┌───▼──────────┐          ┌────────▼────┐
     │ Firebase     │          │ Twilio      │
     │ FCM (Push)   │          │ SMS         │
     │              │          │             │
     │ Credentials: │          │ Credentials:│
     │ • Project ID │          │ • Account   │
     │ • Key File   │          │   SID       │
     │ • Auth Token │          │ • Auth      │
     └──────────────┘          │   Token     │
                               │ • Phone #   │
                               └─────────────┘
```

## Data Flow Diagrams

### Medicine Reminder Flow

```
┌──────────────────────────────────┐
│ Scheduled Time Reached           │
│ (e.g., 08:00 AM)                │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Background Scheduler Triggers    │
│ (runs every minute)              │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Query Database for Medicines     │
│ matching this time               │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Add to Message Queue             │
│ (10 retries, backoff)            │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────┐
│ Notification Service Processes Job               │
└───────────┬─────────────────────┬────────────────┘
            │                     │
       ┌────▼────┐            ┌────▼────────┐
       │ Send    │            │ Send SMS    │
       │ Firebase│            │ via Twilio  │
       │ Push    │            │             │
       └────┬────┘            └────┬────────┘
            │                      │
       ┌────▼──────────────────────▼────┐
       │ Create Confirmation Record     │
       │ (timestamp: now, confirmed: false)
       └────┬──────────────────────────┘
            │
            ▼
┌──────────────────────────────────┐
│ Elderly User Receives:           │
│ • Push notification              │
│ • SMS alert                      │
│ • App badge                      │
└──────────────┬───────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ┌───▼──────┐    ┌────▼───────┐
   │ Tap "I   │    │ Ignore      │
   │ Took It" │    │ (wait 30    │
   └───┬──────┘    │ min)        │
       │           └────┬────────┘
       │                │
   ┌───▼──────────┐ ┌──▼──────────────────┐
   │ POST confirm │ │ After 30 mins:      │
   │ → Database  │ │ Escalation Alert    │
   │ Updated     │ │ sent to Caregiver   │
   └─────────────┘ └─────────────────────┘
```

### Emergency SOS Flow

```
┌────────────────────────────────┐
│ Elderly Presses SOS Button     │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ Request Location Permissions       │
│ (Geolocation API)                 │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ Get GPS Coordinates                │
│ (lat, lng, accuracy)               │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│ POST /api/emergency-sos with location          │
└────────────┬──────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│ Backend creates SOS Record                     │
│ (timestamp, location, status: active)          │
└────────────┬──────────────────────────────────┘
             │
        ┌────┴───────────────────────┐
        │                            │
    ┌───▼──────────┐          ┌─────▼──────────┐
    │ Get medical  │          │ Get all        │
    │ info for     │          │ emergency      │
    │ elderly      │          │ contacts       │
    └───┬──────────┘          └─────┬──────────┘
        │                           │
        └───────────┬───────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │ For Each Emergency Contact│
        └───────────┬───────────────┘
                    │
        ┌───────────┴───────────────┐
        │                           │
    ┌───▼──────────────┐   ┌────────▼───────────┐
    │ Send Push        │   │ Send SMS with:     │
    │ Notification     │   │ • Patient name     │
    │ (app + web)      │   │ • Location (URL)   │
    │                  │   │ • Medical info     │
    └──────────────────┘   │ • Time             │
                           └────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │ Show "SOS Active" Modal   │
        │ + 10 Second Cancel Window │
        └───────────┬───────────────┘
                    │
           ┌────────┴────────┐
           │                 │
      ┌────▼─────┐      ┌────▼──────────┐
      │ If Cancel│      │ If No Cancel  │
      │ POST:    │      │ SOS remains   │
      │ /sos/    │      │ active until  │
      │ cancel   │      │ manually      │
      └─────────┘      │ cancelled     │
                       └───────────────┘
```

## Database Schema

```
Users Collection
├── _id: ObjectId
├── email: String (unique)
├── password: String (hashed)
├── name: String
├── age: Number
├── medicalConditions: [String]
├── emergencyContacts: [ObjectId] → EmergencyContact
├── createdAt: DateTime
└── updatedAt: DateTime

Medicines Collection
├── _id: ObjectId
├── userId: ObjectId → User
├── name: String
├── dosage: String
├── frequency: String
├── scheduledTimes: [String]  // ["08:00", "14:00", "20:00"]
├── smsAlert: Boolean
├── smsContact: String
├── escalationMinutes: Number  // 30
├── confirmations: [
│   ├── date: Date
│   ├── time: String
│   ├── confirmed: Boolean
│   └── timestamp: DateTime
│ ]
├── createdAt: DateTime
└── updatedAt: DateTime

Notifications Collection
├── _id: ObjectId
├── userId: ObjectId → User
├── type: String  // "medicine", "escalation", "sos"
├── title: String
├── message: String
├── read: Boolean
├── createdAt: DateTime
└── metadata: {
    medicineId: ObjectId,
    sosId: ObjectId,
    etc.
  }

EmergencySOS Collection
├── _id: ObjectId
├── userId: ObjectId → User
├── location: {
│   ├── lat: Number
│   ├── lng: Number
│   └── accuracy: Number
│ }
├── status: String  // "active", "cancelled", "resolved"
├── notifiedContacts: [String]  // phone numbers
├── createdAt: DateTime
└── resolvedAt: DateTime

EmergencyContacts Collection
├── _id: ObjectId
├── userId: ObjectId → User
├── name: String
├── relationship: String
├── phone: String  // E.164 format
├── email: String
└── createdAt: DateTime
```

## Deployment Architecture

### Development (Single Machine)
```
┌────────────────────────────────┐
│ Developer Machine              │
├────────────────────────────────┤
│ Frontend (Vite)      :5173     │
│ Backend (Node)       :5000     │
│ MongoDB              :27017    │
│ Redis (optional)     :6379     │
└────────────────────────────────┘
```

### Production - Phase 1 (5K Users)
```
┌────────────────────────────────┐
│ Cloud Provider (Heroku/AWS/etc)│
├────────────────────────────────┤
│ CDN (CloudFlare)               │
├────────────────────────────────┤
│ Load Balancer (nginx)          │
├────────────────────────────────┤
│ 2-4 Backend Instances          │
│ (auto-scaling group)           │
├────────────────────────────────┤
│ Redis (ElastiCache)            │
├────────────────────────────────┤
│ MongoDB Atlas Cluster          │
│ (Primary + 2 Replicas)         │
├────────────────────────────────┤
│ Monitoring (Prometheus)        │
│ Logging (CloudWatch/ELK)       │
│ Error Tracking (Sentry)        │
└────────────────────────────────┘
```

### Production - Phase 2 (10K+ Users)
```
┌─────────────────────────────────────┐
│ Multi-Region Architecture           │
├─────────────────────────────────────┤
│ Global CDN (CloudFlare)             │
│ ├─ Region 1 (US-East)              │
│ ├─ Region 2 (EU)                   │
│ └─ Region 3 (Asia-Pacific)          │
├─────────────────────────────────────┤
│ Each Region Has:                    │
│ ├─ Load Balancer                    │
│ ├─ 4-8 Backend Instances            │
│ ├─ Redis Cluster                    │
│ ├─ MongoDB Shard                    │
│ └─ Message Queue (RabbitMQ)         │
├─────────────────────────────────────┤
│ Shared Services:                    │
│ ├─ Firebase (Global)                │
│ ├─ Twilio (Global)                  │
│ ├─ Monitoring (Central)             │
│ └─ Database Sharding Controller     │
└─────────────────────────────────────┘
```

## Key Technologies

```
Frontend Stack
├── React 18
├── TypeScript
├── Vite (build tool)
├── TailwindCSS
├── Shadcn/UI
└── Service Worker

Backend Stack
├── Node.js 16+
├── Express 4
├── MongoDB 5
├── Redis
├── Firebase Admin SDK
├── Twilio SDK
├── Bull (job queue)
├── node-cron (scheduling)
└── JWT (authentication)

Deployment Stack
├── Docker
├── Nginx
├── PM2 (process manager)
├── Heroku / AWS / Railway
├── Let's Encrypt (SSL)
└── Cloudflare CDN

Monitoring Stack
├── Prometheus (metrics)
├── Grafana (dashboards)
├── Sentry (error tracking)
├── ELK Stack (logging)
└── New Relic (APM)
```

## Request Flow Example

```
1. User taps "Take Medicine"
   ↓
2. Frontend: POST /api/medicines/123/confirm
   ↓
3. Nginx routes to backend (load balanced)
   ↓
4. Express middleware
   ├─ CORS check
   ├─ Rate limit check
   └─ JWT validation
   ↓
5. Controller: medicineController.confirmMedicineTaken()
   ├─ Check medicine exists
   ├─ Update confirmation record
   ├─ Clear escalation flag
   └─ Invalidate cache
   ↓
6. Database: Update medicine document
   ├─ Add confirmation to array
   ├─ Set confirmed: true
   └─ Save timestamp
   ↓
7. Cache: Invalidate medicines:userId
   ↓
8. Response: { success: true, confirmed: true }
   ↓
9. Frontend receives response
   ├─ Update UI ("Taken Today")
   ├─ Show success toast
   └─ Refresh medicine list
```

## Monitoring & Observability

```
Application Metrics
├─ Request latency
├─ Error rate
├─ Throughput (req/sec)
├─ Active connections
└─ Memory usage

Database Metrics
├─ Query latency
├─ Replication lag
├─ Index usage
└─ Connections

Notification Metrics
├─ Delivery success rate
├─ SMS delivery time
├─ Push notification latency
└─ Message queue depth

Business Metrics
├─ Active users
├─ Medicines confirmed
├─ SOS triggers
├─ Escalation alerts sent
└─ User retention
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│ Client (HTTPS Only)                     │
└────────────────┬────────────────────────┘
                 │ (TLS 1.3)
┌────────────────▼────────────────────────┐
│ Firewall + WAF                          │
│ ├─ DDoS protection                      │
│ ├─ SQL injection filter                 │
│ └─ Rate limiting                        │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ API Gateway / Load Balancer             │
│ ├─ SSL/TLS termination                  │
│ ├─ Request logging                      │
│ └─ Origin validation                    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ Application Server                      │
│ ├─ JWT validation                       │
│ ├─ Input validation                     │
│ ├─ Output encoding                      │
│ └─ Error handling                       │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ Database (Encrypted at rest)            │
│ ├─ Encryption key management            │
│ ├─ Backup encryption                    │
│ └─ Network isolation                    │
└─────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0
**Last Updated**: January 2024
**Status**: Production Ready ✓
