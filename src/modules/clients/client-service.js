import ClientRepository from './client-repository.js';
import DesiredProductRepository from './desired-products/desired-product-repository.js';

class ClientService {
  async createClient(clientData) {
    const existingClient = await ClientRepository.findByPhoneNumber(
      clientData.phoneNumber
    );

    if (existingClient) {
      throw new Error(
        'Já existe um cliente cadastrado com este número de telefone.'
      );
    }

    clientData.is_active = true;

    return await ClientRepository.create(clientData);
  }

  async findOrCreateClient(clientData) {
    if (!clientData.phoneNumber || !clientData.name || !clientData.address) {
      throw new Error('Nome, Telefone e Endereço são obrigatórios.');
    }

    return await ClientRepository.findOrCreateByPhone(clientData);
  }

  async getClientById(id) {
    const client = await ClientRepository.findById(id);

    if (!client) {
      throw new Error(`Cliente com ID ${id} não encontrado.`);
    }
    return client;
  }

  async updateClient(id, updateData) {
    if (updateData.purchasingPower && !updateData.profession) {
      throw new Error(
        'Não é possível atualizar o poder aquisitivo sem informar a profissão.'
      );
    }

    const updatedClient = await ClientRepository.update(id, updateData);

    if (!updatedClient) {
      throw new Error(`Cliente com ID ${id} não encontrado.`);
    }

    return updatedClient;
  }

  async addDesiredProduct(clientId, productData) {
    const client = await this.getClientById(clientId);

    if (client.desiredProducts.length >= 10) {
      throw new Error('Limite de 10 produtos desejados atingido.');
    }

    const newProduct = await DesiredProductRepository.create({
      ...productData,
      client: clientId,
    });

    await ClientRepository.addDesiredProduct(clientId, newProduct._id);

    return newProduct;
  }

  async removeDesiredProduct(clientId, productId) {
    const product = await DesiredProductRepository.findById(productId);
    if (!product) {
      throw new Error('Produto desejado não encontrado.');
    }

    if (product.client.toString() !== clientId) {
      throw new Error('Cliente não autorizado a remover este produto.');
    }

    await DesiredProductRepository.delete(productId);

    await ClientRepository.removeDesiredProduct(clientId, productId);

    return { success: true, removedId: productId };
  }

  async listClients(onlyActive) {
    let clients = await ClientRepository.findAll(onlyActive);

    clients = clients.map((client) => ({
      ...client,
      products_url:
        process.env.FRONTEND_URL + `/products?client_id=${client.phoneNumber}`,
    }));

    return clients;
  }

  async deactivateClient(id) {
    const deactivated = await ClientRepository.deactivate(id);

    if (!deactivated) {
      throw new Error(`Cliente com ID ${id} não encontrado para desativação.`);
    }

    return deactivated;
  }

  async linkAppointmentToClient(clientId, appointmentId) {
    return await ClientRepository.addAppointment(clientId, appointmentId);
  }

  async unlinkAppointmentFromClient(clientId, appointmentId) {
    return await ClientRepository.removeAppointment(clientId, appointmentId);
  }

  async findByPhone(phoneNumber) {
    // O 'normalizeString' (que remove '()', '-') deve estar no seu repo
    const client = await ClientRepository.findByPhoneNumber(phoneNumber);
    if (!client) {
      throw new Error('Cliente não encontrado.');
    }
    // IMPORTANTE: Retorne APENAS o que é seguro para o público
    return {
      _id: client._id,
      name: client.name,
    };
  }
}

export default new ClientService();
