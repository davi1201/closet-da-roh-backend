// src/modules/availability/availability-service.js

import availabilityRepository from './availability-repository.js';

/**
 * Cria um ou mais slots de disponibilidade.
 * @param {Array<Object>} slotsData - Um array de objetos, cada um contendo { startTime: string, endTime: string } em ISO UTC.
 * @returns {Promise<Array<Object>>} Os slots criados.
 */
async function createAvailabilitySlots(slotsData) {
  if (!Array.isArray(slotsData) || slotsData.length === 0) {
    throw new Error('Dados de slots inválidos ou vazios.');
  }

  const slotsToCreate = [];
  for (const slot of slotsData) {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);

    // Validação básica
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error(
        `Datas inválidas fornecidas: ${slot.startTime}, ${slot.endTime}`
      );
    }
    if (endTime <= startTime) {
      throw new Error(
        `O horário de término (${slot.endTime}) deve ser posterior ao horário de início (${slot.startTime}).`
      );
    }
    // TODO: Adicionar verificação de sobreposição com slots existentes, se necessário.

    slotsToCreate.push({
      startTime: startTime,
      endTime: endTime,
      isBooked: false, // Garante que começa como não reservado
      appointment: null,
    });
  }

  // Usa createMany para eficiência
  const createdSlots = await availabilityRepository.createMany(slotsToCreate);
  return createdSlots;
}

/**
 * Remove um slot de disponibilidade (se não estiver reservado).
 * @param {string} slotId - O ID do slot a ser removido.
 * @returns {Promise<Object>} O slot removido.
 */
async function deleteAvailabilitySlot(slotId) {
  const slot = await availabilityRepository.findById(slotId);

  if (!slot) {
    throw new Error('Slot de disponibilidade não encontrado.');
  }

  // Regra de negócio: Não permitir remover um slot já agendado
  if (slot.isBooked) {
    throw new Error('Não é possível remover um horário que já está agendado.');
  }

  return await availabilityRepository.remove(slotId);
}

/**
 * (Para Admin) Busca todos os slots (livres e ocupados) em um período.
 * @param {string} startDate - Data de início (YYYY-MM-DD ou ISO String)
 * @param {string} endDate - Data de fim (YYYY-MM-DD ou ISO String)
 * @returns {Promise<Array<Object>>} Lista de slots com detalhes do agendamento (se houver).
 */
async function getAdminAvailability(startDate, endDate) {
  // Adicionar validação das datas se necessário
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  return await availabilityRepository.findByDateRange(start, end);
}

async function getAvailableDaysInMonth(year, month) {
  if (!year || !month || month < 1 || month > 12) {
    throw new Error('Ano e mês inválidos.');
  }

  const jsMonth = month - 1; // Mês 0-indexado para JS Date

  // --- CORREÇÃO APLICADA AQUI ---
  // 1. Calcula o início do mês solicitado (UTC)
  const startOfMonthUTC = new Date(Date.UTC(year, jsMonth, 1));
  // 2. Calcula o fim do mês solicitado (UTC) - início do próximo mês
  const endOfMonthUTC = new Date(Date.UTC(year, jsMonth + 1, 1));

  // 3. Calcula o início do dia ATUAL (UTC)
  const today = new Date(); // Data e hora atual do servidor
  const startOfTodayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  ); // Ignora a hora

  // 4. Determina a data de início REAL da busca:
  //    Será o início do dia atual OU o início do mês, o que for MAIS RECENTE.
  //    Isso evita buscar dias passados no mês atual e meses passados.
  const queryStartDate =
    startOfMonthUTC > startOfTodayUTC ? startOfMonthUTC : startOfTodayUTC;
  // --- FIM DA CORREÇÃO ---

  // 5. Busca os startTimes dos slots disponíveis usando a data de início ajustada
  //    A função do repositório NÃO precisa mais da condição 'now'
  const availableSlotsTimes =
    await availabilityRepository.findAvailableDatesInRange(
      queryStartDate, // Usa a data de início calculada
      endOfMonthUTC // Fim do mês continua o mesmo
    );

  // Extrai apenas a parte da data (YYYY-MM-DD) em UTC e remove duplicatas
  const availableDatesUTC = availableSlotsTimes.map(
    (slot) => slot.startTime.toISOString().split('T')[0]
  );
  const uniqueDates = [...new Set(availableDatesUTC)];

  return uniqueDates;
}

export {
  createAvailabilitySlots,
  deleteAvailabilitySlot,
  getAdminAvailability,
  getAvailableDaysInMonth,
};
