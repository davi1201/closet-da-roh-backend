import mongoose from 'mongoose';

// --- Sub-Schema: PaymentMethodSchema ---
const PaymentMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['A Vista', 'Cartão', 'Pix', 'Prazo'],
    },
    key: {
      type: String,
      required: true,
      // Note: 'unique: true' aqui causará problemas se você tiver múltiplos documentos de SaleSetting,
      // mas já que SaleSetting deve ser Singleton, vamos mantê-lo.
      enum: ['cash', 'card', 'pix', 'credit'],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    discount_percentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    max_installments: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    // 💡 Sub-schemas geralmente não precisam de timestamps, mas podem ter outras opções
    _id: false, // É bom para subdocumentos em arrays
  }
);

// --- Schema Principal: SaleSettingSchema ---
const SaleSettingSchema = new mongoose.Schema(
  {
    // <-- Primeiro Objeto: DEFINIÇÃO DOS CAMPOS
    default_margin_percentage: {
      type: Number,
      required: true,
      default: 30,
      min: 0,
    },
    payment_methods: {
      type: [PaymentMethodSchema],
      required: true,
      default: [
        {
          name: 'A Vista',
          key: 'cash',
          discount_percentage: 5,
          max_installments: 1,
        },
        {
          name: 'Cartão',
          key: 'card',
          discount_percentage: 0,
          max_installments: 12,
        },
        {
          name: 'Pix',
          key: 'pix',
          discount_percentage: 3,
          max_installments: 1,
        },
        {
          name: 'Prazo',
          key: 'credit',
          discount_percentage: 0,
          max_installments: 4,
        },
      ],
    },
  },
  {
    // <-- Segundo Objeto: OPÇÕES DO SCHEMA
    // ✅ CORRIGIDO: timestamps: true deve ser passado aqui.
    timestamps: true,
  }
);

SaleSettingSchema.index(
  { default_margin_percentage: 1 },
  {
    unique: true,
    // Esta indexação é útil para forçar o Singleton, garantindo que
    // apenas um documento com default_margin_percentage exista.
    partialFilterExpression: { default_margin_percentage: { $exists: true } },
  }
);

const SaleSetting = mongoose.model('SaleSetting', SaleSettingSchema);

export default SaleSetting;
