import Client from './client-model.js'; // Assumindo que seu modelo de cliente está aqui

class ClientRepository {
  /**
   * Cria um novo registro de cliente no banco de dados.
   * @param {Object} clientData - Os dados do novo cliente.
   * @returns {Promise<Object>} O novo documento do cliente salvo.
   */
  async create(clientData) {
    const newClient = new Client(clientData);
    return await newClient.save();
  }

  //---

  /**
   * Encontra um cliente pelo seu ID.
   * @param {string} id - O ID do cliente.
   * @returns {Promise<Object|null>} O documento do cliente ou null.
   */
  async findById(id) {
    // .lean() retorna um objeto JavaScript simples (mais rápido)
    return await Client.findById(id).lean();
  }

  //---

  /**
   * Encontra um cliente pelo seu número de telefone.
   * Este método é análogo ao findByDocument no SupplierRepository.
   * @param {string} phoneNumber - O número de telefone do cliente.
   * @returns {Promise<Object|null>} O documento do cliente ou null.
   */
  async findByPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return null;
    }
    // Procuramos pelo campo 'phoneNumber' ou 'telefone' dependendo do seu modelo final
    return await Client.findOne({ phoneNumber: phoneNumber }).lean();
  }

  //---

  /**
   * Encontra todos os clientes, com opção de filtrar apenas os ativos.
   * @param {boolean} onlyActive - Se deve retornar apenas clientes ativos (padrão: true).
   * @returns {Promise<Array<Object>>} Uma lista de documentos de clientes.
   */
  async findAll(onlyActive = true) {
    // Assumimos que o modelo Client também tem um campo 'is_active'
    const query = onlyActive ? { is_active: true } : {};
    // Ordena pelo nome do cliente
    return await Client.find(query).sort({ name: 1 }).lean();
  }

  //---

  /**
   * Atualiza os dados de um cliente existente.
   * @param {string} id - O ID do cliente a ser atualizado.
   * @param {Object} updateData - Os dados a serem atualizados.
   * @returns {Promise<Object|null>} O documento do cliente atualizado ou null.
   */
  async update(id, updateData) {
    return await Client.findByIdAndUpdate(id, updateData, {
      new: true, // Retorna o documento modificado em vez do original
      runValidators: true, // Executa as validações do schema no update
    }).lean();
  }

  //---

  /**
   * Desativa (marca como inativo) um cliente.
   * @param {string} id - O ID do cliente a ser desativado.
   * @returns {Promise<Object|null>} O documento do cliente desativado ou null.
   */
  async deactivate(id) {
    // Reutiliza o método update para definir is_active como false
    return await this.update(id, { is_active: false });
  }
}

export default new ClientRepository();
