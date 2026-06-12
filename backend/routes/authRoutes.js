import express from 'express';
import { verifyJWT } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// ============ AUTH ROUTES ============

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Google Login
router.post('/google', authController.googleLogin);

// Update profile
router.put('/profile', verifyJWT, authController.updateProfile);

// Update FCM Token (for push notifications)
router.post('/update-fcm', verifyJWT, authController.updateFCMToken);

// Save push subscription (for browser push)
router.post('/subscribe', verifyJWT, authController.savePushSubscription);

// Update emergency contacts
router.post('/emergency-contacts', verifyJWT, authController.updateEmergencyContacts);

// Get user profile
router.get('/profile', verifyJWT, authController.getUserProfile);

// Update notification preferences
router.put('/notification-preferences', verifyJWT, authController.updateNotificationPreferences);

export default router;
