import saleRepository from './sale-repository.js';
import productVariantRepository from '../product-variant/product-variant-repository.js';
import saleSettingService from '../sale-settings/sale-setting-service.js';
import purchaseBacklogRepository from '../purchase-backlog/purchase-backlog-repository.js';
import accountsReceivableService from '../account-receivable/acount-receivable-service.js';

class SaleService {
  async createSale(saleData) {
    const {
      customer_id,
      items,
      payments,
      sold_by,
      due_date,
      discount_percentage,
    } = saleData;

    if (!items || items.length === 0) {
      throw new Error('A venda deve conter pelo menos um item.');
    }
    if (!payments || payments.length === 0) {
      throw new Error('A venda deve conter pelo menos um método de pagamento.');
    }

    const [settings, variantIds] = await Promise.all([
      saleSettingService.getSaleSettings(),
      items.map((item) => item.variant_id),
    ]);

    const variants = await productVariantRepository.findVariantsByIds(
      variantIds
    );
    const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

    let totalSubtotal = 0;
    const processedItems = [];
    const stockUpdates = [];
    const backlogCreations = [];
    let hasPendingStock = false;

    for (const item of items) {
      const variant = variantMap.get(item.variant_id);

      if (!variant) {
        throw new Error(`Variante com ID ${item.variant_id} não encontrada.`);
      }

      let itemFulfillmentStatus;

      if (variant.quantity >= item.quantity) {
        itemFulfillmentStatus = 'fulfilled';
      } else {
        itemFulfillmentStatus = 'pending_stock';
        hasPendingStock = true;

        backlogCreations.push({
          product_variant: variant._id,
          quantity_needed: item.quantity,
        });
      }

      const subtotal = item.quantity * variant.sale_price;
      totalSubtotal += subtotal;

      processedItems.push({
        variant: variant._id,
        sku_at_sale: variant.sku,
        quantity: item.quantity,
        unit_sale_price: variant.sale_price,
        subtotal: subtotal,
        fulfillment_status: itemFulfillmentStatus,
      });

      stockUpdates.push({
        variantId: variant._id,
        quantity: item.quantity,
        operation: 'decrement',
      });
    }

    const paymentResult = this._calculatePayments({
      subtotal: totalSubtotal,
      settings: settings,
      clientDiscountPercentage: discount_percentage || 0,
      paymentIntents: payments,
    });

    const paymentStatus = 'paid';
    const fulfillmentStatus = hasPendingStock
      ? 'awaiting_stock'
      : 'ready_to_ship';

    const finalSaleData = {
      client: customer_id || null,
      sold_by: sold_by,
      items: processedItems,
      subtotal_amount: totalSubtotal,
      discount_amount: paymentResult.discount_amount,
      payments: paymentResult.processedPayments,
      total_amount: paymentResult.total_amount,
      payment_status: paymentStatus,
      fulfillment_status: fulfillmentStatus,
    };

    const newSale = await saleRepository.create(finalSaleData);

    await accountsReceivableService.generateReceivablesForSale(
      newSale,
      due_date
    );

    if (backlogCreations.length > 0) {
      const backlogPromises = backlogCreations.map((backlog) => {
        const savedSaleItem = newSale.items.find(
          (i) =>
            i.variant.toString() === backlog.product_variant.toString() &&
            i.fulfillment_status === 'pending_stock'
        );

        return purchaseBacklogRepository.create({
          ...backlog,
          source_sale: newSale._id,
          source_sale_item: savedSaleItem._id,
        });
      });
      await Promise.all(backlogPromises);
    }

    await productVariantRepository.updateStockBatch(stockUpdates);

    return newSale;
  }

  _calculatePayments({
    subtotal,
    settings,
    clientDiscountPercentage,
    paymentIntents,
  }) {
    const safeClientPercentage =
      clientDiscountPercentage > 100
        ? 100
        : clientDiscountPercentage < 0
        ? 0
        : clientDiscountPercentage;
    const clientDiscountAmount = (subtotal * safeClientPercentage) / 100;

    // Removemos o 'methodDiscountAmount' para que só o desconto manual seja aplicado
    let methodDiscountAmount = 0;
    const isSplit = paymentIntents.length > 1;
    const repassInterest = !isSplit;

    if (!isSplit) {
      const paymentMethodKey = paymentIntents[0].method;
      const paymentMethod = settings.payment_methods.find(
        (pm) => pm.key === paymentMethodKey
      );
      if (!paymentMethod || !paymentMethod.is_active) {
        throw new Error(
          `Forma de pagamento '${paymentMethodKey}' não é válida ou está inativa.`
        );
      }
      // Cálculo do desconto automático removido
    }

    let totalDiscountApplied = clientDiscountAmount; // Apenas o desconto do cliente
    if (totalDiscountApplied > subtotal) {
      totalDiscountApplied = subtotal;
    }

    // Este é o valor líquido (o "caixa" da loja)
    const netSaleAmount = subtotal - totalDiscountApplied;

    const processedPayments = [];
    let totalPaidByCustomer = 0; // O que o cliente realmente paga

    if (isSplit) {
      const entryPayment = paymentIntents.find((p) => p.amount);
      const installmentPayment = paymentIntents.find((p) => !p.amount);

      if (!entryPayment || !installmentPayment) {
        throw new Error(
          'Pagamento dividido (split) mal formatado. Requer uma entrada com "amount" e um parcelamento sem "amount".'
        );
      }

      const entryAmount = entryPayment.amount;
      if (entryAmount >= netSaleAmount) {
        throw new Error(
          'O valor da entrada não pode ser maior ou igual ao valor líquido da venda.'
        );
      }
      const remainderAmount = netSaleAmount - entryAmount;

      processedPayments.push({
        method: entryPayment.method,
        amount: parseFloat(entryAmount.toFixed(2)),
        installments: 1,
        interest_rate_percentage: 0,
      });
      totalPaidByCustomer += entryAmount;

      const installmentResult = this._calculateInstallmentInterest(
        settings,
        installmentPayment.method,
        installmentPayment.installments,
        remainderAmount,
        repassInterest // Passa 'false'
      );

      processedPayments.push({
        method: installmentPayment.method,
        amount: parseFloat(installmentResult.finalAmount.toFixed(2)),
        installments: installmentPayment.installments,
        interest_rate_percentage: installmentResult.interestRate,
      });
      totalPaidByCustomer += installmentResult.finalAmount;
    } else {
      const payment = paymentIntents[0];
      const installmentResult = this._calculateInstallmentInterest(
        settings,
        payment.method,
        payment.installments,
        netSaleAmount,
        repassInterest // Passa 'true'
      );

      processedPayments.push({
        method: payment.method,
        amount: parseFloat(installmentResult.finalAmount.toFixed(2)),
        installments: payment.installments,
        interest_rate_percentage: installmentResult.interestRate,
      });
      totalPaidByCustomer = installmentResult.finalAmount;
    }

    return {
      processedPayments: processedPayments,
      total_amount: parseFloat(netSaleAmount.toFixed(2)), // Total da VENDA (líquido)
      discount_amount: parseFloat(totalDiscountApplied.toFixed(2)),
    };
  }

