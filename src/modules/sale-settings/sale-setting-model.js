import mongoose from 'mongoose';

// --- Sub-Schema 1: PaymentMethodSchema (Sem alterações relevantes) ---
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
  { _id: false }
);

// --- Sub-Schema 2: InstallmentRuleDetailSchema ---
// Define as taxas de juros para um número específico de parcelas.
const InstallmentRuleDetailSchema = new mongoose.Schema(
  {
    installments: {
      type: Number,
      required: true,
      min: 1,
    },
    interest_rate_percentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    // Você pode adicionar 'description' aqui, se o front depender disso.
  },
  { _id: false }
);

// --- Sub-Schema 3: InstallmentRuleSchema (A Regra Mãe - Tier) ---
// Define um conjunto de regras de juros aplicável a partir de um valor mínimo.
const InstallmentRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'Regra Padrão',
    },
    min_purchase_value: {
      type: Number,
      required: true,
      default: 0, // CRÍTICO: 0 para cobrir todas as vendas
      min: 0,
    },
    rules: {
      type: [InstallmentRuleDetailSchema],
      required: true,
      default: [],
    },
  },
  { _id: true } // Manteve o _id para permitir manipulação individual das regras se necessário
);

// -------------------------------------------------------------------
// --- Schema Principal: SaleSettingSchema ---
// -------------------------------------------------------------------
const SaleSettingSchema = new mongoose.Schema(
  {
    default_margin_percentage: {
      type: Number,
      required: true,
      default: 30,
      min: 0,
    },
    payment_methods: {
      type: [PaymentMethodSchema],
      required: true,
      // Mantenha seu default de métodos de pagamento aqui
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
    // ✅ CAMPO CRÍTICO ADICIONADO: Regras de Parcelamento
    installment_rules: {
      type: [InstallmentRuleSchema],
      required: true,
      // Pelo menos uma regra padrão deve existir
      default: [
        {
          name: 'Padrão Geral',
          min_purchase_value: 0,
          rules: [
            { installments: 1, interest_rate_percentage: 0 },
            { installments: 2, interest_rate_percentage: 5.5 },
            { installments: 3, interest_rate_percentage: 6.5 },
          ],
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Sua indexação para forçar o Singleton
SaleSettingSchema.index(
  { default_margin_percentage: 1 },
  {
    unique: true,
    partialFilterExpression: { default_margin_percentage: { $exists: true } },
  }
);

const SaleSetting = mongoose.model('SaleSetting', SaleSettingSchema);

export default SaleSetting;
