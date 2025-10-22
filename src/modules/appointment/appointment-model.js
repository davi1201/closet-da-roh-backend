import mongoose from 'mongoose';

// Sub-schema para o endereço
const AddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    number: { type: String, required: true },
    neighborhood: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true, length: 2 },
    zipCode: { type: String, required: true },
    details: { type: String }, // Ex: "Apto 101", "Casa dos fundos"
  },
  { _id: false }
);

const AppointmentSchema = new mongoose.Schema(
  {
    // Vamos armazenar os dados da cliente direto aqui
    clientName: {
      type: String,
      required: true,
    },
    clientPhone: {
      type: String,
      required: true,
    },
    clientAddress: {
      type: AddressSchema,
      required: true,
    },
    // Horários (copiados do slot para histórico)
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

const Appointment = mongoose.model('Appointment', AppointmentSchema);
export default Appointment;
