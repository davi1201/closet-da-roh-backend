import { Router } from 'express';
import accountsReceivableController from './account-receivable-controller.js';

const router = Router();

router.get('/', accountsReceivableController.getAll);

router.patch('/:id', accountsReceivableController.updateStatus);

export default router;
