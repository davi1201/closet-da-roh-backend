import mongoose, { Schema, model } from 'mongoose';

const AccountsReceivableSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    saleId: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'OVERDUE'],
      default: 'PENDING',
    },
    installmentNumber: {
      type: Number,
      required: true,
    },
    totalInstallments: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

AccountsReceivableSchema.index({ customerId: 1, status: 1 });
AccountsReceivableSchema.index({ saleId: 1 });

export const AccountsReceivableModel =
  mongoose.model.AccountsReceivable ||
  model('AccountsReceivable', AccountsReceivableSchema);
