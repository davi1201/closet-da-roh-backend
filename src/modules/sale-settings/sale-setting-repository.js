// repositories/sale-setting-repository.js

import SaleSetting from './sale-setting-model.js';

class SaleSettingRepository {
  /**
   * Obtém a configuração de venda. Se não existir, cria a configuração inicial com defaults.
   * @returns {Promise<Object>} As configurações de venda.
   */
  async getSettings() {
    // Tenta encontrar a configuração existente
    let settings = await SaleSetting.findOne().lean();

    // Se não encontrar, cria uma nova com os valores default do Schema
    if (!settings) {
      // O SaleSetting.create({}) usará os defaults definidos no Mongoose Schema
      settings = await SaleSetting.create({});
      return settings.toObject();
    }

    return settings;
  }

  /**
   * Atualiza as configurações de venda existentes.
   * @param {Object} updateData Dados para atualização (ex: default_margin_percentage, payment_methods).
   * @returns {Promise<Object>} As configurações atualizadas.
   */
  async updateSettings(updateData) {
    // Primeiro, garante que o documento exista para ter o _id
    const existingSettings = await this.getSettings();

    // Atualiza o documento usando o ID encontrado
    const updatedSettings = await SaleSetting.findByIdAndUpdate(
      existingSettings._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    return updatedSettings;
  }
}

export default new SaleSettingRepository();
