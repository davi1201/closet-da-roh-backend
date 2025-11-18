import surveyResponseService from './survey-service.js';

const createResponse = async (req, res, next) => {
  try {
    const responseData = req.body;
    responseData.collected_by = req.user ? req.user._id : null; // Pega o usuário logado

    const newResponse = await surveyResponseService.createResponse(
      responseData
    );
    res.status(201).json(newResponse);
  } catch (error) {
    // Erros de validação ou regras de negócio (como Q1="raramente")
    if (
      error.message.includes('Perfil não se encaixa') ||
      error.message.includes('obrigatória')
    ) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

const getAllResponses = async (req, res, next) => {
  try {
    const responses = await surveyResponseService.getAllResponses();
    res.status(200).json(responses);
  } catch (error) {
    next(error);
  }
};

const getResponseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await surveyResponseService.getResponseById(id);
    res.status(200).json(response);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

const deleteResponse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await surveyResponseService.deleteResponse(id);
    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await surveyResponseService.getSurveySummary();
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

export {
  createResponse,
  getAllResponses,
  getResponseById,
  deleteResponse,
  getSummary,
};
