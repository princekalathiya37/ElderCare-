import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDatabase from './config/database.js';
import { verifyJWT, errorHandler, rateLimiter } from './middleware/auth.js';
import { startMedicineReminderScheduler, startEscalationScheduler, startDailyResetScheduler } from './services/schedulerService.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import sosRoutes from './routes/sosRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import supportRoutes from './routes/supportRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://yourdomain.com'
];
if (process.env.FRONTEND_URL) {
  // Allow multiple URLs separated by comma or just a single URL
  if (process.env.FRONTEND_URL.includes(',')) {
    allowedOrigins.push(...process.env.FRONTEND_URL.split(',').map(url => url.trim()));
  } else {
    allowedOrigins.push(process.env.FRONTEND_URL.trim());
  }
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(rateLimiter(100, 60000)); // 100 requests per minute

// ============ DATABASE CONNECTION ============
connectDatabase();

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date(),
    diagnostics: {
      emailConfigured: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      firebaseConfigured: Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL),
      googleAuthConfigured: Boolean(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/medicines', verifyJWT, medicineRoutes);
app.use('/api/sos', verifyJWT, sosRoutes);
app.use('/api/appointments', verifyJWT, appointmentRoutes);
app.use('/api/support', verifyJWT, supportRoutes);

// ============ ERROR HANDLING ============
app.use(errorHandler);

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║     ElderCare+ Backend Server Started     ║
╠══════════════════════════════════════════╣
║ 🚀 Server running on port: ${PORT}         
║ 📝 Environment: ${process.env.NODE_ENV || 'development'}
║ 🔌 Database: Connected
║ 📱 API Base: http://localhost:${PORT}/api
╚══════════════════════════════════════════╝
  `);

  // Start background schedulers
  startMedicineReminderScheduler();
  startEscalationScheduler();
  startDailyResetScheduler();
});

export default app;
