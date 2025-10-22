import express from 'express';
import * as availabilityController from './availability-controller.js';

const router = express.Router();

router.post(
  '/',
  // authMiddleware, // Proteger a rota
  availabilityController.handleCreateAvailability
);

router.delete(
  '/:id',
  // authMiddleware, // Proteger a rota
  availabilityController.handleDeleteAvailability
);

router.get(
  '/',
  // authMiddleware, // Proteger a rota
  availabilityController.handleGetAdminAvailability
);

router.get('/available-days', availabilityController.handleGetAvailableDays);

export default router;
