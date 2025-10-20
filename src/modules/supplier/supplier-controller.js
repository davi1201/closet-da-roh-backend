import supplierService from './supplier-service.js';

class SupplierController {
  /**
   * [POST /suppliers] Cria um novo fornecedor.
   */
  async create(req, res) {
    try {
      // A validação de campos obrigatórios do Schema Mongoose é suficiente aqui.
      const newSupplier = await supplierService.createSupplier(req.body);

      res.status(201).json(newSupplier);
    } catch (error) {
      // Trata erros de validação (ex: documento duplicado, campos Mongoose obrigatórios)
      // Esses erros virão do Service ou diretamente do Mongoose (se a validação falhar).
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * [GET /suppliers] Retorna todos os fornecedores ativos.
   */
  async getAll(req, res) {
    try {
      const suppliers = await supplierService.getAllActiveSuppliers();

      res.status(200).json(suppliers);
    } catch (error) {
      // Em caso de erro interno ou falha na conexão com o DB
      res
        .status(500)
        .json({ message: 'Falha ao buscar fornecedores. ' + error.message });
    }
  }

  /**
   * [GET /suppliers/:id] Retorna um fornecedor específico pelo ID.
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const supplier = await supplierService.getSupplierById(id);

      res.status(200).json(supplier);
    } catch (error) {
      // Trata o erro do Service (ex: "Fornecedor não encontrado ou inativo.")
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      res
        .status(500)
        .json({ message: 'Erro ao buscar fornecedor. ' + error.message });
    }
  }

  /**
   * [PUT /suppliers/:id] Atualiza os dados de um fornecedor.
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      // Validação de campos aqui pode ser adicionada (ex: evitar que o CNPJ seja atualizado)

      const updatedSupplier = await supplierService.updateSupplier(
        id,
        req.body
      );

      res.status(200).json(updatedSupplier);
    } catch (error) {
      // Trata erros de validação ou "não encontrado"
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      res
        .status(400)
        .json({ message: 'Falha ao atualizar fornecedor. ' + error.message });
    }
  }

  /**
   * [DELETE /suppliers/:id] Desativa (soft delete) um fornecedor.
   */
  async deactivate(req, res) {
    try {
      const { id } = req.params;
      await supplierService.deactivateSupplier(id);

      // 204 No Content é o padrão para sucesso em operações DELETE que não retornam dados.
      res.status(204).send();
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      res
        .status(400)
        .json({ message: 'Falha ao desativar fornecedor. ' + error.message });
    }
  }
}

export default new SupplierController();
