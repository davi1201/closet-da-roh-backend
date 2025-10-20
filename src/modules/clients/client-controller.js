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
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message }); // 404 Not Found
      }

      // 500 Internal Server Error
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
      // Converte o query param 'active' (string) para boolean
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
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message }); // 404 Not Found
      }
      if (
        error.message.includes('não é possível atualizar') ||
        error.message.includes('dados inválidos')
      ) {
        return res.status(400).json({ message: error.message }); // 400 Bad Request (Regra de Negócio)
      }

      // 500 Internal Server Error
      console.error('Erro ao atualizar cliente:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  /**
   * [POST] /api/clients/:id/desired-product
   * Adiciona um produto à lista de desejos.
   */
  async addDesiredProduct(req, res) {
    try {
      const { id } = req.params;
      const productData = req.body; // Deve conter { fotoUrl, descricao }

      const updatedClient = await ClientService.addDesiredProduct(
        id,
        productData
      );

      // 200 OK (ou 201 se preferir para criação de sub-recurso)
      return res.status(200).json(updatedClient);
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message }); // 404 Not Found
      }
      if (error.message.includes('Limite de')) {
        return res.status(403).json({ message: error.message }); // 403 Forbidden (ou 400 Bad Request)
      }

      // 500 Internal Server Error
      console.error('Erro ao adicionar produto desejado:', error);
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

      // 204 No Content: Sucesso na ação, mas não há corpo para retornar
      return res.status(204).send();
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message }); // 404 Not Found
      }

      // 500 Internal Server Error
      console.error('Erro ao desativar cliente:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
}

// Exporta uma instância para uso nas rotas
export default new ClientController();
