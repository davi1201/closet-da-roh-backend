import mongoose from 'mongoose';
import appointmentRepository from './appointment-repository.js';
import availabilityRepository from '../availability/availability-repository.js';
import clientRepository from '../clients/client-repository.js';
import notificationService from '../notifications/notification-service.js';

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

  let newAppointment; // Declare fora do try para acesso no finally/after
  let client; // Declare fora do try

  try {
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

    const clientData = {
      name: clientName,
      phoneNumber: clientPhone,
      address: clientAddress,
    };

    client = await clientRepository.findOrCreateByPhone(clientData, {
      session,
    });

    newAppointment = await appointmentRepository.create(
      {
        client: client._id,
        notes,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'confirmed',
      },
      { session }
    );

    await clientRepository.addAppointment(client._id, newAppointment._id, {
      session,
    });
    await availabilityRepository.bookSlot(slotId, newAppointment._id, {
      session,
    });

    await session.commitTransaction(); // Transação bem-sucedida

    // --- AJUSTE 2: Chame a notificação APÓS o commit ---
    // Coloque fora da transação principal, mas dentro de um try/catch próprio
    try {
      console.log(
        '[AppointmentService] Agendamento criado com sucesso. Enviando notificação...'
      );
      // Passa o objeto do agendamento recém-criado e o nome do cliente
      await notificationService.notifyNewAppointment(
        newAppointment,
        client.name
      );
      console.log('[AppointmentService] Notificação enviada (ou tentativa).');
    } catch (notificationError) {
      // É importante capturar erros aqui para não quebrar a resposta principal
      console.error(
        '[AppointmentService] Erro ao enviar notificação APÓS agendamento:',
        notificationError
      );
      // Não relance o erro, apenas logue
    }
    // --- FIM DO AJUSTE 2 ---

    return { newAppointment, client };
  } catch (error) {
    await session.abortTransaction();
    if (error.message.includes('duplicate key')) {
      throw new Error('Falha ao processar o cliente. Telefone duplicado?');
    }
    throw error; // Relança outros erros
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
