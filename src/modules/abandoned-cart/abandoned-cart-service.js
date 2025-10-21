import AbandonedCartRepository from './abandoned-cart-repository.js';

class AbandonedCartService {
  async registerCartCancellation(data) {
    console.log('data', data);

    if (
      !data.sessionId ||
      !data.cancellationReason ||
      !data.products ||
      !data.cancellationCode ||
      data.totalAmount === undefined
    ) {
      throw new Error(
        'Dados incompletos para registro do carrinho abandonado.'
      );
    }

    const totalItems = data.products.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const cartData = {
      userId: data.userId || null,
      sessionId: data.sessionId,
      cancellationReason: data.cancellationReason,
      cancellationCode: data.cancellationCode,
      totalAmount: data.totalAmount,
      totalItems: totalItems,
      products: data.products,
    };

    return await AbandonedCartRepository.create(cartData);
  }

  async getAbandonedCarts(filters) {
    return await AbandonedCartRepository.findAll();
  }

  async getCartById(id) {
    return await AbandonedCartRepository.findById(id);
  }
}

export default new AbandonedCartService();
