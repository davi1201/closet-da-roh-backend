import ProductInteractionRepository from './product-interaction-repository.js';
import ProductRepository from '../products/product-repository.js';
import clientRepository from '../clients/client-repository.js'; // Import client repository
import notificationService from '../notifications/notification-service.js';

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

  const newInteraction = await ProductInteractionRepository.createOrUpdate(
    clientId,
    productId,
    'liked'
  );

  // --- Adiciona a chamada de notificação ---
  try {
    const client = await clientRepository.findById(clientId); // Busca nome do cliente
    const product = await ProductRepository.findById(productId); // Busca nome do produto
    if (client && product) {
      await notificationService.notifyProductLiked(client.name, product.name);
    } else {
      console.warn(
        `Cliente ${clientId} ou Produto ${productId} não encontrado para notificação.`
      );
    }
  } catch (notificationError) {
    console.error(
      '[InteractionService] Erro ao enviar notificação de like:',
      notificationError
    );
  }
  // --- Fim da chamada ---

  return newInteraction;
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
