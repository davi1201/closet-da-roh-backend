import saleRepository from './sale-repository.js';
import productVariantRepository from '../product-variant/product-variant-repository.js';
import saleSettingService from '../sale-settings/sale-setting-service.js';
import purchaseBacklogRepository from '../purchase-backlog/purchase-backlog-repository.js'; // Importar o novo repositório

class SaleService {
  async createSale(saleData) {
    const { customer_id, items, payment_details, sold_by } = saleData;

    if (!items || items.length === 0) {
      throw new Error('A venda deve conter pelo menos um item.');
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
    const backlogCreations = []; // Lista para criar pendências de compra
    let hasPendingStock = false; // Flag para controlar o status da venda

    for (const item of items) {
      const variant = variantMap.get(item.variant_id);

      if (!variant) {
        throw new Error(`Variante com ID ${item.variant_id} não encontrada.`);
      }

      let itemFulfillmentStatus;

      // Lógica de Backorder: Vender mesmo sem estoque
      if (variant.quantity >= item.quantity) {
        // CASO 1: Tem estoque
        itemFulfillmentStatus = 'fulfilled';
      } else {
        // CASO 2: Não tem estoque (Backorder)
        itemFulfillmentStatus = 'pending_stock';
        hasPendingStock = true;

        // Adiciona na lista para criar a pendência de compra
        backlogCreations.push({
          product_variant: variant._id,
          quantity_needed: item.quantity,
          // source_sale e source_sale_item serão adicionados após a venda ser salva
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
        fulfillment_status: itemFulfillmentStatus, // Adiciona o status do item
      });

      // Abater o estoque (permitindo que fique negativo)
      stockUpdates.push({
        variantId: variant._id,
        quantity: item.quantity,
        operation: 'decrement',
      });
    }

    const {
      netSaleAmount,
      finalAmount,
      interestAmount,
      discountApplied,
      discountPercentage,
      interestRate,
    } = this._calculateFinalAmount({
      subtotal: totalSubtotal,
      settings: settings,
      payment: payment_details,
    });

    // Definir os novos status da Venda
    // (Assumindo que o pagamento é processado no ato da criação)
    // TODO: Ajustar `payment_status` se houver métodos como 'boleto'
    const paymentStatus = 'paid';
    const fulfillmentStatus = hasPendingStock
      ? 'awaiting_stock'
      : 'ready_to_ship';

    const finalSaleData = {
      client: customer_id || null,
      sold_by: sold_by,
      items: processedItems,
      subtotal_amount: totalSubtotal,

      payment_details: {
        method: payment_details.method,
        installments: payment_details.installments || 1,
        interest_rate_percentage: interestRate,
        discount_amount: discountApplied,
        amount_paid: finalAmount,
      },

      total_amount: finalAmount,
      payment_status: paymentStatus,
      fulfillment_status: fulfillmentStatus,
    };

    const newSale = await saleRepository.create(finalSaleData);

    // Criar as pendências de compra (backlogs) agora que temos o ID da Venda
    if (backlogCreations.length > 0) {
      const backlogPromises = backlogCreations.map((backlog) => {
        // Encontrar o _id do sub-documento 'item' correspondente
        const savedSaleItem = newSale.items.find(
          (i) =>
            i.variant.toString() === backlog.product_variant.toString() &&
            i.fulfillment_status === 'pending_stock'
        );

        return purchaseBacklogRepository.create({
          ...backlog,
          source_sale: newSale._id,
          source_sale_item: savedSaleItem._id, // Link para o sub-documento
        });
      });
      await Promise.all(backlogPromises);
    }

    // Atualizar o estoque (tornando-o negativo se necessário)
    await productVariantRepository.updateStockBatch(stockUpdates);

    return newSale;
  }
  // -----------------------------------------------------------------------------
  _calculateFinalAmount({ subtotal, settings, payment }) {
    const clientDiscountPercentage = payment.discount_percentage || 0;

    const safeClientPercentage =
      clientDiscountPercentage > 100
        ? 100
        : clientDiscountPercentage < 0
        ? 0
        : clientDiscountPercentage;
    const clientDiscountAmount = (subtotal * safeClientPercentage) / 100;

    const paymentMethod = settings.payment_methods.find(
      (pm) => pm.key === payment.method
    );

    if (!paymentMethod || !paymentMethod.is_active) {
      throw new Error(
        `Forma de pagamento '${payment.method}' não é válida ou está inativa.`
      );
    }

    const methodDiscountRate = paymentMethod.discount_percentage / 100;
    const methodDiscountAmount = subtotal * methodDiscountRate;

    let totalDiscountApplied = methodDiscountAmount + clientDiscountAmount;

    let netSaleAmount = subtotal - totalDiscountApplied;
    let finalAmountWithInterest = netSaleAmount;
    let interestRate = 0;
    let interestAmount = 0;

    let totalDiscountPercentage = 0;
    if (subtotal > 0) {
      totalDiscountPercentage = (totalDiscountApplied / subtotal) * 100;
    }

    if (netSaleAmount < 0) {
      netSaleAmount = 0;
      finalAmountWithInterest = 0;
      totalDiscountApplied = subtotal;
      totalDiscountPercentage = 100;
    }

    if (payment.method === 'card' || payment.method === 'credit') {
      const installmentRule = this._findBestInstallmentRule(
        settings.installment_rules,
        netSaleAmount
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

        const calculatedValues = this._calculateRepassedInterest(
          netSaleAmount,
          ruleDetail.interest_rate_percentage
        );

        finalAmountWithInterest = calculatedValues.totalValue;
        interestAmount = calculatedValues.interestAmount;
        interestRate = calculatedValues.interestRate;
      } else {
        throw new Error(
          'Erro de configuração: Regra de parcelamento não encontrada.'
        );
      }
    }

    return {
      netSaleAmount: parseFloat(netSaleAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmountWithInterest.toFixed(2)),
      interestAmount: parseFloat(interestAmount.toFixed(2)),
      discountApplied: parseFloat(totalDiscountApplied.toFixed(2)),
      discountPercentage: parseFloat(totalDiscountPercentage.toFixed(2)),
      interestRate: interestRate, // Já está na forma de porcentagem (ex: 5.70)
    };
  }

  // -----------------------------------------------------------------------------
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
  // -----------------------------------------------------------------------------
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
    const summary = await saleRepository.getSalesSummary();

    if (!summary || summary.length === 0) {
      return {
        totalVendas: 0,
        valorTotalVendas: 0,
        totalDescontoAplicado: 0,
        metodosDePagamento: {},
        topClientes: [],
      };
    }

    const data = summary[0];

    let metodos = {};
    if (Array.isArray(data.metodosDePagamento)) {
      data.metodosDePagamento.forEach((item) => {
        metodos[item.k] = (metodos[item.k] || 0) + item.v;
      });
    } else {
      metodos = data.metodosDePagamento;
    }

    return {
      totalVendas: data.totalVendas,
      valorTotalVendas: parseFloat(data.valorTotalVendas.toFixed(2)),
      totalDescontoAplicado: parseFloat(data.totalDescontoAplicado.toFixed(2)),
      metodosDePagamento: metodos,
      topClientes: data.topClientes || [],
    };
  }

  async getAllSales(fulfillment_status) {
    // Alterado para filtrar pelo novo status de atendimento
    return await saleRepository.findAll(fulfillment_status);
  }
}

export default new SaleService();
