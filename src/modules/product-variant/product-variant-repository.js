import ProductVariant from './product-variant-model.js';

const createVariant = async (variantData) => {
  const newVariant = new ProductVariant(variantData);
  return await newVariant.save();
};

const findVariantsByProductIds = async (productIds) => {
  return await ProductVariant.find({
    product: { $in: productIds },
  }).lean();
};

const findVariantsByIds = async (ids) => {
  return await ProductVariant.find({ _id: { $in: ids } })
    .populate({
      path: 'product',
      populate: { path: 'supplier' },
    })
    .lean();
};

const updateVariant = async (id, updateData) => {
  return await ProductVariant.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

const removeVariant = async (id) => {
  return await ProductVariant.findByIdAndDelete(id);
};

const updatePricesAndLogHistory = async (
  variantId,
  newBuyPrice,
  newSalePrice
) => {
  const variant = await ProductVariant.findById(variantId);

  if (!variant) {
    throw new Error('Variação de Produto não encontrada.');
  }

  const oldBuyPrice = variant.buy_price;
  const oldSalePrice = variant.sale_price;

  if (oldBuyPrice === newBuyPrice && oldSalePrice === newSalePrice) {
    return variant;
  }

  const newHistoryEntry = {
    buyPrice: oldBuyPrice,
    salePrice: oldSalePrice,
    changedAt: new Date(),
  };

  const updatedVariant = await ProductVariant.findByIdAndUpdate(
    variantId,
    {
      $set: {
        buy_price: newBuyPrice,
        sale_price: newSalePrice,
      },
      $push: { price_history: newHistoryEntry },
    },
    { new: true, runValidators: true }
  ).lean();

  return updatedVariant;
};

const updateStockBatch = async (stockUpdates) => {
  if (!stockUpdates || stockUpdates.length === 0) {
    return;
  }

  const operations = stockUpdates.map((update) => ({
    updateOne: {
      filter: { _id: update.variantId },
      update: {
        $inc: {
          quantity:
            update.operation === 'decrement'
              ? -update.quantity
              : update.quantity,
        },
      },
    },
  }));

  try {
    const result = await ProductVariant.bulkWrite(operations);
    return result;
  } catch (error) {
    console.error('Erro durante a atualização de estoque em lote:', error);
    throw new Error(
      'Falha ao atualizar o estoque durante o processamento da venda.'
    );
  }
};

const countLowStock = async () => {
  return await ProductVariant.countDocuments({
    $expr: { $lte: ['$quantity', '$minimum_stock'] },
  });
};

/**
 * MÉTODO CORRIGIDO: Calcula valores de inventário com os campos corretos
 * Considera:
 * - buy_price (custo de compra)
 * - sale_price (preço de venda)
 * - quantity (quantidade em estoque)
 * - Apenas variantes com estoque > 0
 */
const calculateInventoryValue = async () => {
  try {
    const result = await ProductVariant.aggregate([
      // 1. Filtra apenas variantes com estoque disponível
      {
        $match: {
          quantity: { $gt: 0 },
        },
      },

      // 2. Calcula os valores para cada variante
      {
        $project: {
          // Custo total = preço de compra × quantidade
          costValue: {
            $multiply: [
              { $ifNull: ['$buy_price', 0] }, // Usa 0 se buy_price for null/undefined
              { $ifNull: ['$quantity', 0] },
            ],
          },
          // Valor de venda total = preço de venda × quantidade
          saleValue: {
            $multiply: [
              { $ifNull: ['$sale_price', 0] }, // Usa 0 se sale_price for null/undefined
              { $ifNull: ['$quantity', 0] },
            ],
          },
          quantity: 1, // Mantém o campo quantity para contar
        },
      },

      // 3. Agrupa tudo e soma os valores
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$costValue' },
          totalSaleValue: { $sum: '$saleValue' },
          totalVariants: { $sum: 1 },
          totalStockQuantity: { $sum: '$quantity' },
        },
      },

      // 4. Formata o resultado final com arredondamento
      {
        $project: {
          _id: 0,
          totalCost: { $round: ['$totalCost', 2] },
          totalSaleValue: { $round: ['$totalSaleValue', 2] },
          totalVariants: 1,
          totalStockQuantity: 1,
          // Calcula lucro estimado
          estimatedProfit: {
            $round: [{ $subtract: ['$totalSaleValue', '$totalCost'] }, 2],
          },
          // Calcula margem de lucro percentual
          profitMargin: {
            $cond: {
              if: { $gt: ['$totalSaleValue', 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $subtract: ['$totalSaleValue', '$totalCost'] },
                          '$totalSaleValue',
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
        },
      },
    ]);

    // Retorna o resultado ou valores padrão se não houver estoque
    if (result.length > 0) {
      return result[0];
    } else {
      return {
        totalCost: 0,
        totalSaleValue: 0,
        totalVariants: 0,
        totalStockQuantity: 0,
        estimatedProfit: 0,
        profitMargin: 0,
      };
    }
  } catch (error) {
    console.error('Erro ao calcular valores de inventário:', error);
    // Em caso de erro, retorna valores zerados ao invés de quebrar
    return {
      totalCost: 0,
      totalSaleValue: 0,
      totalVariants: 0,
      totalStockQuantity: 0,
      estimatedProfit: 0,
      profitMargin: 0,
    };
  }
};

/**
 * NOVO MÉTODO: Busca variantes com estoque baixo (para alertas no dashboard)
 */
const findLowStock = async (limit = 10) => {
  try {
    return await ProductVariant.find({
      $expr: { $lte: ['$quantity', '$minimum_stock'] },
      quantity: { $gt: 0 }, // Apenas produtos que ainda têm estoque
    })
      .populate('product', 'name category images')
      .sort({ quantity: 1 }) // Ordena do menor para o maior estoque
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('Erro ao buscar produtos com estoque baixo:', error);
    return [];
  }
};

/**
 * NOVO MÉTODO: Estatísticas detalhadas de inventário por produto
 */
const getInventoryStatsByProduct = async () => {
  try {
    return await ProductVariant.aggregate([
      {
        $match: {
          quantity: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $unwind: {
          path: '$productInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: '$productInfo.name' },
          totalVariants: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalCost: {
            $sum: { $multiply: ['$buy_price', '$quantity'] },
          },
          totalSaleValue: {
            $sum: { $multiply: ['$sale_price', '$quantity'] },
          },
        },
      },
      {
        $project: {
          productName: 1,
          totalVariants: 1,
          totalQuantity: 1,
          totalCost: { $round: ['$totalCost', 2] },
          totalSaleValue: { $round: ['$totalSaleValue', 2] },
          estimatedProfit: {
            $round: [{ $subtract: ['$totalSaleValue', '$totalCost'] }, 2],
          },
        },
      },
      {
        $sort: { totalSaleValue: -1 }, // Ordena por valor de venda (maior primeiro)
      },
    ]);
  } catch (error) {
    console.error(
      'Erro ao buscar estatísticas de inventário por produto:',
      error
    );
    return [];
  }
};

export default {
  createVariant,
  findVariantsByProductIds,
  findVariantsByIds,
  updateStockBatch,
  updateVariant,
  removeVariant,
  updatePricesAndLogHistory,
  countLowStock,
  calculateInventoryValue, // MÉTODO CORRIGIDO
  findLowStock, // NOVO
  getInventoryStatsByProduct, // NOVO
};
