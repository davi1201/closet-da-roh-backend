import express from 'express';
import ClientController from './client-controller.js';

const router = express.Router();

router.post('/', ClientController.createClient);
router.get('/', ClientController.listClients);
router.get('/:id', ClientController.getClientById);
router.put('/:id', ClientController.updateClient);

router.post('/:id/desired-product', ClientController.addDesiredProduct);
router.delete('/:id/deactivate', ClientController.deactivateClient);

export default router;
