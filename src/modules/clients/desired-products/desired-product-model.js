// models/DesiredProduct.ts

import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  key: { type: String, required: true },
});

const DesiredProductSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    // ALTERAÇÃO AQUI:
    images: {
      type: [ImageSchema], // Mude de 'String' para um array de 'ImageSchema'
      required: false,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('DesiredProduct', DesiredProductSchema);
