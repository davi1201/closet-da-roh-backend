import express from 'express';
import { getPublicSlots, bookAppointment } from './appointment-controller.js';

const router = express.Router();

router.get('/slots', getPublicSlots);

router.post('/', bookAppointment);

export const appointmentRoutes = router;
