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
    });

    if (!slot) {
      throw new Error('Horário não encontrado.');
    }
    if (slot.isBooked) {
      throw new Error(
        'Ops! Este horário acabou de ser reservado. Tente outro.'
      );
    }

    // 2. Encontra ou Cria o Cliente (dentro da transação)
    const clientData = {
      name: clientName,
      phoneNumber: clientPhone,
      address: clientAddress,
    };

    const client = await clientRepository.findOrCreateByPhone(clientData, {
      session,
    });

    // 3. Cria o Agendamento (Appointment) com a REFERÊNCIA
    const newAppointment = await appointmentRepository.create(
      {
        client: client._id, // Referência ao cliente
        notes,
        startTime: slot.startTime, // Copia os horários do slot
        endTime: slot.endTime,
        status: 'confirmed',
      },
      { session }
    );

    // 4. (Opcional) Vincula o agendamento ao cliente
    await clientRepository.addAppointment(client._id, newAppointment._id, {
      session,
    });

    // 5. Atualiza (Trava) o Slot de Disponibilidade
    await availabilityRepository.bookSlot(slotId, newAppointment._id, {
      session,
    });

    // 6. Confirma a transação
    await session.commitTransaction();
    return { newAppointment, client }; // Retorna o cliente (novo ou encontrado)
  } catch (error) {
    // 7. Se algo der errado, desfaz tudo
    await session.abortTransaction();
    // Garante que o erro seja propagado para o controller
    if (error.message.includes('duplicate key')) {
      throw new Error('Falha ao processar o cliente. Telefone duplicado?');
    }
    throw error;
  } finally {
    session.endSession();
  }
}

// (Lógica do ADMIN)
// Ver agendamentos (dia/semana/mês)
async function getAdminAppointments(startDate, endDate) {
  // Este populate é novo, assumindo que seu repo foi atualizado
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
      'canceled',
      { session }
    );

    if (!canceledAppointment) {
      throw new Error('Agendamento não encontrado para cancelamento.');
    }

    // 2. (Opcional) Remove o agendamento do array do cliente
    if (canceledAppointment.client) {
      await clientRepository.removeAppointment(
        canceledAppointment.client.toString(), // Garante que é string
        appointmentId,
        { session }
      );
    }

    // 3. Encontra o slot que ele estava usando
    const slot = await availabilityRepository.findOne(
      {
        appointment: appointmentId,
      },
      { session }
    );

    // 4. Libera o slot para ser reservado novamente
    if (slot) {
      await availabilityRepository.unbookSlot(slot._id, { session });
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
