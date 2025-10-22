import mongoose from 'mongoose';
import appointmentRepository from './appointment-repository.js';
import availabilityRepository from '../availability/availability-repository.js';
import clientRepository from '../clients/client-repository.js';

// (Lógica da CLIENTE)
// Retorna os slots (vagos e ocupados) para um dia
async function getPublicSlotsByDay(dateString) {
  // Validação da data...
  return await availabilityRepository.findPublicSlotsByDay(dateString);
}

// (Lógica da CLIENTE)
// O processo mais crítico: reservar um horário
async function bookAppointment(data) {
  const { slotId, clientName, clientPhone, clientAddress, notes } = data;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Verifica se o slot existe e AINDA está vago
    const slot = await availabilityRepository.findById(slotId, null, {
      session,
    }); // CORRECT

    if (!slot) {
      throw new Error('Horário não encontrado.');
    }
    if (slot.isBooked) {
      throw new Error(
        'Ops! Este horário acabou de ser reservado. Tente outro.'
      );
    }

    // 2. Cria o Agendamento (Appointment)
    const newAppointment = await appointmentRepository.create({
      clientName,
      clientPhone,
      clientAddress,
      notes,
      startTime: slot.startTime, // Copia os horários do slot
      endTime: slot.endTime,
      status: 'confirmed',
    });

    const newClientData = {
      name: clientName,
      phoneNumber: clientPhone,
      address: clientAddress,
      instagram: data.clientInstagram || '',
    };

    const newCLient = await clientRepository.create(newClientData);

    // 3. Atualiza (Trava) o Slot de Disponibilidade
    await availabilityRepository.bookSlot(slotId, newAppointment._id);

    // 4. Confirma a transação
    await session.commitTransaction();
    return { newAppointment, newCLient };
  } catch (error) {
    // 5. Se algo der errado, desfaz tudo
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// (Lógica do ADMIN)
// Ver agendamentos (dia/semana/mês)
async function getAdminAppointments(startDate, endDate) {
  return await appointmentRepository.findByDateRange(startDate, endDate);
}

// (Lógica do ADMIN)
// Cancelar um agendamento
async function cancelAppointment(appointmentId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // 1. Marca o agendamento como "cancelado"
    const canceledAppointment = await appointmentRepository.updateStatus(
      appointmentId,
      'canceled'
    );

    // 2. Encontra o slot que ele estava usando
    const slot = await availabilityRepository.findOne({
      appointment: appointmentId,
    });

    // 3. Libera o slot para ser reservado novamente
    if (slot) {
      await availabilityRepository.unbookSlot(slot._id);
    }

    await session.commitTransaction();
    return canceledAppointment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export {
  getPublicSlotsByDay,
  bookAppointment,
  getAdminAppointments,
  cancelAppointment,
};
