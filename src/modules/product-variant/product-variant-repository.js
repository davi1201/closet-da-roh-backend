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
  // Agora a lógica de preço se aplica à VARIAÇÃO, não ao Produto Pai.
  const variant = await ProductVariant.findById(variantId);

  if (!variant) {
    throw new Error('Variação de Produto não encontrada.');
  }

  const oldBuyPrice = variant.buy_price;
  const oldSalePrice = variant.sale_price;

  if (oldBuyPrice === newBuyPrice && oldSalePrice === newSalePrice) {
    return variant;
  }

  // 1. Cria o novo registro de histórico usando os VALORES ANTIGOS
  const newHistoryEntry = {
    buyPrice: oldBuyPrice,
    salePrice: oldSalePrice,
    changedAt: new Date(),
  };

  // 2. Usa o Mongoose para $push o histórico e $set os novos preços
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
      // Usa $inc para decrementar ou incrementar o campo 'quantity' (estoque)
      // Se a operação for 'decrement', o valor será negativo (-update.quantity)
      // Se a operação for 'increment', o valor será positivo (+update.quantity)
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
    // Executa as operações em lote
    const result = await ProductVariant.bulkWrite(operations);
    return result;
  } catch (error) {
    console.error('Erro durante a atualização de estoque em lote:', error);
    throw new Error(
      'Falha ao atualizar o estoque durante o processamento da venda.'
    );
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
};
