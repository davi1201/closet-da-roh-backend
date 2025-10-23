import * as productInteractionService from './product-interaction-service.js';

const getProductsForClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: 'ID do cliente é obrigatório.' });
    }

    const products = await productInteractionService.getProductsForSelection(
      clientId
    );

    res.status(200).json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos para seleção:', error);
    res
      .status(500)
      .json({ message: 'Erro interno do servidor.', details: error.message });
  }
};

const createInteraction = async (req, res) => {
  try {
    const { clientId, productId, interaction } = req.body;

    if (!clientId || !productId || !interaction) {
      return res.status(400).json({
        message: 'clientId, productId e interaction são obrigatórios.',
      });
    }

    if (interaction !== 'liked') {
      return res.status(400).json({ message: "Interação deve ser 'liked'." });
    }

    const data = { clientId, productId, interaction };
    const newInteraction = await productInteractionService.registerInteraction(
      data
    );

    res.status(201).json(newInteraction);
  } catch (error) {
    console.error('Erro ao registrar interação:', error);
    res
      .status(500)
      .json({ message: 'Erro interno do servidor.', details: error.message });
  }
};

const deleteInteraction = async (req, res) => {
  try {
    const { clientId, productId } = req.body;

    if (!clientId || !productId) {
      return res
        .status(400)
        .json({ message: 'clientId e productId são obrigatórios.' });
    }

    await productInteractionService.removeInteraction(clientId, productId);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover interação:', error);
    res
      .status(500)
      .json({ message: 'Erro interno do servidor.', details: error.message });
  }
};

const getLikedProductsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: 'ID do cliente é obrigatório.' });
    }

    const likedProducts = await productInteractionService.getLikesByClient(
      clientId
    );

    res.status(200).json(likedProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos curtidos:', error);
    res
      .status(500)
      .json({ message: 'Erro interno do servidor.', details: error.message });
  }
};

export {
  getProductsForClient,
  createInteraction,
  deleteInteraction,
  getLikedProductsByClient,
};
