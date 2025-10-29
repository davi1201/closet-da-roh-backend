import DesiredProductRepository from './desired-product-repository.js';

class DesiredProductService {
  async create(productData) {
    const clientId = productData.client;

    if (!clientId) {
      throw new Error('Client ID é obrigatório para o upsert.');
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Início do dia

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // Fim do dia

    return await DesiredProductRepository.upsertByClientAndDate(
      clientId,
      startOfDay,
      endOfDay,
      productData
    );
  }

  async findById(id) {
    return await DesiredProductRepository.findById(id);
  }

  async findAll() {
    return await DesiredProductRepository.findAll();
  }

  async findByClientId(clientId) {
    return await DesiredProductRepository.findByClientId(clientId);
  }

  async delete(id) {
    return await DesiredProductRepository.delete(id);
  }
}

export default new DesiredProductService();
