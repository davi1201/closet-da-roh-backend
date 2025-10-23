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
      fetchKpis(todayStart, monthStart), // Busca os números principais (KPIs)
      appointmentRepository.findRecent(5), // Busca os últimos 5 agendamentos
      productInteractionRepository.findRecentLikes(5), // Busca os últimos 5 "likes"
      productInteractionRepository.findMostLikedProducts(5), // Busca os 5 produtos mais curtidos
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
  const [
    inventoryValues,
    upcomingAppointments,
    newClientsThisMonth,
    totalActiveClients,
    totalActiveProducts,
    lowStockVariants,
  ] = await Promise.all([
    productVariantRepository.calculateInventoryValue(),
    appointmentRepository.countUpcoming(todayStart),
    clientRepository.countNewThisMonth(monthStart),
    clientRepository.countActive(),
    productRepository.countActive(),
    productVariantRepository.countLowStock(),
  ]);

  return {
    upcomingAppointments,
    newClientsThisMonth,
    totalActiveClients,
    totalActiveProducts,
    lowStockVariants,
    totalInventoryCost: inventoryValues.totalCost,
    totalEstimatedSales: inventoryValues.totalSaleValue,
  };
}

/**
 * Função helper para mesclar e ordenar o feed de atividades.
 */
function formatActivityFeed(appointments, likes) {
  const feed = [];

  appointments.forEach((app) => {
    feed.push({
      type: 'APPOINTMENT',
      date: app.startTime,
      clientName: app.client?.name || 'Cliente Desconhecido',
      clientId: app.client?._id,
    });
  });

  likes.forEach((like) => {
    feed.push({
      type: 'LIKE',
      date: like.createdAt,
      clientName: like.client?.name || 'Cliente Desconhecido',
      productName: like.product?.name || 'Produto Desconhecido',
      clientId: like.client?._id,
      productId: like.product?._id,
    });
  });

  // Ordena o feed pela data mais recente
  return feed.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export { getDashboardStats };
