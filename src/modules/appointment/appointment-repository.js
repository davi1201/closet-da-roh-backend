import Appointment from './appointment-model.js';

class AppointmentRepository {
  async create(data) {
    const appointment = new Appointment(data);
    return await appointment.save();
  }

  // (Para o ADMIN) Encontra agendamentos por período
  async findByDateRange(startDate, endDate) {
    return await Appointment.find({
      status: 'confirmed',
      startTime: { $gte: startDate, $lte: endDate },
    })
      .sort({ startTime: 1 })
      .lean();
  }

  async findById(id) {
    return await Appointment.findById(id).lean();
  }

  async updateStatus(id, status) {
    return await Appointment.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    );
  }

  // Encontra o slot de disponibilidade associado a este agendamento
  async findAvailabilitySlotIdByAppointmentId(appointmentId) {
    const { availability } = await import(
      '../availability/availability-repository.js'
    );
    return await availability.findOne({ appointment: appointmentId });
  }
}

export default new AppointmentRepository();
