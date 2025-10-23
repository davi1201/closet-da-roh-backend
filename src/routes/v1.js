import { Router } from 'express';

import { productsRoutes } from '../modules/products/product-router.js';
import supplierRoutes from '../modules/supplier/supplier-route.js';
import clientRoutes from '../modules/clients/client-router.js';
import saleSettingRoutes from '../modules/sale-settings/sale-setting-routes.js';
import installmentRoutes from '../modules/installment-rule/installment-rule-routes.js';
import abandonedCartRoutes from '../modules/abandoned-cart/abandoned-cart-routes.js';
import salesRoutes from '../modules/sales/sale-routes.js';
import { appointmentRoutes as appointmentPublicRoutes } from '../modules/appointment/appointment-public-routes.js';
import { appointmentRoutes as appointmentAdminRoutes } from '../modules/appointment/appointment-admin-routes.js';
import availabilityRoutes from '../modules/availability/availability-routes.js';
import productInteractionRoutes from '../modules/product-interation/product-interaction-routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard-routes.js';

const router = Router();

router.use('/products', productsRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/clients', clientRoutes);
router.use('/sale-settings', saleSettingRoutes);
router.use('/installments', installmentRoutes);
router.use('/abandoned-cart', abandonedCartRoutes);
router.use('/sales', salesRoutes);
router.use('/appointments/public', appointmentPublicRoutes);
router.use('/appointments/admin', appointmentAdminRoutes);
router.use('/availability', availabilityRoutes);
router.use('/product-interactions', productInteractionRoutes);
router.use('/admin/dashboard', dashboardRoutes);

export const v1Routes = router;
