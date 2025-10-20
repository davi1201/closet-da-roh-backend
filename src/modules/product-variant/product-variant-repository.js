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

const findVariantById = async (id) => {
  return await ProductVariant.findById(id)
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

export default {
  createVariant,
  findVariantsByProductIds,
  findVariantById,
  updateVariant,
  removeVariant,
  updatePricesAndLogHistory,
};
