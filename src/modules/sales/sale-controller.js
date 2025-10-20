// controllers/sale-controller.js

import saleService from './sale-service.js';

/**
 * Cria uma nova venda.
 * Rota esperada: POST /api/sales
 * * Espera no req.body: {
 * items: [{ variant_id, quantity }],
 * payment_details: { method, installments },
 * customer_id (opcional)
 * }
 */
const createSale = async (req, res, next) => {
  try {
    const saleData = req.body;

    // 🚨 Adiciona o ID do usuário que está realizando a venda (Assumindo que req.user é injetado por um middleware de autenticação)
    saleData.sold_by = req.user ? req.user._id : null;

    // 1. Validação básica de entrada de dados (o Service faz a validação de estoque e preço)
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

    // 201 Created é o código ideal para uma nova criação de recurso.
    return res.status(201).json(newSale);
  } catch (error) {
    // Envia o erro para o middleware de tratamento de erros do Express
    console.error('Erro ao criar venda:', error.message);

    // Se for um erro conhecido de regra de negócio, pode retornar 400
    if (
      error.message.includes('insuficiente') ||
      error.message.includes('não permitid')
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
    // Se o erro for "Venda não encontrada.", o service deve lançar
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

/**
 * Lista todas as vendas.
 * Rota esperada: GET /api/sales?status=completed
 */
const getAllSales = async (req, res, next) => {
  try {
    // Permite filtrar por status (ex: /api/sales?status=pending)
    const { status } = req.query;
    const sales = await saleService.getAllSales(status);

    return res.status(200).json(sales);
  } catch (error) {
    next(error);
  }
};

export { createSale, getSaleById, getAllSales };
