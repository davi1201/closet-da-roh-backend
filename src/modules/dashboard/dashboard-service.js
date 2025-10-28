// Importa TODOS os repositórios que vamos precisar
import clientRepository from '../clients/client-repository.js';
import appointmentRepository from '../appointment/appointment-repository.js';
import productRepository from '../products/product-repository.js';
import productVariantRepository from '../product-variant/product-variant-repository.js';
import productInteractionRepository from '../product-interation/product-interaction-repository.js';

/**
 * Busca e agrega dados de múltiplos repositórios para o dashboard.
 */
async function getDashboardStats() {
  // Define o início do dia atual e o início do mês
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth(),
    1
  );

  // 1. Executa todas as consultas ao banco de dados em paralelo
  const [kpis, recentAppointments, recentLikes, mostLikedProducts] =
    await Promise.all([
      fetchKpis(todayStart, monthStart),
      appointmentRepository.findRecent(5),
      productInteractionRepository.findRecentLikes(5),
      productInteractionRepository.findMostLikedProducts(5),
    ]);

  // 2. Formata o "Feed de Atividades"
  const activityFeed = formatActivityFeed(recentAppointments, recentLikes);

  // 3. Monta o objeto de resposta final
  return {
    kpis,
    activityFeed,
    mostLikedProducts,
  };
}

/**
 * Função helper para buscar os KPIs principais em paralelo.
 */
async function fetchKpis(todayStart, monthStart) {
  try {
    const [
      inventoryValues,
      upcomingAppointments,
      newClientsThisMonth,
      totalActiveClients,
      totalActiveProducts,
      lowStockVariants,
    ] = await Promise.all([
      productVariantRepository.calculateInventoryValue(), // Usa o método corrigido do repository
      appointmentRepository.countUpcoming(todayStart),
      clientRepository.countNewThisMonth(monthStart),
      clientRepository.countActive(),
      productRepository.countActive(),
      productVariantRepository.countLowStock(),
    ]);

    return {
      // Métricas de agendamentos e clientes
      upcomingAppointments: upcomingAppointments || 0,
      newClientsThisMonth: newClientsThisMonth || 0,
      totalActiveClients: totalActiveClients || 0,
      totalActiveProducts: totalActiveProducts || 0,
      lowStockVariants: lowStockVariants || 0,

      // Métricas financeiras de inventário
      totalInventoryCost: inventoryValues.totalCost || 0,
      totalEstimatedSales: inventoryValues.totalSaleValue || 0,

      // Métricas extras (se disponíveis)
      totalStockQuantity: inventoryValues.totalStockQuantity || 0,
      estimatedProfit: inventoryValues.estimatedProfit || 0,
      profitMargin: inventoryValues.profitMargin || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar KPIs do dashboard:', error);

    // Retorna valores zerados em caso de erro para não quebrar o frontend
    return {
      upcomingAppointments: 0,
      newClientsThisMonth: 0,
      totalActiveClients: 0,
      totalActiveProducts: 0,
      lowStockVariants: 0,
      totalInventoryCost: 0,
      totalEstimatedSales: 0,
      totalStockQuantity: 0,
      estimatedProfit: 0,
      profitMargin: 0,
    };
  }
}

/**
 * Função helper para mesclar e ordenar o feed de atividades.
 */
function formatActivityFeed(appointments, likes) {
  const feed = [];

  // Processa agendamentos com validação
  if (Array.isArray(appointments)) {
    appointments.forEach((app) => {
      // Valida se tem os dados mínimos necessários
      if (app && app.startTime) {
        feed.push({
          type: 'APPOINTMENT',
          date: app.startTime,
          clientName: app.client?.name || 'Cliente Desconhecido',
          clientId: app.client?._id,
          appointmentId: app._id,
        });
      }
    });
  }

  // Processa likes com validação
  if (Array.isArray(likes)) {
    likes.forEach((like) => {
      // Valida se tem os dados mínimos necessários
      if (like && like.createdAt) {
        feed.push({
          type: 'LIKE',
          date: like.createdAt,
          clientName: like.client?.name || 'Cliente Desconhecido',
          productName: like.product?.name || 'Produto Desconhecido',
          clientId: like.client?._id,
          productId: like.product?._id,
          likeId: like._id,
        });
      }
    });
  }

  // Ordena o feed pela data mais recente
  return feed.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
}

/**
 * NOVA FUNÇÃO: Busca produtos com estoque baixo para alertas
 */
async function getLowStockAlerts(limit = 10) {
  try {
    const lowStockProducts = await productVariantRepository.findLowStock(limit);

    return lowStockProducts.map((variant) => ({
      variantId: variant._id,
      productName: variant.product?.name || 'Produto Desconhecido',
      size: variant.size,
      color: variant.color,
      currentStock: variant.quantity,
      minimumStock: variant.minimum_stock,
      needsRestock: variant.quantity <= variant.minimum_stock,
    }));
  } catch (error) {
    console.error('Erro ao buscar alertas de estoque baixo:', error);
    return [];
  }
}

/**
 * NOVA FUNÇÃO: Busca estatísticas detalhadas de inventário
 */
async function getInventoryStats() {
  try {
    const [inventoryByProduct, overallStats] = await Promise.all([
      productVariantRepository.getInventoryStatsByProduct(),
      productVariantRepository.calculateInventoryValue(),
    ]);

    return {
      overall: overallStats,
      byProduct: inventoryByProduct,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de inventário:', error);
    return {
      overall: {
        totalCost: 0,
        totalSaleValue: 0,
        totalVariants: 0,
        totalStockQuantity: 0,
        estimatedProfit: 0,
        profitMargin: 0,
      },
      byProduct: [],
    };
  }
}

export { getDashboardStats, getLowStockAlerts, getInventoryStats };
