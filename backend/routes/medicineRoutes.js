import express from 'express';
import { verifyJWT } from '../middleware/auth.js';
import * as medicineController from '../controllers/medicineController.js';

const router = express.Router();

// ============ MEDICINE ROUTES ============

// Get all medicines for user
router.get('/', verifyJWT, medicineController.getAllMedicines);

// Get 30-day adherence stats (must be before /:medicineId routes)
router.get('/adherence/30days', verifyJWT, medicineController.getAdherenceStats);

// Get today's medicines
router.get('/today/list', verifyJWT, medicineController.getTodaysMedicines);

// Get single medicine
router.get('/:medicineId', verifyJWT, medicineController.getMedicine);

// Add new medicine
router.post('/', verifyJWT, medicineController.addMedicine);

// Update medicine
router.put('/:medicineId', verifyJWT, medicineController.updateMedicine);

// Delete medicine
router.delete('/:medicineId', verifyJWT, medicineController.deleteMedicine);

// Mark medicine as taken
router.post('/:medicineId/confirm', verifyJWT, medicineController.confirmMedicineTaken);

// Get medicine confirmations for a date
router.get('/:medicineId/confirmations', verifyJWT, medicineController.getMedicineConfirmations);

export default router;

