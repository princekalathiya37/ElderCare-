import express from 'express';
import * as appointmentController from '../controllers/appointmentController.js';

const router = express.Router();

// All routes are protected via JWT (applied in server.js)
router.get('/', appointmentController.getAppointments);
router.post('/', appointmentController.addAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);

export default router;
