import express from 'express';
import supplierController from './supplier-controller.js';

const router = express.Router();

router.post('/', supplierController.create);
router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.put('/:id', supplierController.update);
router.delete('/:id', supplierController.deactivate);

export default router;
