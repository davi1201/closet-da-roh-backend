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
      .populate('client', 'name') // Popula dados básicos do cliente
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

  async countUpcoming(todayStart) {
    return await Appointment.countDocuments({
      status: 'confirmed',
      startTime: { $gte: todayStart },
    });
  }

  async findRecent(limit = 5) {
    return await Appointment.find({ status: 'confirmed' })
      .sort({ startTime: 1 }) // Pega os mais próximos (pode ser -1 se quiser os recém-criados)
      .limit(limit)
      .populate('client', 'name') // Popula apenas o nome do cliente
      .lean();
  }
}

export default new AppointmentRepository();
