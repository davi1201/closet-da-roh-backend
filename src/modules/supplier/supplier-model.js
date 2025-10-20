import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        'Por favor, insira um e-mail válido.',
      ],
    },
    contact_person: {
      type: String,
      trim: true,
      required: [true, 'O nome da pessoa de contato é obrigatório.'],
    },

    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip_code: { type: String, trim: true },
    },
  },
  { _id: false }
);

const SupplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'O nome do fornecedor é obrigatório.'],
      trim: true,
      unique: true,
    },

    document_type: {
      type: String,
      enum: ['CNPJ', 'CPF', 'OUTRO'],
      default: 'CNPJ',
    },
    document_number: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },

    contact: {
      type: ContactSchema,
      required: [true, 'Informações de contato são obrigatórias.'],
    },

    notes: {
      type: String,
      trim: true,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Supplier', SupplierSchema);