  _calculateInstallmentInterest(
    settings,
    method,
    installments,
    amount,
    repassInterest = true
  ) {
    if (method !== 'card' && method !== 'credit') {
      return { finalAmount: amount, interestAmount: 0, interestRate: 0 };
    }

    const installmentRule = this._findBestInstallmentRule(
      settings.installment_rules,
      amount
    );

    if (!installmentRule) {
      throw new Error(
        'Erro de configuração: Regra de parcelamento não encontrada.'
      );
    }

    const ruleDetail = installmentRule.rules.find(
      (r) => r.installments === installments
    );

    if (!ruleDetail) {
      throw new Error(
        `Parcelamento em ${installments}x não permitido para esta compra.`
      );
    }

    const originalInterestRate = ruleDetail.interest_rate_percentage;
    const effectiveInterestRate = repassInterest ? originalInterestRate : 0;

    const calculatedValues = this._calculateRepassedInterest(
      amount,
      effectiveInterestRate
    );

    return {
      finalAmount: calculatedValues.totalValue, // Valor que o cliente paga
      interestAmount: calculatedValues.interestAmount,
      interestRate: originalInterestRate,
    };
  }

  _calculateRepassedInterest(principal, interestRatePercentage) {
    if (interestRatePercentage <= 0) {
      return {
        totalValue: principal,
        interestAmount: 0,
        interestRate: 0,
      };
    }

    const rateDecimal = interestRatePercentage / 100;
    const totalValue = principal / (1 - rateDecimal);
    const interestAmount = totalValue - principal;

    return {
      totalValue: totalValue,
      interestAmount: interestAmount,
      interestRate: interestRatePercentage,
    };
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

  async getSaleById(id) {
    const sale = await saleRepository.findById(id);
    if (!sale) {
      throw new Error('Venda não encontrada.');
    }
    return sale;
  }

  async getDashboardSummary() {
    const data = await saleRepository.getSalesSummary();

    if (!data || Object.keys(data).length === 0) {
      return {
        totalVendas: 0,
        valorTotalVendas: 0,
        totalDescontoAplicado: 0,
        metodosDePagamento: {},
        topClientes: [],
        supplierSales: [], // <-- CORREÇÃO: Adicionado valor padrão
      };
    }

    const metodos = data.metodosDePagamento || {};

    const valorTotalVendas = data.valorTotalVendas
      ? parseFloat(data.valorTotalVendas.toFixed(2))
      : 0;
    const totalDescontoAplicado = data.totalDescontoAplicado
      ? parseFloat(data.totalDescontoAplicado.toFixed(2))
      : 0;

    return {
      totalVendas: data.totalVendas || 0,
      valorTotalVendas: valorTotalVendas,
      totalDescontoAplicado: totalDescontoAplicado,
      metodosDePagamento: metodos,
      topClientes: data.topClientes || [],
      supplierSales: data.supplierSales || [], // <-- CORREÇÃO: Adicionado repasse
    };
  }

  async getAllSales(fulfillment_status) {
    return await saleRepository.findAll(fulfillment_status);
  }

  async cancelSale(saleId) {
    const sale = await saleRepository.findById(saleId);
    if (!sale) {
      throw new Error('Venda não encontrada.');
    }

    if (
      sale.fulfillment_status === 'fulfilled' ||
      sale.fulfillment_status === 'partial'
    ) {
      throw new Error(
        'Não é possível cancelar uma venda que já foi parcial ou totalmente enviada.'
      );
    }

    if (sale.fulfillment_status === 'canceled') {
      return sale;
    }

    await accountsReceivableService.deleteBySaleId(saleId);
    await purchaseBacklogRepository.deleteBySaleId(saleId);

    const stockUpdatePromises = [];
    for (const item of sale.items) {
      if (item.fulfillment_status === 'fulfilled') {
        const updateData = { $inc: { quantity: item.quantity } };
        stockUpdatePromises.push(
          productVariantRepository.updateVariant(
            item.variant.toString(),
            updateData
          )
        );
      }
    }

    if (stockUpdatePromises.length > 0) {
      await Promise.all(stockUpdatePromises);
    }

    const updatedSale = await saleRepository.cancelSale(saleId);
    return updatedSale;
  }
}

export default new SaleService();
