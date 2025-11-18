import mongoose from 'mongoose';

const SurveyResponseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'several_times', 'rarely'],
      required: true,
    },
    style_preference: {
      type: String,
      enum: ['knows_style', 'likes_suggestions', 'needs_help'],
      required: true,
    },
    priority_in_purchase: {
      type: String,
      enum: ['quality_fit', 'cost_benefit', 'price', 'brand_exclusivity'],
      required: true,
    },

    // Bloco 2: Modelo de Atendimento
    preferred_sales_model: {
      type: String,
      enum: ['store', 'online', 'home_delivery', 'scheduled_appointment'],
      required: true,
    },
    // Q5 - Condicional (Se Q4 = c ou d)
    exclusive_service_attraction: {
      type: String,
      enum: ['convenience', 'consultancy'],
      required: false,
    },
    // Q5 - Condicional (Se Q4 = a ou b)
    personalized_service_drawback: {
      type: String,
      enum: [
        'obligation_to_buy',
        'scheduling_difficulty',
        'prefers_browsing_alone',
      ],
      required: false,
    },

    // Bloco 3: Fechamento
    age_range: {
      type: String,
      enum: ['25-34', '35-44', '45-54', '55+'],
      required: true,
    },
    occupation: {
      type: String,
      required: true,
      trim: true,
    },

    // Metadados
    collected_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const SurveyResponse = mongoose.model('SurveyResponse', SurveyResponseSchema);
export default SurveyResponse;
