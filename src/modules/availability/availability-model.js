import mongoose from 'mongoose';

const AvailabilitySchema = new mongoose.Schema(
  {
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Referência ao agendamento que reservou este slot
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Availability = mongoose.model('Availability', AvailabilitySchema);
export default Availability;
