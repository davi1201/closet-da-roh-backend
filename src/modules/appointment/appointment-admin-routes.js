import express from 'express';
import {
  getAppointments,
  cancelAppointment,
} from './appointment-controller.js';

const router = express.Router();

router.get('/', getAppointments);

router.delete('/:id/cancel', cancelAppointment);

export const appointmentRoutes = router;
