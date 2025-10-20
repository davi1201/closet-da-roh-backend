import { Router } from 'express';
import {
  registerAbandonedCart,
  getAllAbandonedCarts,
} from './abandoned-cart-controller.js';

const router = Router();

router.post('/', registerAbandonedCart);
router.get('/', getAllAbandonedCarts);

export default router;
