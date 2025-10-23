import express from 'express';
import {
  getProductsForClient,
  createInteraction,
  deleteInteraction,
} from './product-interaction-controller.js'; // Ajuste o caminho

const router = express.Router();

// Rota para o "Tinder" de Produtos (GET /api/public/products-for-liking/:clientId)
router.get('/products-for-liking/:clientId', getProductsForClient);

// Rota para registrar o like/dislike (POST /api/public/product-interactions)
router.post('/', createInteraction);
router.delete('/', deleteInteraction);

export default router;
