import surveyResponseRepository from './survey-repository.js';

class SurveyResponseService {
  async createResponse(responseData) {
    // Filtro: Se respondeu "raramente" (c) na Q1, não salva.
    if (responseData.frequency === 'rarely') {
      throw new Error('Perfil não se encaixa nos critérios (frequência rara).');
    }

    // Validação da Q5 (Lógica condicional)
    const {
      preferred_sales_model,
      exclusive_service_attraction,
      personalized_service_drawback,
    } = responseData;

    if (
      preferred_sales_model === 'home_delivery' ||
      preferred_sales_model === 'scheduled_appointment'
    ) {
      if (!exclusive_service_attraction) {
        throw new Error(
          'A Pergunta 5 (Atração) é obrigatória para este perfil.'
        );
      }
      responseData.personalized_service_drawback = undefined; // Limpa o campo oposto
    } else if (
      preferred_sales_model === 'store' ||
      preferred_sales_model === 'online'
    ) {
      if (!personalized_service_drawback) {
        throw new Error(
          'A Pergunta 5 (Incomodo) é obrigatória para este perfil.'
        );
      }
      responseData.exclusive_service_attraction = undefined; // Limpa o campo oposto
    }

    return await surveyResponseRepository.create(responseData);
  }

  async getAllResponses() {
    return await surveyResponseRepository.findAll();
  }

  async getResponseById(id) {
    const response = await surveyResponseRepository.findById(id);
    if (!response) {
      throw new Error('Resposta não encontrada.');
    }
    return response;
  }

  async deleteResponse(id) {
    const deleted = await surveyResponseRepository.deleteById(id);
    if (!deleted) {
      throw new Error('Resposta não encontrada.');
    }
    return { message: 'Resposta deletada com sucesso.' };
  }

  async getSurveySummary() {
    const summary = await surveyResponseRepository.getSummary();
    if (!summary) {
      return { totalResponses: 0 };
    }
    return summary;
  }
}

export default new SurveyResponseService();
