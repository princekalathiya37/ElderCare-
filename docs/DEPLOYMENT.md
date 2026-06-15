# ElderCare+ Render Deployment Guide (Backend)

Render is a modern cloud hosting platform offering free-tier Web Services. Follow these steps to host your ElderCare+ Node.js/Express backend on Render.

## Prerequisites
- GitHub account
- Git repository initialized and pushed to GitHub
- MongoDB Atlas (Cloud Database) cluster created

## Step 1: Create a Render Web Service

1. Log in to the [Render Dashboard](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing the ElderCare+ codebase.

## Step 2: Configure the Service Settings

Configure the deployment settings as follows:
- **Name**: `eldercare-backend`
- **Language**: `Node`
- **Region**: Choose the region closest to your users.
- **Branch**: `main`
- **Root Directory**: `backend` (This runs commands inside the backend subdirectory)
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Select the **Free** tier.

## Step 3: Configure Environment Variables

Under the **Advanced** settings, add the following environment variables:

| Variable Name | Description / Value |
| --- | --- |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A secure, random 32+ character signing key |
| `JWT_EXPIRE` | `7d` |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render will override this dynamically) |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID (for push notifications) |
| `FIREBASE_PRIVATE_KEY` | Your Firebase private key |
| `FIREBASE_CLIENT_EMAIL` | Your Firebase client email |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID (for caregiver SMS alerts) |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Your Twilio Phone Number |

## Step 4: Deploy and Verify

1. Click **Create Web Service**.
2. Render will automatically clone the repository, install dependencies, and spin up the server.
3. Once the service status turns **Live**, copy your public Render URL (e.g. `https://eldercare-backend.onrender.com`).
4. Test the server by visiting `https://your-backend-url.onrender.com/health` in your browser. You should receive a JSON response: `{"status": "Server is running"}`.

---

# ElderCare+ AWS EC2 Deployment

## Step 1: Launch EC2 Instance

```bash
# Select Ubuntu 20.04 LTS AMI
# Instance type: t2.small or larger
# Security group: Allow 80, 443, 5000, 27017 (if local MongoDB)
```

## Step 2: Connect & Setup

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB (optional, use Atlas instead)
sudo apt-get install -y mongodb

# Install nginx
sudo apt-get install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

## Step 3: Deploy Application

```bash
# Clone repository
git clone https://github.com/your-repo/eldercare-plus.git
cd eldercare-plus

# Install dependencies
cd backend
npm install --production

# Create .env
cat > .env << 'EOF'
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=production
# Add other env vars
EOF

# Start with PM2
pm2 start server.js --name "eldercare-backend"
pm2 startup
pm2 save

# Configure nginx as reverse proxy
sudo nano /etc/nginx/sites-available/default
```

### Nginx Configuration

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Reload nginx
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Step 4: Monitor

```bash
# View logs
pm2 logs

# Check status
pm2 status

# Restart app
pm2 restart eldercare-backend

# Monitor system
top
df -h
```

---

# ElderCare+ Railway Deployment

## Step 1: Connect Repository

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init
```

## Step 2: Configure

In project root, create `railway.json`:

```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "restartPolicyMaxRetries": 5
  }
}
```

## Step 3: Deploy

```bash
# Deploy to Railway
railway up

# Set environment variables
railway variables

# View logs
railway logs

# Open dashboard
railway open
```

## Step 4: Connect Database

```bash
# Add MongoDB plugin
railway add

# Link to project
railway link
```

---

# ElderCare+ Frontend Deployment (Vercel)

## Step 1: Build

```bash
npm run build
```

## Step 2: Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

## Step 3: Environment Variables

In Vercel dashboard:
- Set **Root Directory** to `frontend`.
- Add the following environment variables:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_key
```

---

# Docker Deployment

## Dockerfile for Backend

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install --production

COPY backend/ .

EXPOSE 5000

CMD ["npm", "start"]
```

## docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/eldercare
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - mongo

  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend

volumes:
  mongo-data:
```

## Deploy with Docker

```bash
docker-compose up -d
docker-compose logs -f backend
docker-compose down
```

---

# SSL/HTTPS Setup

## Using Let's Encrypt

```bash
# On Linux/Mac
certbot certonly --standalone -d your-domain.com

# Certificate locations
/etc/letsencrypt/live/your-domain.com/fullchain.pem
/etc/letsencrypt/live/your-domain.com/privkey.pem

# Auto-renew
sudo certbot renew --dry-run
```

## Update Express Server

```javascript
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('path/to/privkey.pem'),
  cert: fs.readFileSync('path/to/fullchain.pem')
};

https.createServer(options, app).listen(443, () => {
  console.log('HTTPS Server running on port 443');
});
```

---

# Performance Optimization for Production

## Enable Gzip Compression

```javascript
import compression from 'compression';
app.use(compression());
```

## Set up CDN (CloudFlare)

1. Add domain to CloudFlare
2. Update nameservers
3. Enable caching for static assets

## Database Optimization

```javascript
// Add indexes
db.medicines.createIndex({ userId: 1, scheduledTimes: 1 });
db.medicines.createIndex({ userId: 1, "confirmations.date": 1 });
db.notifications.createIndex({ userId: 1, createdAt: -1 });
```

## Monitoring & Logging

```bash
# Sentry for error tracking
npm install @sentry/node

# Datadog for performance
npm install dd-trace

# ELK Stack for logs
# Configure Log aggregation
```

---

# Database Backup

```bash
# MongoDB backup
mongodump --uri "mongodb+srv://..." --out /backups/

# Restore
mongorestore --uri "mongodb+srv://..." /backups/

# Automated backups
# Use MongoDB Atlas: Backup & Restore → Set Schedule
```

---

# Scaling Checklist

- [ ] Database replication enabled
- [ ] Read replicas for scaling reads
- [ ] Connection pooling configured
- [ ] Caching layer (Redis) added
- [ ] Load balancer configured
- [ ] Auto-scaling enabled
- [ ] CDN for static assets
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Backup strategy in place
