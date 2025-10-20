import AbandonedCart from './abandoned-cart-model.js';

class AbandonedCartRepository {
  async create(cartData) {
    const newCart = new AbandonedCart(cartData);
    return await newCart.save();
  }

  async findById(id) {
    return await AbandonedCart.findById(id).lean();
  }

  async findBySessionId(sessionId) {
    return await AbandonedCart.find({ sessionId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async findAll() {
    return await AbandonedCart.find({}).sort({ createdAt: -1 }).lean();
  }
}

export default new AbandonedCartRepository();
