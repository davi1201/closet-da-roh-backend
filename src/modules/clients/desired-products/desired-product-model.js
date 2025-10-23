// models/DesiredProduct.ts
import mongoose, { Schema } from 'mongoose';

const DesiredProductSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client', // Referência ao cliente
      required: true,
      index: true,
    },
    photoUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    // O 'additionDate' é substituído pelo 'timestamps: true'
  },
  {
    timestamps: true, // Adiciona createdAt (para saber a data) e updatedAt
  }
);

const DesiredProduct =
  mongoose.models.DesiredProduct ||
  mongoose.model('DesiredProduct', DesiredProductSchema);

export default DesiredProduct;
