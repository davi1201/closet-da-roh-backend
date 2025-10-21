// repositories/sale-setting-repository.js

import SaleSetting from './sale-setting-model.js';

class SaleSettingRepository {
  async getSettings() {
    let settings = await SaleSetting.findOne().lean();

    if (!settings) {
      settings = await SaleSetting.create({});
      return settings.toObject();
    }

    return settings;
  }

  async updateSettings(updateData) {
    const existingSettings = await this.getSettings();

    const updatedSettings = await SaleSetting.findByIdAndUpdate(
      existingSettings._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    return updatedSettings;
  }
}

export default new SaleSettingRepository();
