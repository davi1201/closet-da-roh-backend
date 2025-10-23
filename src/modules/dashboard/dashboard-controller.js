import * as dashboardService from './dashboard-service.js';

/**
 * [GET] /api/admin/dashboard/stats
 *
 * Busca todas as estatísticas agregadas para o dashboard principal.
 */
const getDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res
      .status(500)
      .json({ message: 'Erro interno do servidor.', details: error.message });
  }
};

export { getDashboardStats };
