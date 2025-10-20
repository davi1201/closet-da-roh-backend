import { Router } from 'express';

import { productsRoutes } from '../modules/products/product-router.js';
import supplierRoutes from '../modules/supplier/supplier-route.js';
import clientRoutes from '../modules/clients/client-router.js';
import saleSettingRoutes from '../modules/sale-settings/sale-setting-routes.js';
import installmentRoutes from '../modules/installment-rule/installment-rule-routes.js';
import abandonedCartRoutes from '../modules/abandoned-cart/abandoned-cart-routes.js';

const router = Router();

router.use('/products', productsRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/clients', clientRoutes);
router.use('/sale-settings', saleSettingRoutes);
router.use('/installments', installmentRoutes);
router.use('/abandoned-cart', abandonedCartRoutes);

export const v1Routes = router;
