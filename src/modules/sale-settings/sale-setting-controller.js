import saleSettingService from './sale-setting-service.js';

const getSaleSettings = async (req, res, next) => {
  try {
    const settings = await saleSettingService.getSaleSettings();
    return res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
};

const updateSaleSettings = async (req, res, next) => {
  try {
    const updatedSettings = await saleSettingService.updateSaleSettings(
      req.body
    );
    return res.status(200).json(updatedSettings);
  } catch (error) {
    next(error);
  }
};

// --- CONTROLLER DE REGRAS DE PARCELAMENTO ---

const getAllInstallmentRules = async (req, res, next) => {
  try {
    const rules = await saleSettingService.getAllInstallmentRules();
    return res.status(200).json(rules);
  } catch (error) {
    next(error);
  }
};

const createInstallmentRule = async (req, res, next) => {
  try {
    const newRule = await saleSettingService.createInstallmentRule(req.body);
    return res.status(201).json(newRule);
  } catch (error) {
    next(error);
  }
};

const updateInstallmentRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedRule = await saleSettingService.updateInstallmentRule(
      id,
      req.body
    );
    return res.status(200).json(updatedRule);
  } catch (error) {
    next(error);
  }
};

const deleteInstallmentRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await saleSettingService.deleteInstallmentRule(id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  getSaleSettings,
  updateSaleSettings,
  getAllInstallmentRules,
  createInstallmentRule,
  updateInstallmentRule,
  deleteInstallmentRule,
};
