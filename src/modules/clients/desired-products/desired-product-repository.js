// desiredProduct/desired-product-repository.js (Exemplo de caminho)
import DesiredProduct from './desired-product-model.js';

class DesiredProductRepository {
  async create(productData) {
    const newProduct = new DesiredProduct(productData);
    return await newProduct.save();
  }

  async findById(id) {
    return await DesiredProduct.findById(id).lean();
  }

  async findByClientId(clientId) {
    return await DesiredProduct.find({ client: clientId }).lean();
  }

  async delete(id) {
    return await DesiredProduct.findByIdAndDelete(id);
  }
}

export default new DesiredProductRepository();
