import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    code: { type: String, unique: true },
    category: { type: String },
    is_available: { type: Boolean, default: true },
    images: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true },
      },
    ],
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'O fornecedor é obrigatório para o produto.'],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
