import express from 'express';
import InstallmentController from './installment-rule-controller.js';

const router = express.Router();

router.get(
  '/',
  InstallmentController.getPaymentConditions.bind(InstallmentController)
);

router.put(
  '/rules/:id',
  InstallmentController.updateRule.bind(InstallmentController)
);

export default router;
