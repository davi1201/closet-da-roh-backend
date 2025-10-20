import express from 'express';
import {
  getSaleSettings,
  updateSaleSettings,
} from './sale-setting-controller.js';

const router = express.Router();

router.get('/', getSaleSettings);
router.put('/', updateSaleSettings);

export default router;
