import Availability from './availability-model.js';

class AvailabilityRepository {
  async create(data) {
    const availability = new Availability(data);
    return await availability.save();
  }

  async createMany(slots) {
    return await Availability.insertMany(slots);
  }

  async findByDateRange(startDate, endDate) {
    return await Availability.find({
      startTime: { $gte: startDate, $lte: endDate },
    })
      .populate('appointment', 'clientName clientPhone')
      .sort({ startTime: 1 })
      .lean();
  }

  async findPublicSlotsByDay(day) {
    const startOfDay = new Date(day);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(day);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return await Availability.find({
      startTime: { $gte: startOfDay, $lte: endOfDay },
    })
      .select('_id startTime endTime isBooked')
      .sort({ startTime: 1 })
      .lean();
  }

  async findById(id) {
    return await Availability.findById(id);
  }

  async bookSlot(slotId, appointmentId) {
    return await Availability.findByIdAndUpdate(
      slotId,
      { isBooked: true, appointment: appointmentId },
      { new: true }
    );
  }

  async unbookSlot(slotId) {
    return await Availability.findByIdAndUpdate(
      slotId,
      { isBooked: false, appointment: null },
      { new: true }
    );
  }

  async remove(id) {
    return await Availability.findByIdAndDelete(id);
  }

  // Ajuste aqui: removido o filtro de 'startTime: { $gte: now }'
  async findAvailableDatesInRange(startDate, endDate) {
    return await Availability.find({
      startTime: { $gte: startDate, $lt: endDate }, // Intervalo do mês/período
      isBooked: false,
    })
      .select('startTime')
      .lean();
  }
}

export default new AvailabilityRepository();
