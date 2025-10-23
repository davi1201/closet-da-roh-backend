import { formatCurrency } from '../../utils/formatter.js';
import saleSettingService from '../sale-settings/sale-setting-service.js';
import installmentRuleRepository from './installment-rule-repository.js';

class InstallmentService {
  async addInstallmentRule(ruleData) {
    const { min_purchase_value, rules } = ruleData;

    // 1. Validação de campos principais
    if (min_purchase_value === undefined || min_purchase_value < 0) {
      throw new Error(
        'Valor mínimo de compra é obrigatório e não pode ser negativo.'
      );
    }

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      throw new Error('É necessário fornecer pelo menos uma opção de parcela.');
    }

    // 2. Lógica de Negócio: Verificar duplicatas
    const existingRule = await installmentRuleRepository.findApplicableRule(
      min_purchase_value
    );

    if (existingRule) {
      throw new Error(
        `Já existe uma regra de parcelamento definida para o valor mínimo de ${min_purchase_value}.`
      );
    }

    // 3. (Opcional) Validação interna das regras (o Mongoose já faz, mas é bom)
    for (const rule of rules) {
      if (!rule.installments || rule.installments < 1) {
        throw new Error(
          'Todas as regras devem ter um número de parcelas válido.'
        );
      }
    }

    // 4. Chamar o Repositório para criar
    return await installmentRuleRepository.create(ruleData);
  }

  _findBestInstallmentRule(rules, amount) {
    const ruleList = rules || [];
    let bestRule = null;
    for (const rule of ruleList) {
      if (amount >= rule.min_purchase_value) {
        bestRule = rule;
      } else {
        break;
      }
    }
    return bestRule;
  }

  async getPaymentConditions(purchaseValue) {
    if (typeof purchaseValue !== 'number' || purchaseValue <= 0) {
      throw new Error('O valor da compra deve ser um número positivo.');
    }

    const settings = await saleSettingService.getSaleSettings();
    const rule = this._findBestInstallmentRule(
      settings.installment_rules,
      purchaseValue
    );

    if (!rule) {
      return [
        {
          installments: 1,
          value: purchaseValue,
          total_value: purchaseValue,
          description: 'À Vista',
          interest_rate: 0,
        },
      ];
    }

    const paymentConditions = rule.rules
      .map((installmentRule) => {
        const numInstallments = installmentRule.installments;
        const interestRate = installmentRule.interest_rate_percentage;
        const rateDecimal = interestRate / 100;

        let totalValue;
        let installmentValue;
        let description;

        if (interestRate > 0) {
          // LÓGICA: CÁLCULO DE REPASSE DE TAXA ÚNICA

          const principalWithoutFee = purchaseValue / (1 - rateDecimal);
          const installmentWithoutFee = principalWithoutFee / numInstallments;

          installmentValue = installmentWithoutFee;
          totalValue = installmentValue * numInstallments;

          description = `${numInstallments}x de ${formatCurrency(
            installmentValue
          )} (Total ${formatCurrency(totalValue)} com ${interestRate}%)`;
        } else if (numInstallments === 1) {
          totalValue = purchaseValue;
          installmentValue = purchaseValue;
          description = 'À Vista';
        } else {
          // Parcelas sem juros (Taxa = 0)
          installmentValue = purchaseValue / numInstallments;
          totalValue = installmentValue * numInstallments;

          description = `${numInstallments}x de ${formatCurrency(
            installmentValue
          )} Sem Juros`;
        }

        return {
          installments: numInstallments,
          value: parseFloat(installmentValue.toFixed(2)),
          total_value: parseFloat(totalValue.toFixed(2)),
          description: description,
          interest_rate: interestRate,
        };
      })
      .filter((condition) => condition.value >= 1);

    return paymentConditions;
  }
}

export default new InstallmentService();
