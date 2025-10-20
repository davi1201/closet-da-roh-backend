import InstallmentRule from './installment-rule-model.js';

class InstallmentRuleRepository {
  /**
   * Cria uma nova regra de parcelamento.
   * @param {Object} ruleData Dados da regra (min_purchase_value, rules).
   * @returns {Promise<Object>} A nova regra criada.
   */
  async create(ruleData) {
    const newRule = new InstallmentRule(ruleData);
    return await newRule.save();
  }

  /**
   * Retorna todas as regras de parcelamento, ordenadas pelo valor mínimo de compra.
   * Isso é crucial para que o serviço possa encontrar a regra mais aplicável.
   * @returns {Promise<Array>} Lista de regras.
   */
  async findAll() {
    return await InstallmentRule.find({})
      .sort({ min_purchase_value: 1 })
      .lean();
  }

  /**
   * Encontra uma regra de parcelamento pelo ID.
   * @param {string} id ID da regra.
   * @returns {Promise<Object | null>} A regra encontrada.
   */
  async findById(id) {
    return await InstallmentRule.findById(id).lean();
  }

  /**
   * Atualiza uma regra de parcelamento.
   * @param {string} id ID da regra.
   * @param {Object} updateData Dados para atualização (ex: { min_purchase_value: 500, rules: [...] }).
   * @returns {Promise<Object>} A regra atualizada.
   */
  async update(id, updateData) {
    return await InstallmentRule.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async findApplicableRule(purchaseValue) {
    // 1. Procura por todas as regras onde min_purchase_value <= purchaseValue.
    // 2. Ordena em ordem decrescente (maior valor primeiro).
    // 3. Limita a 1, pegando a regra mais restritiva (maior min_purchase_value).
    const rule = await InstallmentRule.findOne({
      min_purchase_value: { $lte: purchaseValue }, // $lte = less than or equal
    })
      .sort({ min_purchase_value: -1 }) // -1 para ordem decrescente
      .lean();

    return rule;
  }

  /**
   * Deleta uma regra de parcelamento.
   * @param {string} id ID da regra.
   * @returns {Promise<Object | null>} A regra deletada.
   */
  async delete(id) {
    return await InstallmentRule.findByIdAndDelete(id).lean();
  }
}

export default new InstallmentRuleRepository();
