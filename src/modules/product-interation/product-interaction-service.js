import ProductInteractionRepository from './product-interaction-repository.js';
import ProductRepository from '../products/product-repository.js';

async function getProductsForSelection(clientId) {
  const allProducts = await ProductRepository.findAll({}, {});

  const likedProductIds =
    await ProductInteractionRepository.findLikedProductIdsByClient(clientId);

  const productsWithSelection = allProducts.map((product) => {
    const isSelected = likedProductIds.includes(product._id.toString());
    return {
      ...product,
      isSelected: isSelected,
    };
  });

  return productsWithSelection;
}

async function registerInteraction(data) {
  const { clientId, productId, interaction } = data;

  if (interaction !== 'liked') {
    throw new Error('Interação inválida. Apenas "liked" é permitido.');
  }

  return await ProductInteractionRepository.createOrUpdate(
    clientId,
    productId,
    'liked'
  );
}

async function removeInteraction(clientId, productId) {
  return await ProductInteractionRepository.removeInteraction(
    clientId,
    productId
  );
}

async function getLikesByClient(clientId) {
  return await ProductInteractionRepository.findLikesByClient(clientId);
}

export {
  getProductsForSelection,
  registerInteraction,
  removeInteraction,
  getLikesByClient,
};
