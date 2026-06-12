import express from 'express';
import { verifyJWT } from '../middleware/auth.js';
import * as sosController from '../controllers/sosController.js';

const router = express.Router();

// ============ EMERGENCY SOS ROUTES ============

// Trigger Emergency SOS
router.post('/trigger', verifyJWT, sosController.triggerEmergencySOS);

// Get active SOS alerts
router.get('/active', verifyJWT, sosController.getActiveSOS);

// Resolve SOS alert
router.post('/:sosId/resolve', verifyJWT, sosController.resolveSOS);

// Get SOS history
router.get('/history', verifyJWT, sosController.getSOSHistory);

export default router;
