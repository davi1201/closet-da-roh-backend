import DesiredProduct from './desired-product-model.js';

class DesiredProductRepository {
  async create(productData) {
    const newProduct = new DesiredProduct(productData);
    return await newProduct.save();
  }

  async findAll() {
    return await DesiredProduct.find().populate('client').lean();
  }

  async findById(id) {
    return await DesiredProduct.findById(id).populate('client').lean();
  }

  async findByClientId(clientId) {
    return await DesiredProduct.find({ client: clientId })
      .populate('client')
      .lean();
  }

  async delete(id) {
    return await DesiredProduct.findByIdAndDelete(id);
  }

  async upsertByClientAndDate(clientId, startDate, endDate, productData) {
    const query = {
      client: clientId,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    };

    const dataForSet = { ...productData };
    delete dataForSet.client;
    // 2. Os Dados: O que será atualizado ou inserido
    // $set garante que os campos em productData substituam os antigos
    // $setOnInsert garante que o cliente seja definido apenas na criação
    const updateData = {
      $set: dataForSet,
      $setOnInsert: { client: clientId },
    };

    // 3. As Opções
    const options = {
      new: true, // Retorna o documento novo (ou o atualizado)
      upsert: true, // CRIA o documento se a 'query' não encontrar nada
      runValidators: true, // Garante que seu Schema seja validado
    };

    // Executa a operação atômica
    return await DesiredProduct.findOneAndUpdate(
      query,
      updateData,
      options
    ).lean();
  }
}

export default new DesiredProductRepository();
