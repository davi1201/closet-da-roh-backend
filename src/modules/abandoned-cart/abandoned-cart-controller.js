import AbandonedCartService from './abandoned-cart-service.js';

class AbandonedCartController {
  async register(req, res) {
    try {
      const cartData = req.body;
      const registeredCart =
        await AbandonedCartService.registerCartCancellation(cartData);
      return res.status(201).json(registeredCart);
    } catch (error) {
      console.error('Erro ao registrar carrinho abandonado:', error.message);
      if (error.message.includes('incompletos')) {
        return res.status(400).json({ message: error.message });
      }
      return res
        .status(500)
        .json({ message: 'Erro interno ao registrar o carrinho.' });
    }
  }

  async getAll(req, res) {
    try {
      const carts = await AbandonedCartService.getAbandonedCarts(req.query);
      return res.status(200).json(carts);
    } catch (error) {
      console.error('Erro ao buscar carrinhos abandonados:', error.message);
      return res
        .status(500)
        .json({ message: 'Erro interno ao buscar os carrinhos.' });
    }
  }
}

export const registerAbandonedCart =
  new AbandonedCartController().register.bind(new AbandonedCartController());
export const getAllAbandonedCarts = new AbandonedCartController().getAll.bind(
  new AbandonedCartController()
);
