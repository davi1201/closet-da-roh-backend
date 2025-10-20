import installmentRuleRepository from '../installment-rule/installment-rule-repository.js';
import saleSettingRepository from './sale-setting-repository.js';

class SaleSettingService {
  /**
   * Obtém as configurações de venda.
   * Garante que o documento de configuração inicial seja criado se não existir.
   * @returns {Promise<Object>} As configurações de venda.
   */
  async getSaleSettings() {
    return await saleSettingRepository.getSettings();
  }

  /**
   * Atualiza as configurações de venda.
   * @param {Object} updateData Dados para atualização (ex: { default_margin_percentage: 40, payment_methods: [...] }).
   * @returns {Promise<Object>} As configurações atualizadas.
   */
  async updateSaleSettings(updateData) {
    if (
      updateData.default_margin_percentage &&
      updateData.default_margin_percentage < 0
    ) {
      throw new Error('A margem de lucro não pode ser negativa.');
    }

    // Validações adicionais para payment_methods podem ser inseridas aqui, se necessário.

    return await saleSettingRepository.updateSettings(updateData);
  }

  // ------------------------------------------------------------------
  //  Serviços para Regras de Parcelamento (Installment Rules)
  // ------------------------------------------------------------------

  /**
   * Lista todas as regras de parcelamento, ordenadas pelo valor mínimo de compra.
   * @returns {Promise<Array>} Lista de regras de parcelamento.
   */
  async getAllInstallmentRules() {
    return await installmentRuleRepository.findAll();
  }

  /**
   * Valida o array de regras de parcelamento detalhadas (o sub-documento 'rules').
   * Garante que as parcelas sejam únicas e a taxa de juros não seja negativa.
   * @param {Array} rules Array de { installments, interest_rate_percentage }.
   */
  _validateRuleDetails(rules) {
    if (!Array.isArray(rules) || rules.length === 0) {
      throw new Error(
        'A regra de parcelamento deve conter pelo menos uma opção de parcela.'
      );
    }

    const installmentCounts = new Set();
    for (const rule of rules) {
      if (!rule.installments || rule.installments < 1) {
        throw new Error('O número de parcelas deve ser no mínimo 1.');
      }
      if (
        rule.interest_rate_percentage === undefined ||
        rule.interest_rate_percentage < 0
      ) {
        throw new Error('A taxa de juros não pode ser negativa.');
      }
      if (installmentCounts.has(rule.installments)) {
        throw new Error(
          `O número de parcelas ${rule.installments} está duplicado na mesma regra.`
        );
      }
      installmentCounts.add(rule.installments);
    }

    // Opcional: Ordenar as regras detalhadas internamente por número de parcelas, se for útil para o frontend.
    rules.sort((a, b) => a.installments - b.installments);
  }

  /**
   * Cria uma nova regra de parcelamento.
   * @param {Object} ruleData Dados da regra ({ min_purchase_value, rules: [{ installments, interest_rate_percentage }] }).
   * @returns {Promise<Object>} A nova regra criada.
   */
  async createInstallmentRule(ruleData) {
    if (
      ruleData.min_purchase_value === undefined ||
      ruleData.min_purchase_value < 0
    ) {
      throw new Error(
        'O valor mínimo de compra deve ser maior ou igual a zero.'
      );
    }

    this._validateRuleDetails(ruleData.rules);

    // O repositório já cuida da validação de unicidade de min_purchase_value via Mongoose/MongoDB.
    return await installmentRuleRepository.create(ruleData);
  }

  /**
   * Atualiza uma regra de parcelamento existente.
   * @param {string} id ID da regra.
   * @param {Object} updateData Dados para atualização.
   * @returns {Promise<Object>} A regra atualizada.
   */
  async updateInstallmentRule(id, updateData) {
    const existingRule = await installmentRuleRepository.findById(id);
    if (!existingRule) {
      throw new Error('Regra de parcelamento não encontrada.');
    }

    // Validações para campos que podem ser atualizados
    if (
      updateData.min_purchase_value !== undefined &&
      updateData.min_purchase_value < 0
    ) {
      throw new Error(
        'O valor mínimo de compra deve ser maior ou igual a zero.'
      );
    }

    if (updateData.rules) {
      this._validateRuleDetails(updateData.rules);
    }

    return await installmentRuleRepository.update(id, updateData);
  }

  /**
   * Deleta uma regra de parcelamento.
   * @param {string} id ID da regra.
   * @returns {Promise<Object | null>} A regra deletada.
   */
  async deleteInstallmentRule(id) {
    const deletedRule = await installmentRuleRepository.delete(id);
    if (!deletedRule) {
      throw new Error('Regra de parcelamento não encontrada.');
    }
    return deletedRule;
  }
}

export default new SaleSettingService();
