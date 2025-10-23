// Ajuste o caminho conforme sua estrutura.
// Removido o '.js' e ajustado o caminho (provável)
import Client from './client-model.js';

class ClientRepository {
  /**
   * Cria um novo registro de cliente no banco de dados.
   * @param {Object} clientData - Os dados do novo cliente.
   * @returns {Promise<Object>} O novo documento do cliente salvo.
   */
  async create(clientData) {
    // Garante que os arrays de relacionamento não sejam enviados no 'create'
    delete clientData.appointments;
    delete clientData.desiredProducts;

    const newClient = new Client(clientData);
    return await newClient.save();
  }

  // ---

  /**
   * Encontra ou cria um cliente com base no número de telefone.
   * Útil para a tela de agendamento.
   * @param {Object} clientData - Dados do cliente (name, phone, address).
   * @returns {Promise<Object>} O documento do cliente encontrado ou recém-criado.
   */
  async findOrCreateByPhone(clientData) {
    const { phoneNumber, name, address } = clientData;

    if (!phoneNumber) {
      throw new Error('Phone number is required to find or create a client.');
    }

    // $set: Atualiza apenas os campos fornecidos se o cliente já existir.
    // $setOnInsert: Define o 'purchasingPower' e 'is_active' apenas na criação.
    const update = {
      $set: { name, address, phoneNumber },
      $setOnInsert: { purchasingPower: 'medium', is_active: true },
    };

    const options = {
      upsert: true, // Cria o documento se não existir
      new: true, // Retorna o documento novo/atualizado
      runValidators: true,
      setDefaultsOnInsert: true,
    };

    return await Client.findOneAndUpdate(
      { phoneNumber },
      update,
      options
    ).lean();
  }

  // ---

  /**
   * Encontra um cliente pelo seu ID e popula os dados relacionados.
   * @param {string} id - O ID do cliente.
   * @returns {Promise<Object|null>} O documento do cliente ou null.
   */
  async findById(id) {
    return await Client.findById(id)
      .populate('appointments') // <-- AJUSTE: Popula os agendamentos
      .populate('desiredProducts') // <-- AJUSTE: Popula os produtos desejados
      .lean();
  }

  // ---

  /**
   * Encontra um cliente pelo seu número de telefone e popula os dados.
   * @param {string} phoneNumber - O número de telefone do cliente.
   * @returns {Promise<Object|null>} O documento do cliente ou null.
   */
  async findByPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return null;
    }
    return await Client.findOne({ phoneNumber: phoneNumber })
      .populate('appointments') // <-- AJUSTE: Popula os agendamentos
      .populate('desiredProducts') // <-- AJUSTE: Popula os produtos desejados
      .lean();
  }

  // ---

  /**
   * Encontra todos os clientes, com opção de filtrar apenas os ativos.
   * NOTA: Não populamos os dados aqui por questões de performance (evitar N+1).
   * @param {boolean} onlyActive - Se deve retornar apenas clientes ativos (padrão: true).
   * @returns {Promise<Array<Object>>} Uma lista de documentos de clientes.
   */
  async findAll(onlyActive = true) {
    const query = onlyActive ? { is_active: true } : {};
    return await Client.find(query).sort({ name: 1 }).lean();
  }

  // ---

  /**
   * Atualiza os dados de um cliente existente.
   * Este método NÃO deve ser usado para atualizar os arrays de relacionamento.
   * @param {string} id - O ID do cliente a ser atualizado.
   * @param {Object} updateData - Os dados a serem atualizados.
   * @returns {Promise<Object|null>} O documento do cliente atualizado ou null.
   */
  async update(id, updateData) {
    // <-- AJUSTE: Proteção contra sobrescrita de arrays de relacionamento
    delete updateData.appointments;
    delete updateData.desiredProducts;

    return await Client.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  // ---

  /**
   * Desativa (marca como inativo) um cliente.
   * @param {string} id - O ID do cliente a ser desativado.
   * @returns {Promise<Object|null>} O documento do cliente desativado ou null.
   */
  async deactivate(id) {
    return await this.update(id, { is_active: false });
  }

  // --- MÉTODOS DE GERENCIAMENTO DE RELACIONAMENTO ---

  /**
   * Adiciona uma referência de agendamento ao cliente.
   * @param {string} clientId
   * @param {string} appointmentId
   */
  async addAppointment(clientId, appointmentId) {
    return await Client.findByIdAndUpdate(clientId, {
      $push: { appointments: appointmentId }, // $push adiciona ao array
    });
  }

  /**
   * Remove uma referência de agendamento do cliente.
   * @param {string} clientId
   * @param {string} appointmentId
   */
  async removeAppointment(clientId, appointmentId) {
    return await Client.findByIdAndUpdate(clientId, {
      $pull: { appointments: appointmentId }, // $pull remove do array
    });
  }

  /**
   * Adiciona uma referência de produto desejado ao cliente.
   * @param {string} clientId
   * @param {string} productId
   */
  async addDesiredProduct(clientId, productId) {
    return await Client.findByIdAndUpdate(clientId, {
      $push: { desiredProducts: productId },
    });
  }

  /**
   * Remove uma referência de produto desejado do cliente.
   * @param {string} clientId
   * @param {string} productId
   */
  async removeDesiredProduct(clientId, productId) {
    return await Client.findByIdAndUpdate(clientId, {
      $pull: { desiredProducts: productId },
    });
  }

  async countNewThisMonth(monthStart) {
    return await Client.countDocuments({ createdAt: { $gte: monthStart } });
  }

  async countActive() {
    return await Client.countDocuments({ is_active: true });
  }
}

export default new ClientRepository();
