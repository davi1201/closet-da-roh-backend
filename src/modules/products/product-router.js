import { Router } from 'express';

import {
  handleAddNewProduct,
  handleGetAllProducts,
  handleGetProductById,
  handleUpdateProduct,
} from './product-controller.js';

import {
  optimizeImagesMiddleware,
  s3UploadMiddleware,
} from '../../middleware/s3-upload-middleware.js';

const router = Router();

router.get('/', handleGetAllProducts);

router.post(
  '/',
  s3UploadMiddleware.array('images', 5),
  optimizeImagesMiddleware,
  handleAddNewProduct
);

router.put(
  '/:id',
  s3UploadMiddleware.array('images', 5),
  optimizeImagesMiddleware,
  handleUpdateProduct
);

router.get('/:id', handleGetProductById);

export const productsRoutes = router;
