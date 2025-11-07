import express from 'express';
import {
  createSale,
  getSaleById,
  getAllSales,
  getDashboardSummary,
  cancelSale,
} from './sale-controller.js';

const router = express.Router();

router.post('/', /* authMiddleware, */ createSale);
router.get('/', /* authMiddleware, */ getAllSales);
router.get('/summary', /* authMiddleware, */ getDashboardSummary);
router.get('/:id', /* authMiddleware, */ getSaleById);
router.patch('/:id/cancel', /* authMiddleware, */ cancelSale);

export default router;
