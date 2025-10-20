import mongoose from 'mongoose';

const PriceHistorySchema = new mongoose.Schema(
  {    
    buyPrice: { 
        type: Number, 
        required: true 
    },    
    salePrice: { 
        type: Number, 
        required: true 
    },
    changedAt: { 
        type: Date, 
        default: Date.now 
    },
  },
  { _id: false } 
);

export default PriceHistorySchema;