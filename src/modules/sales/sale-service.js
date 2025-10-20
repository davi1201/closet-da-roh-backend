import saleRepository from './sale-repository.js';
import productVariantRepository from '../product-variant/product-variant-repository.js';
import saleSettingService from '../sale-settings/sale-setting-service.js';

class SaleService {
  /**
   * Valida os itens, calcula os valores finais e registra a venda.
   * @param {Object} saleData Dados da venda (customer_id, items, payment_method, installments).
   * @returns {Promise<Object>} A venda registrada.
   */
  async createSale(saleData) {
    const { customer_id, items, payment_details, sold_by } = saleData;

    if (!items || items.length === 0) {
      throw new Error('A venda deve conter pelo menos um item.');
    }

    // 1. Busca Configurações e Variações
    const [settings, variantIds] = await Promise.all([
      saleSettingService.getSaleSettings(),
      items.map((item) => item.variant_id),
    ]);

    // Busca todas as variações em uma única query
    const variants = await productVariantRepository.findVariantsByIds(
      variantIds
    );
    const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

    let totalSubtotal = 0;
    const processedItems = [];
    const stockUpdates = [];

    // 2. Validação de Estoque e Cálculo do Subtotal
    for (const item of items) {
      const variant = variantMap.get(item.variant_id);

      // ... (verificações de item e variante) ...

      // 🚨 AJUSTE AQUI: Usando variant.quantity (novo nome do campo de estoque)
      if (variant.quantity < item.quantity) {
        // Mensagem de erro mais clara
        throw new Error(
          `Estoque insuficiente para a variante ${variant.sku}. Disponível: ${variant.quantity}, Solicitado: ${item.quantity}`
        );
      }

      const subtotal = item.quantity * variant.sale_price;
      totalSubtotal += subtotal;

      processedItems.push({
        variant: variant._id,
        sku_at_sale: variant.sku,
        quantity: item.quantity,
        unit_sale_price: variant.sale_price,
        subtotal: subtotal,
      });

      stockUpdates.push({
        variantId: variant._id,
        quantity: item.quantity,
        operation: 'decrement',
      });
    }

    // 3. Cálculo de Desconto e Juros (Lógica Financeira)

    const { finalAmount, discountApplied, interestRate } =
      this._calculateFinalAmount({
        subtotal: totalSubtotal,
        settings: settings,
        payment: payment_details,
      });

    // 4. Montagem dos Dados Finais da Venda
    const finalSaleData = {
      customer: customer_id || null,
      sold_by: sold_by, // ID do usuário logado
      items: processedItems,
      subtotal_amount: totalSubtotal,
      payment_details: {
        method: payment_details.method,
        installments: payment_details.installments || 1,
        interest_rate_percentage: interestRate,
        discount_amount: discountApplied,
        amount_paid: finalAmount, // Valor final pago
      },
      total_amount: finalAmount,
      status: 'completed', // Inicia como concluída
    };

    // 5. Registro e Atualização de Estoque (Transação de Venda)
    // **IMPORTANTE:** Em produção, esta etapa DEVE ser uma transação.
    const newSale = await saleRepository.create(finalSaleData);

    await productVariantRepository.updateStockBatch(stockUpdates);
    // A função updateStockBatch deve ser criada no repositório de variantes.

    return newSale;
  }

  /**
   * Lógica para calcular o preço final com base nas configurações e método de pagamento.
   * @param {Object} calculationData Dados para cálculo.
   * @returns {Object} { finalAmount, discountApplied, interestRate }
   */
  _calculateFinalAmount({ subtotal, settings, payment }) {
    const paymentMethod = settings.payment_methods.find(
      (pm) => pm.key === payment.method
    );

    if (!paymentMethod || !paymentMethod.is_active) {
      throw new Error(
        `Forma de pagamento '${payment.method}' não é válida ou está inativa.`
      );
    }

    let discountRate = paymentMethod.discount_percentage / 100;
    let interestRate = 0;
    let currentAmount = subtotal;

    // 3.1. Aplica Desconto por Método de Pagamento (ex: Pix ou À Vista)
    const discountApplied = currentAmount * discountRate;
    currentAmount -= discountApplied;

    // 3.2. Cálculo de Juros (se for Cartão ou Prazo)
    if (payment.method === 'card' || payment.method === 'credit') {
      const installmentRule = this._findBestInstallmentRule(
        settings.installment_rules,
        currentAmount
      );

      if (installmentRule) {
        const ruleDetail = installmentRule.rules.find(
          (r) => r.installments === payment.installments
        );

        if (!ruleDetail) {
          throw new Error(
            `Parcelamento em ${payment.installments}x não permitido para esta compra.`
          );
        }

        interestRate = ruleDetail.interest_rate_percentage / 100;

        if (interestRate > 0) {
          // Fórmula de juros simples (pode ser substituída por juros compostos - Tabela Price)
          const interestAmount =
            currentAmount * interestRate * payment.installments;
          currentAmount += interestAmount;
        }
      } else {
        // Caso não encontre nenhuma regra (erro de configuração)
        throw new Error(
          'Erro de configuração: Regra de parcelamento não encontrada.'
        );
      }
    }

    return {
      finalAmount: parseFloat(currentAmount.toFixed(2)),
      discountApplied: parseFloat(discountApplied.toFixed(2)),
      interestRate: interestRate * 100, // Retorna a taxa em porcentagem
    };
  }

  /**
   * Encontra a regra de parcelamento mais apropriada (maior min_purchase_value <= amount)
   * NOTA: Este método assume que settings.installment_rules JÁ ESTÁ NO OBJETO DE SETTINGS.
   * Isso exige que o saleSettingService.getSaleSettings() busque e anexe as regras de Installment.
   * @param {Array} rules Lista de regras de parcelamento.
   * @param {Number} amount Valor da compra após descontos do método.
   * @returns {Object | null} A regra mais adequada.
   */
  _findBestInstallmentRule(rules, amount) {
    // Assume que as regras vêm ordenadas por min_purchase_value ASC (do repositório)
    let bestRule = null;
    for (const rule of rules) {
      if (amount >= rule.min_purchase_value) {
        bestRule = rule;
      } else {
        // Como está ordenado, pode parar de buscar
        break;
      }
    }
    return bestRule;
  }

  async getSaleById(id) {
    const sale = await saleRepository.findById(id);
    if (!sale) {
      throw new Error('Venda não encontrada.');
    }
    return sale;
  }

  async getAllSales(status) {
    return await saleRepository.findAll(status);
  }

  // Futuras funções: cancelSale, returnItems, etc.
}

export default new SaleService();
