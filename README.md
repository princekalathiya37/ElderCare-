# 💚 ElderCare+

ElderCare+ is a modern, production-ready healthcare application designed to support elderly users with medication adherence and emergency safety. The application features automatic notifications, confirmation tracking, caregiver escalations, emergency SOS alerts, background sync, and offline support.

## 📱 Core Features

1. **Daily Medicine Reminders**: Push and SMS notifications at scheduled times (works in background).
2. **Confirmation System**: Tapping "Mark Taken" records confirmation in the database to prevent escalations.
3. **30-Min Escalation**: Automatic SMS notification to caregiver if medication is not confirmed within 30 minutes.
4. **Emergency SOS**: One-tap emergency alert with GPS location sharing and SMS broadcasts to contacts.
5. **Background Support**: Runs background notifications when the app is closed using service workers.
6. **Offline Support**: Offline cache strategy via Service Worker + IndexedDB with automatic online syncing.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** (local or Atlas)

### 2. Installation
Install frontend and backend dependencies:
```bash
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### 3. Environment Configuration
Copy the template `.env.example` file to `.env` in the `backend` directory:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your actual MongoDB connection string, JWT secrets, Twilio credentials, and Firebase configuration.
*(For Firebase setup details, see [FIREBASE_SETUP.md](file:///c:/Users/DELL/Downloads/ElderCare+/docs/FIREBASE_SETUP.md))*

### 4. Running the App
To start the application, run the backend and frontend development servers in separate terminals:

**Terminal 1 (Backend)**:
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```

---

## 📚 Documentation Map

To keep the project clean, similar documentation files have been consolidated. Please refer to the specific files below for detailed guides:

- 🏗️ **System Architecture**: [ARCHITECTURE.md](file:///c:/Users/DELL/Downloads/ElderCare+/docs/ARCHITECTURE.md) - Deep-dive into design, schemas, and data flow.
- 🚀 **Deployment Guides**: [DEPLOYMENT.md](file:///c:/Users/DELL/Downloads/ElderCare+/docs/DEPLOYMENT.md) - Setup on Heroku, AWS, Railway, Vercel, and Docker.
- ⚙️ **Windows Setup**: [WINDOWS_SETUP.md](file:///c:/Users/DELL/Downloads/ElderCare+/docs/WINDOWS_SETUP.md) - PowerShell commands and troubleshooting for Windows.
- 📈 **Scalability Guide**: [SCALABILITY_GUIDE.md](file:///c:/Users/DELL/Downloads/ElderCare+/docs/SCALABILITY_GUIDE.md) - Optimization roadmap to 10,000+ users.
- ⚠️ **Firebase Setup**: [FIREBASE_SETUP.md](file:///c:/Users/DELL/Downloads/ElderCare+/docs/FIREBASE_SETUP.md) - Step-by-step FCM credential generation.
- 💻 **Frontend Integration**: [IMPLEMENTATION_GUIDE.md](file:///c:/Users/DELL/Downloads/ElderCare+/docs/IMPLEMENTATION_GUIDE.md) - React integration code examples.
- 📋 **Launch Checklist**: [LAUNCH_CHECKLIST.md](file:///c:/Users/DELL/Downloads/ElderCare+/docs/LAUNCH_CHECKLIST.md) - Pre-launch checklist, security, and metrics.
- 🔙 **Backend Guide**: [backend/README.md](file:///c:/Users/DELL/Downloads/ElderCare+/backend/README.md) - 19 API endpoints reference.

---

## 📁 Repository Structure

```
ElderCare+/
├── backend/                  # Express.js Server
│   ├── config/               # DB connections
│   ├── controllers/          # Endpoints logic (auth, medicine, sos)
│   ├── models/               # MongoDB models (User, Medicine, SOS, Notification)
│   ├── routes/               # API routes definitions
│   ├── services/             # Firebase/Twilio, scheduler, cache, queues
│   └── README.md             # Backend setup & API endpoints guide
├── frontend/                 # Frontend Application (React + Vite + TypeScript)
│   ├── src/                  # Source files (components, services, views)
│   ├── public/               # Service worker & assets
│   ├── package.json          # Frontend dependencies config
│   └── vite.config.ts        # Vite build tool config
└── docs/                     # Consolidated project documentation
```

---

## 🛡️ License & Attributions

- Components from [shadcn/ui](https://ui.shadcn.com/) used under the [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).
- Images from [Unsplash](https://unsplash.com) used under the [Unsplash license](https://unsplash.com/license).
