import ClientRepository from './client-repository.js'; // Importa o Repositório

class ClientService {
  /**
   * Cria um novo cliente após validar dados básicos.
   * @param {Object} clientData - Os dados do novo cliente.
   * @returns {Promise<Object>} O novo cliente criado.
   */
  async createClient(clientData) {
    const existingClient = await ClientRepository.findByPhoneNumber(
      clientData.phoneNumber || clientData.telefone
    );

    if (existingClient) {
      throw new Error(
        'Já existe um cliente cadastrado com este número de telefone.'
      );
    }

    clientData.name = clientData.name
      ? clientData.name.toUpperCase()
      : clientData.name;

    clientData.is_active = true;

    return await ClientRepository.create(clientData);
  }

  //---

  /**
   * Obtém um cliente, verificando se ele existe.
   * @param {string} id - O ID do cliente.
   * @returns {Promise<Object|null>} O cliente encontrado.
   */
  async getClientById(id) {
    const client = await ClientRepository.findById(id);

    if (!client) {
      throw new Error(`Cliente com ID ${id} não encontrado.`);
    }

    // Exemplo de Lógica de Negócio #3: Filtrar campos antes de retornar (opcional)
    // Se você não usou .lean() no repo, poderia fazer: client.productsDesejados = [];

    return client;
  }

  //---

  /**
   * Atualiza os dados de um cliente.
   * @param {string} id - O ID do cliente a ser atualizado.
   * @param {Object} updateData - Os dados a serem atualizados.
   * @returns {Promise<Object>} O cliente atualizado.
   */
  async updateClient(id, updateData) {
    // Exemplo de Lógica de Negócio #4: Não permitir alterar o poder aquisitivo se o campo X não estiver preenchido
    if (updateData.purchasingPower && !updateData.profession) {
      // Lança um erro de negócio
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

  //---

  /**
   * Adiciona um novo produto desejado à lista do cliente.
   * Esta é uma função típica de Service, que envolve uma lógica específica.
   * @param {string} clientId - O ID do cliente.
   * @param {Object} productData - { fotoUrl: string, descricao: string }
   * @returns {Promise<Object>} O cliente atualizado.
   */
  async addDesiredProduct(clientId, productData) {
    // 1. Lógica de Negócio: Limite de itens na lista de desejos
    const client = await ClientRepository.findById(clientId);

    if (!client) {
      throw new Error(`Cliente com ID ${clientId} não encontrado.`);
    }

    if (client.desiredProducts.length >= 10) {
      throw new Error('Limite de 10 produtos desejados atingido.');
    }

    // 2. Cria o objeto de atualização para o MongoDB
    const updateQuery = {
      $push: {
        desiredProducts: productData,
      },
    };

    // 3. Delega a atualização ao repositório
    return await ClientRepository.update(clientId, updateQuery);
  }

  //---

  /**
   * Retorna todos os clientes.
   * @param {boolean} onlyActive - Se deve retornar apenas clientes ativos (padrão: true).
   * @returns {Promise<Array<Object>>} Lista de clientes.
   */
  async listClients(onlyActive) {
    return await ClientRepository.findAll(onlyActive);
  }

  //---

  /**
   * Desativa um cliente.
   * @param {string} id - O ID do cliente.
   * @returns {Promise<Object>} O cliente desativado.
   */
  async deactivateClient(id) {
    const deactivated = await ClientRepository.deactivate(id);

    if (!deactivated) {
      throw new Error(`Cliente com ID ${id} não encontrado para desativação.`);
    }

    return deactivated;
  }
}

export default new ClientService();
