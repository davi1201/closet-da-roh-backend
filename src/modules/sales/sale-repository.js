import Sale from './sale-model.js';

class SaleRepository {
  /**
   * Cria um novo registro de venda.
   * @param {Object} saleData Dados completos da venda.
   * @returns {Promise<Object>} A venda recém-criada.
   */
  async create(saleData) {
    const newSale = new Sale(saleData);
    return await newSale.save();
  }

  /**
   * Encontra uma venda pelo ID e popula referências.
   * @param {string} id ID da venda.
   * @returns {Promise<Object>} A venda.
   */
  async findById(id) {
    return await Sale.findById(id)
      .populate('customer')
      .populate('sold_by')
      // Nota: Populating 'items.variant' é complexo e geralmente desnecessário
      // pois os dados da venda devem ser históricos (capturados no SaleItemSchema)
      .lean();
  }

  /**
   * Lista todas as vendas, opcionalmente filtrando por status.
   * @param {string} status Status para filtrar ('completed', 'pending', 'canceled').
   * @returns {Promise<Array>} Lista de vendas.
   */
  async findAll(status = 'completed') {
    const query = status ? { status: status } : {};
    return await Sale.find(query)
      .sort({ createdAt: -1 })
      .populate('customer')
      .lean();
  }
}

export default new SaleRepository();
