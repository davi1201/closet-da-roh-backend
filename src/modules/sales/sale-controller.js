import saleService from './sale-service.js';

const createSale = async (req, res, next) => {
  try {
    const saleData = req.body;

    saleData.sold_by = req.user ? req.user._id : null;

    if (!saleData.items || saleData.items.length === 0) {
      return res
        .status(400)
        .json({ message: 'A transação deve conter itens.' });
    }
    if (
      !saleData.payments ||
      !Array.isArray(saleData.payments) ||
      saleData.payments.length === 0
    ) {
      return res.status(400).json({
        message: 'A forma de pagamento (payments) é obrigatória.',
      });
    }

    const newSale = await saleService.createSale(saleData);

    return res.status(201).json(newSale);
  } catch (error) {
    console.error('Erro ao criar venda:', error.message);

    if (
      error.message.includes('não encontrada') ||
      error.message.includes('não permitido') ||
      error.message.includes('não é válida') ||
      error.message.includes('mal formatado') ||
      error.message.includes('O valor da entrada')
    ) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
};

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
    const { fulfillment_status } = req.query;
    const sales = await saleService.getAllSales(fulfillment_status);

    return res.status(200).json(sales);
  } catch (error) {
    next(error);
  }
};

const cancelSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await saleService.cancelSale(id);

    if (result) {
      return res.status(200).json({ message: 'Venda cancelada com sucesso.' });
    } else {
      return res.status(404).json({ message: 'Venda não encontrada.' });
    }
  } catch (error) {
    next(error);
  }
};

export {
  createSale,
  getSaleById,
  getAllSales,
  getDashboardSummary,
  cancelSale,
};
