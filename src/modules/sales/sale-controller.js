// controllers/sale-controller.js

import saleService from './sale-service.js';

/**
 * Cria uma nova venda.
 * Rota esperada: POST /api/sales
 * * Espera no req.body: {
 * items: [{ variant_id, quantity }],
 * payment_details: { method, installments, discount_percentage (opcional) },
 * customer_id (opcional)
 * }
 */
const createSale = async (req, res, next) => {
  try {
    const saleData = req.body;

    // Adiciona o ID do usuário que está realizando a venda (Assumindo que req.user é injetado por um middleware de autenticação)
    saleData.sold_by = req.user ? req.user._id : null;

    if (!saleData.items || saleData.items.length === 0) {
      return res
        .status(400)
        .json({ message: 'A transação deve conter itens.' });
    }
    if (!saleData.payment_details || !saleData.payment_details.method) {
      return res
        .status(400)
        .json({ message: 'O método de pagamento é obrigatório.' });
    }

    const newSale = await saleService.createSale(saleData);

    return res.status(201).json(newSale);
  } catch (error) {
    console.error('Erro ao criar venda:', error.message);

    // Erros de regra de negócio (ex: 'Variante não encontrada', 'Parcelamento não permitido')
    if (
      error.message.includes('não encontrada') ||
      error.message.includes('não permitido') ||
      error.message.includes('não é válida')
    ) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
};

/**
 * Busca uma venda pelo ID.
 * Rota esperada: GET /api/sales/:id
 */
const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sale = await saleService.getSaleById(id);

    return res.status(200).json(sale);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await saleService.getDashboardSummary();
    return res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

/**
 * Lista todas as vendas.
 * Rota esperada: GET /api/sales?fulfillment_status=fulfilled
 */
const getAllSales = async (req, res, next) => {
  try {
    // Alterado para filtrar por 'fulfillment_status'
    const { fulfillment_status } = req.query;
    const sales = await saleService.getAllSales(fulfillment_status);

    return res.status(200).json(sales);
  } catch (error) {
    next(error);
  }
};

export { createSale, getSaleById, getAllSales, getDashboardSummary };
