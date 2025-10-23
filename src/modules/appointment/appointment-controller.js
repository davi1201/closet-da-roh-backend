import asyncHandler from 'express-async-handler';
import * as appointmentService from './appointment-service.js';

// (CLIENTE) GET /public/slots?date=2025-10-30
const getPublicSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: 'A data é obrigatória.' });
  }
  const slots = await appointmentService.getPublicSlotsByDay(date);
  res.json(slots);
});

const bookAppointment = asyncHandler(async (req, res) => {
  const data = req.body;
  const newAppointment = await appointmentService.bookAppointment(data);
  res.status(201).json(newAppointment);
});

const getAppointments = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const appointments = await appointmentService.getAdminAppointments(
    startDate,
    endDate
  );
  res.json(appointments);
});

// (ADMIN) PUT /appointments/:id/cancel
const cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await appointmentService.cancelAppointment(id);
  res.json(appointment);
});

export { getPublicSlots, bookAppointment, getAppointments, cancelAppointment };
