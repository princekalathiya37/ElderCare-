#!/bin/bash

# ============ ELDERCARE+ COMPLETE SETUP & IMPLEMENTATION SCRIPT ============
# This script performs ALL setup steps for local development, testing, and deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# ============ UTILITY FUNCTIONS ============

banner() {
  clear
  echo -e "${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${MAGENTA}║       ElderCare+ Complete Implementation Setup          ║${NC}"
  echo -e "${MAGENTA}║  Phase: $1${NC}"
  echo -e "${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

success() {
  echo -e "${GREEN}✓ $1${NC}"
}

error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

prompt() {
  echo -e "${YELLOW}? $1${NC}"
  read -p "  > " response
}

# ============ PHASE 1: ENVIRONMENT SETUP ============

setup_environment() {
  banner "1/4: Environment Setup"
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    error "Node.js not installed. Install from https://nodejs.org"
  fi
  success "Node.js $(node --version)"
  
  # Check npm
  if ! command -v npm &> /dev/null; then
    error "npm not installed"
  fi
  success "npm $(npm --version)"
  
  # Check MongoDB
  info "MongoDB Setup"
  if command -v mongod &> /dev/null; then
    success "MongoDB installed"
  else
    info "MongoDB not found. You have two options:"
    info "1. Use MongoDB Atlas (Cloud) - Recommended for production"
    info "2. Install locally - For development"
    prompt "Use MongoDB Atlas (y/n)?"
    
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
      info "Visit https://www.mongodb.com/cloud/atlas to create free account"
      info "Get your connection string and save it"
    else
      if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        info "Install MongoDB: sudo apt-get install -y mongodb"
      elif [[ "$OSTYPE" == "darwin"* ]]; then
        info "Install MongoDB: brew install mongodb-community"
      fi
    fi
  fi
  
  # Check Redis (optional)
  if command -v redis-cli &> /dev/null; then
    success "Redis installed"
  else
    info "Redis not installed (optional for development)"
  fi
  
  success "Environment setup complete"
}

# ============ PHASE 2: INSTALL DEPENDENCIES ============

install_dependencies() {
  banner "2/4: Installing Dependencies"
  
  # Frontend dependencies
  info "Installing frontend dependencies..."
  if [ ! -d "node_modules" ]; then
    npm install
    success "Frontend dependencies installed"
  else
    success "Frontend dependencies already installed"
  fi
  
  # Backend dependencies
  info "Installing backend dependencies..."
  cd backend
  if [ ! -d "node_modules" ]; then
    npm install
    success "Backend dependencies installed"
  else
    success "Backend dependencies already installed"
  fi
  cd ..
  
  # Create .env files
  info "Creating environment configuration files..."
  
  # Backend .env
  if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'EOF'
# ============ MONGODBCONFIGURATION ============
MONGO_URI=mongodb://localhost:27017/eldercare
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eldercare

# ============ AUTHENTICATION ============
JWT_SECRET=your_very_secure_secret_key_min_32_chars_123456
JWT_EXPIRE=7d

# ============ FIREBASE CONFIGURATION ============
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your_private_key_from_service_account
FIREBASE_CLIENT_EMAIL=your-email@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# ============ TWILIO CONFIGURATION ============
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# ============ APPLICATION CONFIGURATION ============
PORT=5000
NODE_ENV=development
LOG_LEVEL=debug

# ============ NOTIFICATION SETTINGS ============
NOTIFICATION_RESEND_INTERVAL=5
ESCALATION_DELAY_MINUTES=30

# ============ CORS CONFIGURATION ============
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:4173
EOF
    success "Created backend/.env"
    info "⚠️  UPDATE THE FOLLOWING IN backend/.env:"
    info "   - MONGO_URI: Your MongoDB connection string"
    info "   - JWT_SECRET: Generate a secure key (min 32 chars)"
    info "   - FIREBASE_*: Get from Firebase Console"
    info "   - TWILIO_*: Get from Twilio Dashboard"
  else
    info "backend/.env already exists (skipping)"
  fi
  
  # Frontend .env
  if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key_from_web_push
EOF
    success "Created .env.local"
    info "⚠️  UPDATE REACT_APP_VAPID_PUBLIC_KEY in .env.local"
  fi
  
  success "Dependency installation complete"
}

# ============ PHASE 3: LOCAL DEVELOPMENT SETUP ============

setup_local_development() {
  banner "3/4: Local Development Setup"
  
  # Start MongoDB
  info "Database Setup"
  if ! pgrep -x "mongod" > /dev/null; then
    prompt "MongoDB not running. Start it now? (y/n)"
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
      info "Starting MongoDB..."
      if command -v mongod &> /dev/null; then
        mongod --dbpath ./data &
        sleep 3
        success "MongoDB started on port 27017"
      else
        error "MongoDB not found. Please install it first."
      fi
    fi
  else
    success "MongoDB is already running"
  fi
  
  # Seed database
  info "Database Seeding"
  prompt "Seed database with sample data? (y/n)"
  if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
    cd backend
    npm run seed
    cd ..
    success "Database seeded with sample data"
  fi
  
  # Create development scripts
  info "Creating development helper scripts..."
  
  # Dev start script
  cat > dev-start.sh << 'EOF'
#!/bin/bash
echo "Starting ElderCare+ Development Environment..."
echo "1. Frontend (Vite) → http://localhost:5173"
echo "2. Backend (Express) → http://localhost:5000"
echo "Press Ctrl+C to stop"
echo ""

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend
cd ..
npm run dev &
FRONTEND_PID=$!

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
EOF
  
  chmod +x dev-start.sh
  success "Created dev-start.sh"
  
  success "Local development setup complete"
}

# ============ PHASE 4: VALIDATION & TESTING ============

validate_setup() {
  banner "4/4: Validation & Testing"
  
  info "Running validation checks..."
  
  # Check backend
  info "Starting backend for testing..."
  cd backend
  npm run dev &
  BACKEND_PID=$!
  sleep 5
  
  # Test health endpoint
  info "Testing backend health..."
  if curl -s http://localhost:5000/health | grep -q "ok"; then
    success "Backend is running and responding"
  else
    error "Backend health check failed"
  fi
  
  # Kill backend
  kill $BACKEND_PID 2>/dev/null || true
  
  cd ..
  
  # Run test suite
  info "Running automated test suite..."
  prompt "Run e2e tests now? (y/n)"
  if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
    bash run-e2e-tests.sh
  fi
  
  success "Setup validation complete"
}

# ============ GENERATE IMPLEMENTATION GUIDE ============

create_implementation_guide() {
  cat > IMPLEMENTATION_STEPS.md << 'EOF'
# ElderCare+ Implementation Guide

## Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Configure environment
# Edit backend/.env with your Firebase, Twilio, MongoDB credentials

# 3. Start development
bash dev-start.sh
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

## Frontend Integration Checklist

### Step 1: Update LoginScreen Component
File: `src/app/components/LoginScreen.updated.tsx`
- [ ] Copy code from LoginScreen.updated.tsx
- [ ] Replace current LoginScreen.tsx
- [ ] Verify login calls apiService.login()
- [ ] Test token is saved to localStorage

### Step 2: Update MedicineListScreen Component
File: `src/app/components/MedicineListScreen.updated.tsx`
- [ ] Copy code from MedicineListScreen.updated.tsx
- [ ] Replace current MedicineListScreen.tsx
- [ ] Verify medicines load from backend
- [ ] Test confirmation updates backend
- [ ] Test cache refresh works

### Step 3: Update EmergencySOSScreen Component
File: `src/app/components/EmergencySOSScreen.updated.tsx`
- [ ] Copy code from EmergencySOSScreen.updated.tsx
- [ ] Replace current EmergencySOSScreen.tsx
- [ ] Verify location permissions requested
- [ ] Test SOS trigger sends notifications
- [ ] Test cancel works within 10 seconds

### Step 4: Register Service Worker
File: `public/service-worker.js`
- [ ] Verify service worker is registered on app load
- [ ] Test offline functionality
- [ ] Check push notifications are received

## Backend Integration Checklist

### Step 1: Configure External Services

#### MongoDB
- [ ] Create cluster at mongodb.com/cloud/atlas
- [ ] Get connection string
- [ ] Update MONGO_URI in .env

#### Firebase
- [ ] Create project at firebase.google.com
- [ ] Download service account JSON
- [ ] Extract credentials and update .env:
  - FIREBASE_PROJECT_ID
  - FIREBASE_PRIVATE_KEY
  - FIREBASE_CLIENT_EMAIL

#### Twilio
- [ ] Create account at twilio.com
- [ ] Get Account SID and Auth Token
- [ ] Get phone number
- [ ] Update .env:
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_PHONE_NUMBER

### Step 2: Setup Push Notifications
```bash
# Generate VAPID key
node -e "const webpush = require('web-push'); console.log(webpush.generateVAPIDKeys())"

# Add to backend/.env and frontend/.env.local
```

### Step 3: Database Setup
```bash
# Start MongoDB
mongod

# Seed data (optional)
cd backend && npm run seed
```

### Step 4: Start Backend
```bash
cd backend
npm run dev
# Should start on http://localhost:5000
```

## Testing Checklist

### Unit Tests
```bash
cd backend
npm test
```

### Integration Tests
```bash
bash run-tests.sh
```

### End-to-End Tests
```bash
bash run-e2e-tests.sh
```

### Manual Testing
- [ ] Register new user
- [ ] Add medicine with scheduled times
- [ ] Receive push notification at scheduled time
- [ ] Confirm medicine taken
- [ ] Wait 30+ min and verify escalation SMS sent
- [ ] Trigger Emergency SOS
- [ ] Verify offline functionality with Service Worker
- [ ] Test on multiple browsers

## Deployment Checklist

### Heroku Deployment
```bash
# Create app
heroku create eldercare-app

# Set env vars
heroku config:set JWT_SECRET=your_secret
heroku config:set FIREBASE_PROJECT_ID=your_id
# ... set other variables

# Deploy
git push heroku main

# Monitor
heroku logs --tail
```

### AWS EC2 Deployment
- [ ] Launch t2.small instance
- [ ] Install Node.js, nginx, MongoDB
- [ ] Configure security groups (80, 443, 5000)
- [ ] Deploy app with PM2
- [ ] Setup nginx reverse proxy
- [ ] Install SSL certificate

### Railway Deployment
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Deploy (automatic on git push)
- [ ] Connect MongoDB addon

## Performance Optimization

### For 100-500 Users
- [x] Basic setup
- [ ] Add indexes to MongoDB
- [ ] Enable caching with Redis (optional)

### For 1000-5000 Users
- [ ] Setup Redis cache layer
- [ ] Add database read replicas
- [ ] Implement message queues (Bull)
- [ ] Setup monitoring (Prometheus)

### For 5000+ Users
- [ ] Configure load balancing (Nginx)
- [ ] Database sharding
- [ ] CDN for static assets
- [ ] Advanced monitoring (Datadog)
- [ ] Disaster recovery plan

## Troubleshooting

### Backend won't start
```bash
# Check port 5000 is not in use
lsof -i :5000

# Check MongoDB connection
mongo mongodb://localhost:27017/eldercare

# Check .env is correctly configured
cat backend/.env | grep -E "MONGO|JWT"
```

### Frontend can't connect to backend
```bash
# Check CORS_ORIGINS in backend/.env includes frontend URL
# Check backend is running: curl http://localhost:5000/health
# Check API_URL in frontend matches backend
```

### Firebase notifications not working
```bash
# Verify Firebase credentials in .env
# Check VAPID key is generated correctly
# Enable notifications in browser settings
```

### Escalation alerts not sending
```bash
# Check Twilio credentials
# Verify phone numbers are in E.164 format (+1234567890)
# Check scheduler logs: npm run logs
```

## Next Steps After Deployment

1. **Monitor Production**
   - Setup error tracking (Sentry)
   - Monitor API response times (Datadog)
   - Track database performance

2. **Collect User Feedback**
   - Add user feedback widget
   - Track feature usage
   - Identify pain points

3. **Scale to 10,000+ Users**
   - Follow SCALABILITY_GUIDE.md
   - Load test before scaling
   - Gradually increase infrastructure

4. **Continuous Improvement**
   - Regular security audits
   - Performance optimization
   - Feature development based on feedback

## Resources

- Frontend Integration: IMPLEMENTATION_GUIDE.md
- Deployment: DEPLOYMENT_PLATFORMS.md
- Scalability: SCALABILITY_GUIDE.md
- API Documentation: backend/README.md
- Architecture: ARCHITECTURE.md
EOF
  
  success "Created IMPLEMENTATION_STEPS.md"
}

# ============ MAIN EXECUTION ============

main() {
  banner "ElderCare+ Complete Setup"
  
  echo "This script will setup ElderCare+ for:"
  echo "1. Local development & testing"
  echo "2. Production deployment"
  echo "3. Scalability to thousands of users"
  echo ""
  
  prompt "Continue with full setup? (y/n)"
  if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
    info "Setup cancelled"
    exit 0
  fi
  
  # Run all phases
  setup_environment
  install_dependencies
  setup_local_development
  validate_setup
  create_implementation_guide
  
  # Final summary
  echo ""
  echo -e "${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${MAGENTA}║            Setup Complete! 🎉                          ║${NC}"
  echo -e "${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  echo -e "${GREEN}Next Steps:${NC}"
  echo "1. Edit backend/.env with your credentials"
  echo "2. Start development: bash dev-start.sh"
  echo "3. Open frontend: http://localhost:5173"
  echo "4. Run tests: bash run-e2e-tests.sh"
  echo ""
  
  echo -e "${GREEN}Documentation:${NC}"
  echo "- Implementation: IMPLEMENTATION_STEPS.md"
  echo "- Deployment: DEPLOYMENT_PLATFORMS.md"
  echo "- Scalability: SCALABILITY_GUIDE.md"
  echo "- Architecture: ARCHITECTURE.md"
  echo ""
}

# Run if executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi
