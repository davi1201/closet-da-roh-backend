import express from 'express';
import { getDashboardStats } from './dashboard-controller.js'; // Ajuste o caminho

// Importe seus middlewares de autenticação e admin
// (Ajuste os caminhos e nomes conforme o seu projeto)
// import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * [GET] /api/admin/dashboard/stats
 * Rota principal que busca todos os dados agregados para o dashboard.
 * É protegida e requer privilégios de administrador.
 */
router.get(
  '/stats',
  // protect, // 1. Garante que o usuário está logado
  // adminOnly, // 2. Garante que o usuário é um admin
  getDashboardStats
);

export default router;
