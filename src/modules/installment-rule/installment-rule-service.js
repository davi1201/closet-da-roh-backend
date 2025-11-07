import { formatCurrency } from '../../utils/formatter.js';
import saleSettingService from '../sale-settings/sale-setting-service.js';
import installmentRuleRepository from './installment-rule-repository.js';

class InstallmentService {
  async addInstallmentRule(ruleData) {
    const { min_purchase_value, rules } = ruleData;

    if (min_purchase_value === undefined || min_purchase_value < 0) {
      throw new Error(
        'Valor mínimo de compra é obrigatório e não pode ser negativo.'
      );
    }

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      throw new Error('É necessário fornecer pelo menos uma opção de parcela.');
    }

    const existingRule = await installmentRuleRepository.findApplicableRule(
      min_purchase_value
    );

    if (existingRule) {
      throw new Error(
        `Já existe uma regra de parcelamento definida para o valor mínimo de ${min_purchase_value}.`
      );
    }

    for (const rule of rules) {
      if (!rule.installments || rule.installments < 1) {
        throw new Error(
          'Todas as regras devem ter um número de parcelas válido.'
        );
      }
    }

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

  async getPaymentConditions(purchaseValue, repassInterest = true) {
    if (typeof purchaseValue !== 'number' || purchaseValue <= 0) {
      throw new Error('O valor da compra deve ser um número positivo.');
    }

    const settings = await saleSettingService.getSaleSettings();
    const rule = this._findBestInstallmentRule(
      settings.installment_rules,
      purchaseValue
    );

    // Caso não exista nenhuma regra aplicável
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
        const originalInterestRate =
          installmentRule.interest_rate_percentage || 0;

        let totalValue;
        let installmentValue;
        let description;

        // 🔹 CASO COM JUROS (somente se repassInterest for true)
        if (repassInterest && originalInterestRate > 0) {
          const rateDecimal = originalInterestRate / 100;

          totalValue = purchaseValue / (1 - rateDecimal);
          installmentValue = totalValue / numInstallments; // <-- CORREÇÃO: Faltava esta linha

          description = `${numInstallments}x de ${formatCurrency(
            installmentValue
          )} (Total ${formatCurrency(
            totalValue
          )} com ${originalInterestRate}%)`;
        }

        // 🔹 CASO SEM JUROS (ou ignorando juros)
        else {
          installmentValue = purchaseValue / numInstallments;
          totalValue = purchaseValue;

          description =
            numInstallments === 1
              ? 'À Vista'
              : `${numInstallments}x de ${formatCurrency(
                  installmentValue
                )} Sem Juros`;
        }

        return {
          installments: numInstallments,
          value: parseFloat(installmentValue.toFixed(2)),
          total_value: parseFloat(totalValue.toFixed(2)),
          description,
          interest_rate: originalInterestRate,
        };
      })
      .filter((condition) => condition.value >= 1);

    return paymentConditions;
  }
}

export default new InstallmentService();
