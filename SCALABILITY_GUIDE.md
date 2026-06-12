# ElderCare+ Scalability & Performance Optimization

## Architecture for Scaling to 10,000+ Users

### Current Single-Server Limitation

```
┌─────────────────────────────────────────┐
│ Single Node.js Server (5000)            │
│ ├─ Medicine Reminder Scheduler (1 min)  │
│ ├─ Escalation Scheduler (5 min)         │
│ └─ Daily Reset Scheduler (daily)        │
├─ MongoDB (local or Atlas)               │
└─ Firebase FCM + Twilio (External)       │
   Capacity: ~500 concurrent users max
```

### Production Architecture for 10,000+ Users

```
                    ┌──────────────────┐
                    │  CloudFlare CDN  │
                    │ (Static Assets)  │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼────┐          ┌───▼────┐          ┌───▼────┐
    │ Load   │          │ Load   │          │ Load   │
    │ Bal.1  │          │ Bal.2  │          │ Bal.3  │
    └───┬────┘          └───┬────┘          └───┬────┘
        │                    │                    │
    ┌───▼──────┐         ┌───▼──────┐         ┌───▼──────┐
    │Backend-1 │         │Backend-2 │         │Backend-3 │
    │ (5000)   │         │ (5000)   │         │ (5000)   │
    └───┬──────┘         └───┬──────┘         └───┬──────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Redis Cache    │
                    │  (Session Store)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼───────────────┐    │    ┌──────────────▼──┐
    │MongoDB Primary    │    │    │ MongoDB Replica │
    │(Master Write)     │◄───┴───►│(Slave Read)     │
    └───────────────────┘         └─────────────────┘
        │                                  │
    ┌───▼────────────────────────────────▼─┐
    │  Message Queue (Redis/RabbitMQ)      │
    │  ├─ Medicine Reminders               │
    │  ├─ Escalation Notifications         │
    │  └─ Emergency SOS Alerts             │
    └──────────────────────────────────────┘
        │         │         │
    ┌───▼──┐ ┌────▼──┐ ┌───▼───┐
    │FCM   │ │Twilio │ │Web    │
    │Push  │ │SMS    │ │Push   │
    └──────┘ └───────┘ └───────┘
```

---

## Implementation Steps

### Phase 1: Database Optimization (Week 1)

#### 1.1 Add MongoDB Indexes

```javascript
// backend/models/Medicine.js
medicineSchema.index({ userId: 1, scheduledTimes: 1 });
medicineSchema.index({ userId: 1, createdAt: -1 });
medicineSchema.index({ 
  'confirmations.date': 1, 
  'confirmations.time': 1 
});

// backend/models/Notification.js
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

// backend/models/User.js
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { sparse: true });
```

#### 1.2 Enable MongoDB Atlas Read Replicas

```bash
# In MongoDB Atlas dashboard:
# 1. Cluster → Replication
# 2. Add secondary nodes (2-3 for redundancy)
# 3. Enable automatic failover
# 4. Setup connection strings for read replicas

# Connection strings:
PRIMARY_URL=mongodb+srv://user:pass@cluster-primary.mongodb.net
REPLICA_READ_URL=mongodb+srv://user:pass@cluster-replica.mongodb.net/?readPreference=secondary
```

#### 1.3 Update Backend Connection Pooling

```javascript
// backend/config/database.js
const mongoose = require('mongoose');

const options = {
  maxPoolSize: 50,        // Increased from default 10
  minPoolSize: 10,        // Minimum connections
  socketTimeoutMS: 45000, // 45 sec timeout
  serverSelectionTimeoutMS: 5000,
  family: 4              // Force IPv4
};

// Primary for writes
const primaryConnection = mongoose.createConnection(
  process.env.PRIMARY_URL,
  options
);

// Replica for reads
const replicaConnection = mongoose.createConnection(
  process.env.REPLICA_READ_URL,
  options
);

module.exports = { primaryConnection, replicaConnection };
```

---

### Phase 2: Caching Layer with Redis (Week 1-2)

#### 2.1 Install Redis

```bash
# Local development
brew install redis  # macOS
# or
sudo apt-get install redis-server  # Linux

# Start Redis
redis-server

# For production, use AWS ElastiCache or Heroku Redis
heroku addons:create heroku-redis:premium-0
```

#### 2.2 Implement Redis Caching

