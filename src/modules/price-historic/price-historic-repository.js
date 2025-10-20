import PriceHistory from './price-historic-model.js';

const createLog = async (productId, oldPrice, newPrice) => {
  const priceLog = new PriceHistory({
    productId,
    oldPrice,
    newPrice,
  });
  return await priceLog.save();
};

const findByProductId = async (productId) => {
  return await PriceHistory.find({ productId }).sort({ changedAt: -1 });
};

export { createLog, findByProductId };
