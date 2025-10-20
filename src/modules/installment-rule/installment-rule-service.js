import { formatCurrency } from '../../utils/formatter.js';
import InstallmentRuleRepository from './installment-rule-repository.js';

class InstallmentService {
  async getPaymentConditions(purchaseValue) {
    if (typeof purchaseValue !== 'number' || purchaseValue <= 0) {
      throw new Error('O valor da compra deve ser um número positivo.');
    }

    const rule = await InstallmentRuleRepository.findApplicableRule(
      purchaseValue
    );

    if (!rule) {
      return [
        {
          installments: 1,
          value: purchaseValue,
          total_value: purchaseValue,
          description: 'À Vista',
        },
      ];
    }

    const paymentConditions = rule.rules
      .map((installmentRule) => {
        const numInstallments = installmentRule.installments;
        const interestRate = installmentRule.interest_rate_percentage; // Ex: 5.39
        const rateDecimal = interestRate / 100;

        let totalValue;
        let installmentValue;
        let description;

        if (interestRate > 0) {
          // LÓGICA CORRIGIDA: CÁLCULO DE REPASSE DE TAXA ÚNICA

          // 1. Calcula o Valor Total que o Cliente deve pagar para o Vendedor
          // receber o valor integral (Repasse de Taxa: Principal / (1 - Taxa))
          const principalWithoutFee = purchaseValue / (1 - rateDecimal);

          // 2. Calcula a Parcela sem a Tarifa Fixa
          const installmentWithoutFee = principalWithoutFee / numInstallments;

          // 3. Adiciona a Tarifa Fixa de 0.29
          installmentValue = installmentWithoutFee;

          // 4. Calcula o Novo Total Pago pelo Cliente
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
          totalValue = purchaseValue;
          installmentValue = purchaseValue / numInstallments;

          // Adiciona a tarifa fixa (0.29) para parcelas sem juros
          totalValue = installmentValue * numInstallments;

          description = `${numInstallments}x de ${formatCurrency(
            installmentValue
          )} Sem Juros`;
        }

        return {
          installments: numInstallments,
          // Arredondamento para 2 casas decimais e conversão final
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
