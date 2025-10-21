// Salve este arquivo como:
// src/modules/purchase-backlog/purchase-backlog-model.js

import mongoose from 'mongoose';

const PurchaseBacklogSchema = new mongoose.Schema(
  {
    product_variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    quantity_needed: {
      type: Number,
      required: true,
      min: 1,
    },
    source_sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
    },
    source_sale_item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'awaiting_purchase',
        'purchase_order_sent',
        'received',
        'canceled',
      ],
      default: 'awaiting_purchase',
      required: true,
    },
    purchase_order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: false,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const PurchaseBacklog = mongoose.model(
  'PurchaseBacklog',
  PurchaseBacklogSchema
);

export default PurchaseBacklog;
