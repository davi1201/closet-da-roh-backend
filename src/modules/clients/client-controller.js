import ClientService from './client-service.js'; // Importa o Service

class ClientController {
  /**
   * [POST] /api/clients
   * Cria um novo cliente.
   */
  async createClient(req, res) {
    try {
      const clientData = req.body;
      const newClient = await ClientService.createClient(clientData);

      return res.status(201).json(newClient);
    } catch (error) {
      if (error.message.includes('já existe')) {
        return res.status(409).json({ message: error.message });
      }

      // 400 Bad Request: Dados inválidos
      if (
        error.name === 'ValidationError' ||
        error.message.includes('obrigatório')
      ) {
        return res.status(400).json({
          message: 'Dados inválidos ou incompletos.',
          details: error.message,
        });
      }

      console.error('Erro ao criar cliente:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  /**
   * [GET] /api/clients/:id
   * Busca um cliente por ID.
   */
  async getClientById(req, res) {
    try {
      const { id } = req.params;
      const client = await ClientService.getClientById(id);

      // 200 OK: Retorna os dados
      return res.status(200).json(client);
    } catch (error) {
      // 404 Not Found
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }

      console.error('Erro ao buscar cliente:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  /**
   * [GET] /api/clients?active=false
   * Retorna todos os clientes, com a opção de filtrar inativos.
   */
  async listClients(req, res) {
    try {
      const onlyActive = req.query.active !== 'false';
      const clients = await ClientService.listClients(onlyActive);

      // 200 OK: Retorna a lista
      return res.status(200).json(clients);
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  /**
   * [PUT] /api/clients/:id
   * Atualiza os dados de um cliente.
   */
  async updateClient(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedClient = await ClientService.updateClient(id, updateData);

      // 200 OK: Retorna o documento atualizado
      return res.status(200).json(updatedClient);
    } catch (error) {
      // 404 Not Found
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }

      // 400 Bad Request (Regra de Negócio)
      if (
        error.message.includes('não é possível atualizar') ||
        error.message.includes('dados inválidos')
      ) {
        return res.status(400).json({ message: error.message });
      }

      console.error('Erro ao atualizar cliente:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  /**
   * [POST] /api/clients/:clientId/desired-product
   * Adiciona um produto à lista de desejos.
   */
  async addDesiredProduct(req, res) {
    try {
      // --- AJUSTE: Renomeado para 'clientId' para clareza ---
      const { clientId } = req.params;
      const productData = req.body; // Deve conter { photoUrl, description }

      // --- AJUSTE: O service agora retorna o *novo produto* ---
      const newProduct = await ClientService.addDesiredProduct(
        clientId,
        productData
      );

      // --- AJUSTE: Retorna 201 Created e o novo produto ---
      return res.status(201).json(newProduct);
    } catch (error) {
      // 404 Not Found
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      // 403 Forbidden (ou 400 Bad Request), regra de negócio
      if (error.message.includes('Limite de')) {
        return res.status(403).json({ message: error.message });
      }

      console.error('Erro ao adicionar produto desejado:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  /**
   * [DELETE] /api/clients/:clientId/desired-product/:productId
   * Remove um produto da lista de desejos.
   */
  async removeDesiredProduct(req, res) {
    try {
      const { clientId, productId } = req.params;

      await ClientService.removeDesiredProduct(clientId, productId);

      // 204 No Content: Sucesso, sem corpo de resposta
      return res.status(204).send();
    } catch (error) {
      // 404 Not Found (Cliente ou Produto)
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      // 403 Forbidden (Cliente não é "dono" do produto)
      if (error.message.includes('não autorizado')) {
        return res.status(403).json({ message: error.message });
      }

      console.error('Erro ao remover produto desejado:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  /**
   * [DELETE] /api/clients/:id/deactivate
   * Marca o cliente como inativo.
   */
  async deactivateClient(req, res) {
    try {
      const { id } = req.params;
      await ClientService.deactivateClient(id);

      // 204 No Content: Sucesso na ação
      return res.status(204).send();
    } catch (error) {
      // 404 Not Found
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }

      console.error('Erro ao desativar cliente:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  async getClientByPhone(req, res) {
    try {
      const { phone } = req.params;
      const client = await ClientService.findByPhone(phone);

      // 200 OK: Retorna os dados
      return res.status(200).json(client);
    } catch (error) {
      // 404 Not Found
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }

      console.error('Erro ao buscar cliente por telefone:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
}

// Exporta uma instância para uso nas rotas
export default new ClientController();
