import mongoose, { Schema } from 'mongoose';

// 1. Este é o seu Schema (a definição)
const ProductInteractionSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    interaction: {
      type: String,
      enum: ['liked', 'disliked'],
      required: true,
    },
  },
  {
    timestamps: true,
    unique: ['client', 'product'],
  }
);

// 2. Este é o Model compilado (o que tem as funções)
//    (O padrão mongoose.models.X previne erros no Next.js)
const ProductInteraction =
  mongoose.models.ProductInteraction ||
  mongoose.model('ProductInteraction', ProductInteractionSchema);

// 3. Exporte o MODEL, não o Schema
export default ProductInteraction;
