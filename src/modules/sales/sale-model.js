import mongoose from 'mongoose';

const SaleItemSchema = new mongoose.Schema(
  {
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    sku_at_sale: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_sale_price: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    fulfillment_status: {
      type: String,
      enum: ['fulfilled', 'pending_stock'],
      required: true,
      default: 'fulfilled',
    },
  },
  { _id: true } // Alterado de _id: false para permitir referenciamento
);

const PaymentDetailSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
    },
    installments: {
      type: Number,
      default: 1,
    },
    interest_rate_percentage: {
      type: Number,
      default: 0,
    },
    discount_amount: {
      type: Number,
      default: 0,
    },
    amount_paid: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: false,
    },
    items: {
      type: [SaleItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    subtotal_amount: {
      type: Number,
      required: true,
    },
    payment_details: {
      type: PaymentDetailSchema,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'partially_refunded', 'refunded'],
      default: 'pending',
      required: true,
    },
    fulfillment_status: {
      type: String,
      enum: [
        'pending', // Aguardando processamento inicial
        'awaiting_stock', // Pelo menos um item está 'pending_stock'
        'ready_to_ship', // Todos os itens estão 'fulfilled' e pago
        'partial', // Alguns itens enviados, outros não
        'fulfilled', // Todos os itens enviados
        'canceled', // Venda cancelada
      ],
      default: 'pending',
      required: true,
    },
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
