import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const desiredProductSchema = new Schema(
  {
    photoUrl: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    additionDate: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const clientSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "The client's name is mandatory."],
      trim: true,
    },

    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip_code: { type: String, trim: true },
    },

    phoneNumber: {
      type: String,
      required: [true, "The client's phone number is mandatory for contact."],
      trim: true,
    },

    instagram: {
      type: String,
      trim: true,
    },

    profession: {
      type: String,
      trim: true,
    },

    purchasingPower: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },

    observations: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: true,
    },

    desiredProducts: [desiredProductSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Client', clientSchema);
