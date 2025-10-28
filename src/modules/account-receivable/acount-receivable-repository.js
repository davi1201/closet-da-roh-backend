import { AccountsReceivableModel } from './acount-receivable-model.js';

/**
 * Cria múltiplas entradas de contas a receber de uma só vez.
 * @param {Array<object>} receivablesData - Um array de objetos de parcela.
 */
async function createMany(receivablesData) {
  if (!receivablesData || receivablesData.length === 0) {
    return;
  }
  try {
    await AccountsReceivableModel.insertMany(receivablesData);
    console.log(`[Repo] Inseridas ${receivablesData.length} parcelas.`);
  } catch (error) {
    console.error('Erro ao inserir contas a receber no repositório:', error);
    throw new Error('Falha ao salvar parcelas no banco de dados.');
  }
}

async function find(filters) {
  return AccountsReceivableModel.find(filters)
    .populate('customerId', 'name')
    .sort({ dueDate: 1 })
    .lean();
}

async function updateById(id, data) {
  return AccountsReceivableModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  )
    .populate('customerId', 'name')
    .lean();
}

export const accountsReceivableRepository = {
  createMany,
  find,
  updateById,
};
