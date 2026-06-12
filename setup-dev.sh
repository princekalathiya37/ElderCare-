#!/bin/bash

# ============================================
# ElderCare+ LOCAL DEVELOPMENT SETUP SCRIPT
# ============================================

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     ElderCare+ Local Development Environment Setup            ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Check prerequisites
echo -e "\n📋 Checking Prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js v16+"
    exit 1
fi
echo "✅ Node.js $(node --version)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm $(npm --version)"

# Check for optional MongoDB
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB installed (local)"
else
    echo "⚠️  MongoDB not found locally. Configure MongoDB Atlas in .env"
fi

# Backend Setup
echo -e "\n📦 Setting up Backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install --legacy-peer-deps
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Edit .env with your credentials:"
    echo "   - MONGO_URI"
    echo "   - Firebase credentials"
    echo "   - Twilio credentials"
fi

echo "✅ Backend setup complete"

# Frontend Setup
echo -e "\n📱 Setting up Frontend..."
cd ..

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --legacy-peer-deps
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cat > .env.local << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key_here
EOF
    echo "⚠️  Edit .env.local with your VAPID key"
fi

echo "✅ Frontend setup complete"

# MongoDB Setup
echo -e "\n🗄️  Database Setup..."

if [ -f "backend/.env" ]; then
    if grep -q "mongodb://localhost" backend/.env; then
        echo "Checking local MongoDB..."
        if ! pgrep -x "mongod" > /dev/null; then
            echo "⚠️  MongoDB not running. Start with: mongod"
            echo "Or update MONGO_URI in backend/.env to use MongoDB Atlas"
        else
            echo "✅ MongoDB running locally"
        fi
    else
        echo "✅ Using MongoDB Atlas (cloud)"
    fi
fi

# Create test user
echo -e "\n👤 Setting up Test User..."
cat > backend/test-setup.json << 'EOF'
{
  "register": {
    "email": "test@eldercare.com",
    "password": "Test@123456",
    "name": "Test Elder",
    "phone": "+1234567890",
    "role": "elder"
  },
  "medicine": {
    "name": "Aspirin",
    "dosage": "100mg",
    "frequency": "once-daily",
    "scheduledTimes": ["8:00 AM"],
    "smsContact": "+1234567890",
    "smsAlert": true,
    "pushNotification": true
  },
  "emergencyContacts": [
    {
      "name": "Jane Doe",
      "phone": "+1234567891",
      "email": "jane@example.com",
      "relationship": "Daughter"
    }
  ]
}
EOF
echo "✅ Test setup JSON created"

# Summary
echo -e "\n╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ Setup Complete!                               ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║ NEXT STEPS:                                                    ║"
echo "║                                                                ║"
echo "║ 1. Edit credentials:                                           ║"
echo "║    • backend/.env (MongoDB, Firebase, Twilio)                 ║"
echo "║    • .env.local (VAPID key)                                   ║"
echo "║                                                                ║"
echo "║ 2. Start MongoDB (if using local):                            ║"
echo "║    $ mongod                                                   ║"
echo "║                                                                ║"
echo "║ 3. Start Backend (Terminal 1):                                ║"
echo "║    $ cd backend && npm run dev                               ║"
echo "║                                                                ║"
echo "║ 4. Start Frontend (Terminal 2):                               ║"
echo "║    $ npm run dev                                             ║"
echo "║                                                                ║"
echo "║ 5. Run tests:                                                 ║"
echo "║    $ bash run-tests.sh                                       ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
