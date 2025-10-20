import mongoose from 'mongoose';

// Sub-Schema 1: Detalhes de cada item vendido
const SaleItemSchema = new mongoose.Schema(
  {
    // Referência à variação do produto que foi vendida
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    // Captura do SKU no momento da venda (para histórico)
    sku_at_sale: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // Preço de venda unitário no momento da transação (para histórico)
    unit_sale_price: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

// Sub-Schema 2: Detalhes do Pagamento
const PaymentDetailSchema = new mongoose.Schema(
  {
    // Captura o nome da forma de pagamento (A Vista, Cartão, Pix, Prazo)
    method: {
      type: String,
      required: true,
    },
    // Se for parcelado
    installments: {
      type: Number,
      default: 1,
    },
    // Taxa de juros aplicada (se houver, 0 para sem juros)
    interest_rate_percentage: {
      type: Number,
      default: 0,
    },
    // Desconto final aplicado (além do desconto por método de pagamento)
    discount_amount: {
      type: Number,
      default: 0,
    },
    // Valor total PAGO pelo cliente (após descontos/juros)
    amount_paid: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

// Schema Principal: Sale
const SaleSchema = new mongoose.Schema(
  {
    // Referência opcional ao cliente (se for venda registrada no nome de alguém)
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer', // Assumindo que você tem um modelo Customer
      default: null,
    },

    // Array de itens vendidos
    items: {
      type: [SaleItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    // Valor total dos itens antes de qualquer desconto ou juros
    subtotal_amount: {
      type: Number,
      required: true,
    },

    // Detalhes do pagamento (método, parcelas, juros, etc.)
    payment_details: {
      type: PaymentDetailSchema,
      required: true,
    },

    // Valor total da venda APÓS todos os cálculos (o amount_paid final)
    total_amount: {
      type: Number,
      required: true,
    },

    // Status da venda: 'completed', 'pending', 'canceled'
    status: {
      type: String,
      enum: ['completed', 'pending', 'canceled'],
      default: 'completed',
    },

    // Referência opcional ao usuário que realizou a venda
    sold_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Sale = mongoose.model('Sale', SaleSchema);

export default Sale;
