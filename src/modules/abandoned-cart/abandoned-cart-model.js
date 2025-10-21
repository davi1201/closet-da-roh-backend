import mongoose from 'mongoose';

const AbandonedCartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  cancellationCode: {
    type: String,
    required: true,
    enum: [
      'HIGH_PRICE',
      'INSTALLMENT_AMOUNT',
      'HIGH_CARD_INTEREST',
      'FOUND_BETTER_PRICE',
      'PURCHASE_ABANDONED',
      'OTHER',
    ],
    index: true,
  },
  cancellationReason: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const AbandonedCart = mongoose.model('AbandonedCart', AbandonedCartSchema);

export default AbandonedCart;
