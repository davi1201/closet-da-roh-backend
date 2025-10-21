import { formatCurrency } from '../../utils/formatter.js';
import saleSettingService from '../sale-settings/sale-setting-service.js';

class InstallmentService {
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
