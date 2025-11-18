import { AccountsReceivableModel } from './acount-receivable-model.js';

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

async function getDataByMonth(filters) {
  const { month, year, status } = filters;

  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonthIndex = month ? month - 1 : now.getMonth();

  const startDate = new Date(Date.UTC(targetYear, targetMonthIndex, 1));
  const endDate = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 1));

  const matchQuery = {
    convertedDueDate: {
      $gte: startDate,
      $lt: endDate,
    },
  };

  if (status && status !== 'ALL') {
    matchQuery.status = status;
  }

  const pipeline = [
    {
      $addFields: {
        convertedDueDate: { $toDate: '$dueDate' },
      },
    },
    {
      $match: matchQuery,
    },
    {
      $facet: {
        receivables: [
          { $sort: { convertedDueDate: 1 } },
          {
            $lookup: {
              from: 'clients',
              localField: 'customerId',
              foreignField: '_id',
              as: 'client',
            },
          },
          {
            $unwind: {
              path: '$client',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              client: {
                _id: '$client._id',
                name: '$client.name',
              },
            },
          },
          {
            $project: { convertedDueDate: 0 },
          },
        ],
        metadata: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ],
      },
    },
  ];

  try {
    const result = await AccountsReceivableModel.aggregate(pipeline);

    const data = result[0];
    const receivables = data.receivables;
    const total = data.metadata.length > 0 ? data.metadata[0].total : 0;

    return { receivables, total };
  } catch (error) {
    console.error('Erro ao buscar dados de contas a receber:', error);
    throw new Error('Falha ao buscar dados de contas a receber.');
  }
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

async function deleteBySaleId(saleId) {
  return AccountsReceivableModel.deleteMany({ saleId });
}

export const accountsReceivableRepository = {
  createMany,
  getDataByMonth,
  updateById,
  deleteBySaleId,
};
