import saleSettingRepository from './sale-setting-repository.js';

class SaleSettingService {
  async getSaleSettings() {
    return await saleSettingRepository.getSettings();
  }

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

    rules.sort((a, b) => a.installments - b.installments);
  }

  _validateInstallmentRules(installmentRules) {
    if (!Array.isArray(installmentRules) || installmentRules.length === 0) {
      throw new Error(
        'A lista de regras de parcelamento deve conter pelo menos uma regra.'
      );
    }

    for (const tierRule of installmentRules) {
      if (
        tierRule.min_purchase_value === undefined ||
        tierRule.min_purchase_value < 0
      ) {
        throw new Error(
          'O valor mínimo de compra em uma regra deve ser maior ou igual a zero.'
        );
      }
      if (tierRule.rules) {
        this._validateRuleDetails(tierRule.rules);
      }
    }
  }

  async updateSaleSettings(updateData) {
    if (
      updateData.default_margin_percentage !== undefined &&
      updateData.default_margin_percentage < 0
    ) {
      throw new Error('A margem de lucro não pode ser negativa.');
    }

    if (updateData.installment_rules) {
      this._validateInstallmentRules(updateData.installment_rules);
    }

    // O Mongoose lida com a validação de payment_methods com base no schema.

    return await saleSettingRepository.updateSettings(updateData);
  }
}

export default new SaleSettingService();
