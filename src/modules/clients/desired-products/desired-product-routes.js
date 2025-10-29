import express from 'express';
import DesiredProductController from './desired-product-controller.js';
import {
  createOptimizeImagesMiddleware,
  s3UploadMiddleware,
} from '../../../middleware/s3-upload-middleware.js';

const router = express.Router();

router.get('/', DesiredProductController.findAll);

router.post(
  '/',
  s3UploadMiddleware.array('images', 5),
  createOptimizeImagesMiddleware('desired-products'),
  DesiredProductController.create
);

router.get('/client/:clientId', DesiredProductController.findByClientId);

router.get('/:id', DesiredProductController.findById);

router.delete('/:id', DesiredProductController.delete);

export default router;
