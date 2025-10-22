// src/modules/availability/availability-controller.js

import asyncHandler from 'express-async-handler';
import * as availabilityService from './availability-service.js';

/**
 * Rota: POST /admin/availability
 * Body: [{ startTime: "ISO_UTC_STRING", endTime: "ISO_UTC_STRING" }, ...]
 * Cria novos slots de disponibilidade.
 */
const handleCreateAvailability = asyncHandler(async (req, res) => {
  const slotsData = req.body; // Espera um array de slots

  if (!Array.isArray(slotsData)) {
    return res
      .status(400)
      .json({ message: 'O corpo da requisição deve ser um array de slots.' });
  }

  const createdSlots = await availabilityService.createAvailabilitySlots(
    slotsData
  );
  res.status(201).json(createdSlots);
});

/**
 * Rota: DELETE /admin/availability/:id
 * Remove um slot de disponibilidade (se não agendado).
 */
const handleDeleteAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedSlot = await availabilityService.deleteAvailabilitySlot(id);
  // Se não encontrar, o service já lança erro
  res.status(200).json({
    message: 'Slot de disponibilidade removido com sucesso.',
    deletedSlot,
  });
});

/**
 * Rota: GET /admin/availability?startDate=...&endDate=...
 * Busca todos os slots (livres e ocupados) em um período.
 */
const handleGetAdminAvailability = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: 'Datas de início e fim são obrigatórias.' });
  }
  const slots = await availabilityService.getAdminAvailability(
    startDate,
    endDate
  );
  res.json(slots);
});

const handleGetAvailableDays = asyncHandler(async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res
      .status(400)
      .json({ message: 'Parâmetros "year" e "month" são obrigatórios.' });
  }

  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ message: 'Ano ou mês inválido.' });
  }

  const dates = await availabilityService.getAvailableDaysInMonth(
    yearNum,
    monthNum
  );
  res.json(dates);
});

export {
  handleCreateAvailability,
  handleDeleteAvailability,
  handleGetAdminAvailability,
  handleGetAvailableDays,
};
