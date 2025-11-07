import InstallmentService from './installment-rule-service.js';

class InstallmentController {
  async createRule(req, res) {
    try {
      const ruleData = req.body;
      const newRule = await InstallmentService.addInstallmentRule(ruleData);
      res.status(201).json(newRule);
    } catch (error) {
      // Erro de duplicata
      if (error.message.includes('Já existe')) {
        return res.status(409).json({ message: error.message }); // 409 Conflict
      }
      // Erro de validação (do service ou Mongoose)
      if (
        error.name === 'ValidationError' ||
        error.message.includes('obrigatório')
      ) {
        return res
          .status(400)
          .json({ message: 'Dados inválidos.', details: error.message });
      }

      // Outros erros
      console.error('Erro ao criar regra de parcelamento:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  async getPaymentConditions(req, res) {
    const { purchaseValue, repassInterest } = req.query;

    const value = parseFloat(purchaseValue);
    const shouldRepassInterest =
      repassInterest === 'true' || repassInterest === true;

    if (isNaN(value) || value <= 0) {
      return res.status(400).json({
        message:
          'Parâmetro inválido. Por favor, forneça um "purchaseValue" válido e positivo na query string.',
      });
    }

    try {
      const conditions = await InstallmentService.getPaymentConditions(
        value,
        shouldRepassInterest
      );

      return res.status(200).json(conditions);
    } catch (error) {
      console.error(
        '[InstallmentController] Erro ao calcular condições:',
        error.message
      );
      return res.status(500).json({
        message:
          error.message ||
          'Ocorreu um erro interno ao processar as condições de pagamento.',
      });
    }
  }
}

export default new InstallmentController();
