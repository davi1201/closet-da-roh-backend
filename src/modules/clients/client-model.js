// models/Client.ts
import mongoose from 'mongoose';
import { normalizeString, toTitleCase } from '../../utils/text-formatter.js';

const Schema = mongoose.Schema;
// --- AJUSTE: Schema do Endereço extraído ---
// Adicionado '_id: false' para não criar IDs desnecessários para o endereço
const AddressSchema = new Schema(
  {
    street: { type: String, required: false, set: toTitleCase },
    number: { type: String, required: false },
    neighborhood: { type: String, required: false, set: toTitleCase },
    city: { type: String, required: false, set: toTitleCase },
    state: { type: String, required: false, length: 2, set: toTitleCase },
    zipCode: { type: String, required: false, set: normalizeString },
    details: { type: String, uppercase: false },
  },
  { _id: false }
);

const clientSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "The client's name is mandatory."],
      trim: true,
      index: true, // Bom para performance ao buscar por nome
      set: toTitleCase, // Converte para Title Case ao salvar
    },

    // --- AJUSTE: Usando o AddressSchema ---
    address: {
      type: AddressSchema,
      required: false,
    },

    // --- AJUSTE CRÍTICO: Telefone como chave única ---
    phoneNumber: {
      type: String,
      required: [true, "The client's phone number is mandatory for contact."],
      trim: true,
      unique: true, // Impede duplicatas
      set: normalizeString,
      index: true, // Essencial para performance no login/busca
      validate: {
        validator: function (v) {
          return v.length === 10 || v.length === 11;
        },
        message: (props) =>
          `${props.value} não é um número de telefone válido!`,
      },
    },

    instagram: {
      type: String,
      trim: true,
    },

    profession: {
      type: String,
      trim: true,
      uppercase: true,
    },

    purchasingPower: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },

    observations: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: true,
    },

    desiredProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DesiredProduct',
      },
    ],

    appointments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Appointment',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

export default Client;
