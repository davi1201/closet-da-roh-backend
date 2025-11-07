import express from 'express';
import {
  getProductsForClient,
  createInteraction,
  deleteInteraction,
  getLikedProductsByClient,
} from './product-interaction-controller.js';

const router = express.Router();

router.get('/products-for-liking/:clientId', getProductsForClient);
router.get('/liked-products/:clientId', getLikedProductsByClient);

router.post('/', createInteraction);
router.delete('/', deleteInteraction);

export default router;
