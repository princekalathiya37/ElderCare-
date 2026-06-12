import express from 'express';
import * as supportController from '../controllers/supportController.js';

const router = express.Router();

// All routes are JWT-protected (applied in server.js)
router.post('/query', supportController.submitQuery);
router.get('/queries', supportController.getMyQueries);

export default router;