```javascript
// backend/services/cacheService.js
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

client.on('error', err => console.error('Redis error:', err));
client.connect();

class CacheService {
  // Cache medicine list for 5 minutes
  async cacheMedicines(userId, medicines) {
    await client.setEx(
      `medicines:${userId}`,
      300, // 5 minutes
      JSON.stringify(medicines)
    );
  }

  async getMedicines(userId) {
    const cached = await client.get(`medicines:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  // Cache user profile for 1 hour
  async cacheUser(userId, userData) {
    await client.setEx(
      `user:${userId}`,
      3600,
      JSON.stringify(userData)
    );
  }

  async getUser(userId) {
    const cached = await client.get(`user:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  // Invalidate caches on update
  async invalidateMedicines(userId) {
    await client.del(`medicines:${userId}`);
  }

  async invalidateUser(userId) {
    await client.del(`user:${userId}`);
  }
}

module.exports = new CacheService();
```

#### 2.3 Update Controllers with Caching

```javascript
// backend/controllers/medicineController.js
const cacheService = require('../services/cacheService');

exports.getTodaysMedicines = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check cache first
    let medicines = await cacheService.getMedicines(userId);
    if (medicines) {
      return res.json({
        success: true,
        data: medicines,
        cached: true
      });
    }

    // If not cached, fetch from DB
    medicines = await Medicine.find({
      userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Cache for future requests
    await cacheService.cacheMedicines(userId, medicines);

    res.json({
      success: true,
      data: medicines,
      cached: false
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Invalidate cache on update
exports.updateMedicine = async (req, res) => {
  try {
    const userId = req.user.id;
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Invalidate cache
    await cacheService.invalidateMedicines(userId);

    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

### Phase 3: Message Queue for Background Jobs (Week 2-3)

#### 3.1 Replace node-cron with Bull Queue

```bash
npm install bull bull-board express-bull-board
```

#### 3.2 Setup Bull Queues

```javascript
// backend/services/queueService.js
const Queue = require('bull');
const redis = require('./redisClient');

const medicineReminderQueue = new Queue('medicine-reminders', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  }
});

const escalationQueue = new Queue('escalations', { redis });
const sosQueue = new Queue('emergency-sos', { redis });

// Process medicine reminders
medicineReminderQueue.process(async (job) => {
  const { userId, medicineId } = job.data;
  
  // Send notification
  await notificationService.sendPushNotification(
    userId,
    'Medicine Reminder',
    `Time to take your medicine: ${medicineId}`
  );

  return { success: true };
});

medicineReminderQueue.on('failed', (job, err) => {
  console.error(`Medicine reminder job ${job.id} failed:`, err.message);
  // Retry after 5 minutes
  job.retry();
});

// Process escalations
escalationQueue.process(async (job) => {
  const { medicineId, caregiverId } = job.data;
  
  // Send SMS to caregiver
  await notificationService.sendSMSNotification(
    caregiverId,
    'Medicine not taken - please check on your patient'
  );

  return { success: true };
});

// Process SOS
sosQueue.process(async (job) => {
  const { userId, location } = job.data;
  
  // Notify all emergency contacts
  await notificationService.sendEmergencySosNotification(
    userId,
    location
  );

  return { success: true };
});

module.exports = {
  medicineReminderQueue,
  escalationQueue,
  sosQueue
};
```

#### 3.3 Update Schedulers to Use Queues

```javascript
// backend/services/schedulerService.js
const cron = require('node-cron');
const { medicineReminderQueue, escalationQueue } = require('./queueService');

function startMedicineReminderScheduler() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    try {
      // Find medicines scheduled for this time
      const medicines = await Medicine.find({
        scheduledTimes: currentTime,
        active: true
      });

      // Queue jobs instead of processing directly
      for (const medicine of medicines) {
        await medicineReminderQueue.add(
          {
            userId: medicine.userId,
            medicineId: medicine._id
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        );
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });
}

function startEscalationScheduler() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000);

      // Find unconfirmed medicines
      const unconfirmed = await Medicine.find({
        'confirmations.createdAt': { $lt: thirtyMinutesAgo },
        'confirmations.confirmed': false
      });

      for (const record of unconfirmed) {
        await escalationQueue.add(
          {
            medicineId: record._id,
            caregiverId: record.smsContact
          },
          { attempts: 2 }
        );
      }
    } catch (error) {
      console.error('Escalation scheduler error:', error);
    }
  });
}

