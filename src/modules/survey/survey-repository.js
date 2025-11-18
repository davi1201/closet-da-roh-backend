import SurveyResponse from './survey-model.js';

class SurveyResponseRepository {
  async create(responseData) {
    const response = new SurveyResponse(responseData);
    return await response.save();
  }

  async findById(id) {
    return await SurveyResponse.findById(id).populate('collected_by', 'name');
  }

  async findAll() {
    return await SurveyResponse.find()
      .populate('collected_by', 'name')
      .sort({ createdAt: -1 });
  }

  async deleteById(id) {
    return await SurveyResponse.findByIdAndDelete(id);
  }

  async getSummary() {
    const summary = await SurveyResponse.aggregate([
      {
        $facet: {
          totalResponses: [{ $count: 'count' }],
          byFrequency: [{ $group: { _id: '$frequency', count: { $sum: 1 } } }],
          byStylePreference: [
            { $group: { _id: '$style_preference', count: { $sum: 1 } } },
          ],
          byPriority: [
            { $group: { _id: '$priority_in_purchase', count: { $sum: 1 } } },
          ],
          bySalesModel: [
            { $group: { _id: '$preferred_sales_model', count: { $sum: 1 } } },
          ],
          byAttraction: [
            { $match: { exclusive_service_attraction: { $ne: null } } },
            {
              $group: {
                _id: '$exclusive_service_attraction',
                count: { $sum: 1 },
              },
            },
          ],
          byDrawback: [
            { $match: { personalized_service_drawback: { $ne: null } } },
            {
              $group: {
                _id: '$personalized_service_drawback',
                count: { $sum: 1 },
              },
            },
          ],
          byAgeRange: [{ $group: { _id: '$age_range', count: { $sum: 1 } } }],
          byOccupation: [
            { $group: { _id: '$occupation', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
        },
      },
      {
        $project: {
          totalResponses: { $arrayElemAt: ['$totalResponses.count', 0] },
          frequency: '$byFrequency',
          stylePreference: '$byStylePreference',
          priority: '$byPriority',
          salesModel: '$bySalesModel',
          attraction: '$byAttraction',
          drawback: '$byDrawback',
          ageRange: '$byAgeRange',
          topOccupations: '$byOccupation',
        },
      },
    ]);

    return summary[0];
  }
}

export default new SurveyResponseRepository();
