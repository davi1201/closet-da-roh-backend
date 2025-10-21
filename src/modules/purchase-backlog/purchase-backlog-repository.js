// Crie este arquivo em:
// src/modules/purchase-backlog/purchase-backlog-repository.js

import PurchaseBacklog from './purchase-backlog-model.js'; // Assumindo que o model está na mesma pasta

class PurchaseBacklogRepository {
  /**
   * Cria uma nova entrada de pendência de compra.
   * Usado pelo SaleService quando uma venda é feita sem estoque.
   */
  async create(backlogData) {
    const newBacklog = new PurchaseBacklog(backlogData);
    return await newBacklog.save();
  }

  /**
   * Encontra pendências por status.
   * Usado pelo painel admin para mostrar a lista de "A Comprar".
   */
  async findByStatus(status = 'awaiting_purchase') {
    return await PurchaseBacklog.find({ status: status })
      .populate('product_variant') // Popula os detalhes da variante
      .populate('source_sale', 'client total_amount') // Popula detalhes da venda
      .sort({ createdAt: 1 }) // Mais antigas primeiro
      .lean();
  }

  /**
   * Encontra uma pendência pelo ID do item da venda
   * (Usado para atualizar o status quando o produto chega)
   */
  async findBySaleItemId(saleItemId) {
    return await PurchaseBacklog.findOne({ source_sale_item: saleItemId });
  }

  /**
   * Atualiza o status de uma pendência
   */
  async updateStatus(id, status, purchaseOrderId = null) {
    const updateData = { status: status };
    if (purchaseOrderId) {
      updateData.purchase_order = purchaseOrderId;
    }

    return await PurchaseBacklog.findByIdAndUpdate(id, updateData, {
      new: true,
    });
  }
}

export default new PurchaseBacklogRepository();
