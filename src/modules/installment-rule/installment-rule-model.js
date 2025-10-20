// models/InstallmentRuleModel.js (CÓDIGO CORRIGIDO)

import mongoose from 'mongoose';

// 1. InstallmentRuleDetailSchema (Correto como subdocumento)
// Não precisa de `timestamps`, pois é um subdocumento.
const InstallmentRuleDetailSchema = new mongoose.Schema(
  {
    installments: {
      type: Number,
      required: true,
      min: 1,
    },
    interest_rate_percentage: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false, // Opção passada corretamente como 2º argumento
  }
);

// 2. InstallmentRuleSchema (Schema Principal)
const InstallmentRuleSchema = new mongoose.Schema(
  {
    // <-- Primeiro Objeto: DEFINIÇÃO DOS CAMPOS
    min_purchase_value: {
      type: Number,
      required: true,
      min: 0,
      unique: true,
    },
    rules: {
      type: [InstallmentRuleDetailSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message:
          'A regra de parcelamento deve ter pelo menos uma opção de parcela.',
      },
    },
  },
  {
    // <-- Segundo Objeto: OPÇÕES DO SCHEMA
    timestamps: true,
  }
);

const InstallmentRule = mongoose.model(
  'InstallmentRule',
  InstallmentRuleSchema
);

export default InstallmentRule;
