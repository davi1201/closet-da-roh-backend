import { Router } from 'express';

import {
  handleAddNewProduct,
  handleGetAllProducts,
  handleGetProductById,
} from './product-controller.js';

import { s3UploadMiddleware } from '../../middleware/s3-upload-middleware.js';

const router = Router();

router.get('/', handleGetAllProducts);
router.post('/', s3UploadMiddleware.array('images', 5), handleAddNewProduct);
router.get('/:id', handleGetProductById);

export const productsRoutes = router;
