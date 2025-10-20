import InstallmentService from './installment-rule-service.js';
import InstallmentRuleRepository from './installment-rule-repository.js';

class InstallmentController {
  /**
   * Endpoint para retornar as condições de pagamento para um valor de compra.
   * @param {Object} req O objeto de requisição do Express.
   * @param {Object} res O objeto de resposta do Express.
   */
  async getPaymentConditions(req, res) {
    // Acessa o valor da compra pela query string, ex: /api/installments?purchaseValue=1500
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

      // Retorna as condições de pagamento calculadas
      return res.status(200).json(conditions);
    } catch (error) {
      console.error(
        '[InstallmentController] Erro ao calcular condições:',
        error.message
      );
      // Retorna 500 para erros internos (como falha de comunicação com o DB)
      return res.status(500).json({
        message:
          'Ocorreu um erro interno ao processar as condições de pagamento.',
      });
    }
  }

  async updateRule(req, res) {
    const { id } = req.params;
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: 'Corpo da requisição vazio ou inválido.' });
    }

    try {
      const updatedRule = await InstallmentRuleRepository.update(
        id,
        updateData
      );

      if (!updatedRule) {
        return res
          .status(404)
          .json({ message: `Regra com ID ${id} não encontrada.` });
      }

      return res.status(200).json(updatedRule);
    } catch (error) {
      console.error('Erro ao atualizar regra:', error.message);
      // Em caso de erro de validação do Mongoose
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Dados de atualização inválidos.',
          details: error.message,
        });
      }
      return res
        .status(500)
        .json({ message: 'Erro interno ao processar a atualização da regra.' });
    }
  }
}

export default new InstallmentController();
