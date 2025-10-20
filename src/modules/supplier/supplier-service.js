import supplierRepository from './supplier-repository.js';

class SupplierService {
  /**
   * Cria um novo fornecedor após validar a unicidade do documento.
   * @param {object} data - Dados do fornecedor.
   * @returns {Promise<object>} O novo fornecedor.
   */
  async createSupplier(data) {
    // 1. Lógica de Validação: Checar se o documento (CNPJ/CPF) já existe
    const existingSupplier = await supplierRepository.findByDocument(
      data.document_number
    );

    if (existingSupplier) {
      throw new Error(
        `O documento ${data.document_number} já está cadastrado em outro fornecedor.`
      );
    }

    // 2. Lógica de Criação
    const newSupplier = await supplierRepository.create(data);
    return newSupplier;
  }

  /**
   * Obtém um fornecedor por ID e verifica se ele existe.
   * @param {string} id - ID do fornecedor.
   * @returns {Promise<object>} O fornecedor.
   */
  async getSupplierById(id) {
    const supplier = await supplierRepository.findById(id);

    if (!supplier || supplier.is_active === false) {
      throw new Error('Fornecedor não encontrado ou inativo.');
    }

    return supplier;
  }

  /**
   * Obtém a lista de todos os fornecedores ativos.
   * @returns {Promise<Array>} Lista de fornecedores.
   */
  async getAllActiveSuppliers() {
    return await supplierRepository.findAll(true);
  }

  /**
   * Atualiza os dados de um fornecedor.
   * @param {string} id - ID do fornecedor.
   * @param {object} updateData - Dados a serem atualizados.
   * @returns {Promise<object>} O fornecedor atualizado.
   */
  async updateSupplier(id, updateData) {
    const updatedSupplier = await supplierRepository.update(id, updateData);

    if (!updatedSupplier) {
      throw new Error('Falha ao atualizar. Fornecedor não encontrado.');
    }

    return updatedSupplier;
  }

  /**
   * Realiza o soft delete (desativação) de um fornecedor.
   * @param {string} id - ID do fornecedor.
   */
  async deactivateSupplier(id) {
    const supplier = await supplierRepository.deactivate(id);

    if (!supplier) {
      throw new Error('Falha ao desativar. Fornecedor não encontrado.');
    }

    return { message: 'Fornecedor desativado com sucesso.' };
  }
}

export default new SupplierService();