module.exports = { startMedicineReminderScheduler, startEscalationScheduler };
```

---

### Phase 4: Load Balancing (Week 3)

#### 4.1 Nginx Configuration

```nginx
# /etc/nginx/nginx.conf
upstream eldercare_backend {
  least_conn;  # Load balancing algorithm
  server 127.0.0.1:5001;
  server 127.0.0.1:5002;
  server 127.0.0.1:5003;
  server 127.0.0.1:5004;

  keepalive 32;
}

server {
  listen 80;
  server_name eldercare-api.com;

  # Enable compression
  gzip on;
  gzip_types text/plain text/css application/json;

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
  limit_req zone=api_limit burst=20;

  location / {
    proxy_pass http://eldercare_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }

  # Health check endpoint
  location /health {
    proxy_pass http://eldercare_backend;
    access_log off;
  }
}
```

#### 4.2 Start Multiple Backend Instances

```bash
# backend/start-cluster.sh
#!/bin/bash

for i in {1..4}; do
  PORT=$((5000 + i)) npm start &
  echo "Started backend instance on port $((5000 + i))"
done

wait
```

---

### Phase 5: Monitoring & Alerts (Week 4)

#### 5.1 Setup Prometheus Metrics

```javascript
// backend/middleware/metrics.js
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

module.exports = {
  httpRequestDuration,
  activeConnections,
  register: prometheus.register
};
```

#### 5.2 Add Monitoring Middleware

```javascript
// backend/server.js
const metrics = require('./middleware/metrics');

app.use((req, res, next) => {
  const start = Date.now();
  metrics.activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    metrics.httpRequestDuration
      .labels(req.method, req.route?.path || req.url, res.statusCode)
      .observe(duration);
    metrics.activeConnections.dec();
  });

  next();
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', metrics.register.contentType);
  res.end(await metrics.register.metrics());
});
```

#### 5.3 Setup Grafana Dashboard

```bash
# docker-compose.yml additions
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml

grafana:
  image: grafana/grafana
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

### Phase 6: Database Sharding (Week 4-5)

For users beyond 50,000, implement horizontal sharding:

```javascript
// backend/services/shardingService.js
class ShardingService {
  getShardId(userId) {
    // Consistent hashing
    const hash = userId.charCodeAt(0) + userId.charCodeAt(1);
    return hash % 4; // 4 shards
  }

  getShardConnection(userId) {
    const shardId = this.getShardId(userId);
    const connections = [
      process.env.SHARD_1_URL,
      process.env.SHARD_2_URL,
      process.env.SHARD_3_URL,
      process.env.SHARD_4_URL
    ];
    return connections[shardId];
  }
}
```

---

## Performance Testing

### Load Testing Script

```bash
# backend/load-test.sh
#!/bin/bash

# Install Apache Bench
sudo apt-get install apache2-utils

# Test endpoints
echo "Testing login endpoint..."
ab -n 10000 -c 100 -p payload.json -T application/json \
  http://localhost:5000/api/auth/login

echo "Testing medicines endpoint..."
ab -n 5000 -c 50 \
  http://localhost:5000/api/medicines

echo "Testing confirmation endpoint..."
ab -n 5000 -c 50 -X POST \
  http://localhost:5000/api/medicines/confirm
```

### Results Targets

- **Response time**: < 200ms (95th percentile)
- **Throughput**: > 1000 requests/sec
- **Error rate**: < 0.1%
- **CPU usage**: < 70%
- **Memory**: < 80% of available

---

## Scaling Summary

| Phase | Users | Infrastructure | Effort |
|-------|-------|-----------------|--------|
| 1 | 100 | Single server + local MongoDB | Minimal |
| 2 | 500 | Single server + MongoDB Atlas | Low |
| 3 | 1K | Single server + Redis | Medium |
| 4 | 5K | Load balancer + 4 servers + Redis | High |
| 5 | 10K | Monitoring + Message queues + Replicas | High |
| 6 | 50K+ | Database sharding + CDN + Advanced caching | Very High |

---

## Deployment Checklist for Production

- [ ] Database indexes created
- [ ] Redis cache layer running
- [ ] Message queues configured
- [ ] Load balancer setup
- [ ] SSL/TLS certificates installed
- [ ] Monitoring & alerting active
- [ ] Backup strategy in place
- [ ] Disaster recovery plan tested
- [ ] Rate limiting configured
- [ ] API versioning implemented
- [ ] CDN for static assets
- [ ] Database replicas configured
- [ ] Auto-scaling policies set
- [ ] Log aggregation active
- [ ] Error tracking enabled
