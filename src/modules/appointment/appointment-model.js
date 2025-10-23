import mongoose, { Schema } from 'mongoose';

const AppointmentSchema = new mongoose.Schema(
  {
    // O campo 'client' que referencia o outro model
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client', // Referencia o model 'Client'
      required: true,
      index: true,
    },

    // Os campos antigos (clientName, clientPhone, clientAddress)
    // devem ser REMOVIDOS daqui.

    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'canceled', 'completed'],
      default: 'confirmed',
      index: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model('Appointment', AppointmentSchema);

export default Appointment;
