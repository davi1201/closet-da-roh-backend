import express from 'express';
import { loginUser, registerUser, saveFcmToken } from './user-controller.js';
import { protect } from '../../middleware/auth-midlleware.js';
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/save-fcm-token', protect, saveFcmToken);

export default router;
