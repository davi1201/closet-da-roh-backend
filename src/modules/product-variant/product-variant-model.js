// src/models/ProductVariant.js (Modelo ajustado)

import mongoose from 'mongoose';
import PriceHistorySchema from '../price-historic/price-historic-model.js';

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    size: { type: String, required: true },
    color: { type: String, required: true },

    buy_price: { type: Number, required: true, min: 0 },
    sale_price: { type: Number, required: true, min: 0 },
    price_history: [PriceHistorySchema],

    quantity: {
      type: Number,
      required: [true, 'A quantidade em estoque é obrigatória.'],
      default: 0,
      min: 0,
    },
    minimum_stock: {
      type: Number,
      required: [true, 'O estoque mínimo é obrigatório.'],
      default: 0,
      min: 0,
    },

    sku: { type: String, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model('ProductVariant', productVariantSchema);
