import InstallmentService from './installment-rule-service.js';

class InstallmentController {
  async getPaymentConditions(req, res) {
    const { purchaseValue } = req.query;

    const value = parseFloat(purchaseValue);

    if (isNaN(value) || value <= 0) {
      return res.status(400).json({
        message:
          'Parâmetro inválido. Por favor, forneça um "purchaseValue" válido e positivo na query string.',
      });
    }

    try {
      const conditions = await InstallmentService.getPaymentConditions(value);

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
