import Sale from './sale-model.js';

class SaleRepository {
  async create(saleData) {
    const newSale = new Sale(saleData);
    const savedSale = await newSale.save();

    return await savedSale.populate('client');
  }

  async findById(id) {
    return await Sale.findById(id)
      .populate('client')
      .populate('sold_by')
      .lean();
  }

  async findAll(fulfillment_status = 'ready_to_ship') {
    const query = fulfillment_status
      ? { fulfillment_status: fulfillment_status }
      : {};
    return await Sale.find(query)
      .sort({ createdAt: -1 })
      .populate('client')
      .lean();
  }

  async getSalesSummary() {
    const salesSummary = await Sale.aggregate([
      {
        $match: {
          fulfillment_status: { $ne: 'canceled' },
        },
      },
      // ESTÁGIO 1: Agrupa o total geral e por método de pagamento (existente)
      {
        $group: {
          _id: null,
          totalVendas: { $sum: 1 },

          valorTotalVendas: {
            $sum: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$payment_details.method', 'card'] },
                    { $eq: ['$payment_details.method', 'credit'] },
                  ],
                },
                then: { $ifNull: ['$subtotal_amount', 0] },
                else: { $ifNull: ['$total_amount', 0] },
              },
            },
          },

          totalDescontoAplicado: { $sum: '$payment_details.discount_amount' },

          vendasPorMetodo: {
            $push: {
              metodo: '$payment_details.method',
              valor: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: ['$payment_details.method', 'card'] },
                      { $eq: ['$payment_details.method', 'credit'] },
                    ],
                  },
                  then: { $ifNull: ['$subtotal_amount', 0] },
                  else: { $ifNull: ['$total_amount', 0] },
                },
              },
            },
          },
          // Novo array para cálculo de top clientes
          vendasPorCliente: {
            $push: {
              clientId: '$client',
              amount: {
                $cond: {
                  // Usando o valor líquido para a classificação do cliente
                  if: {
                    $or: [
                      { $eq: ['$payment_details.method', 'card'] },
                      { $eq: ['$payment_details.method', 'credit'] },
                    ],
                  },
                  then: { $ifNull: ['$subtotal_amount', 0] },
                  else: { $ifNull: ['$total_amount', 0] },
                },
              },
            },
          },
        },
      },
      // ESTÁGIO 2: Desagrupa para calcular a soma de gastos por cliente
      { $unwind: '$vendasPorCliente' },
      { $match: { 'vendasPorCliente.clientId': { $ne: null } } }, // Remove vendas sem cliente
      {
        $group: {
          _id: '$vendasPorCliente.clientId',
          totalGasto: { $sum: '$vendasPorCliente.amount' },
          // Preserva o resumo geral (totalVendas, valorTotalVendas, etc.)
          totalVendas: { $first: '$totalVendas' },
          valorTotalVendas: { $first: '$valorTotalVendas' },
          totalDescontoAplicado: { $first: '$totalDescontoAplicado' },
          vendasPorMetodo: { $first: '$vendasPorMetodo' },
        },
      },
      // ESTÁGIO 3: Ordena e limita aos top 3
      { $sort: { totalGasto: -1 } },
      { $limit: 3 },
      // ESTÁGIO 4: Popula o nome do cliente (Coleção 'clients' é a suposição)
      {
        $lookup: {
          from: 'clients', // MUITO IMPORTANTE: Mude para o nome real da sua coleção de clientes
          localField: '_id',
          foreignField: '_id',
          as: 'clientInfo',
        },
      },
      { $unwind: '$clientInfo' },
      // ESTÁGIO 5: Reagrupa tudo em um único documento de resumo
      {
        $group: {
          _id: '$totalVendas', // Usa um campo do resumo geral para reagrupar
          totalVendas: { $first: '$totalVendas' },
          valorTotalVendas: { $first: '$valorTotalVendas' },
          totalDescontoAplicado: { $first: '$totalDescontoAplicado' },
          vendasPorMetodo: { $first: '$vendasPorMetodo' },
          topClientes: {
            // Cria o array de top clientes
            $push: {
              nome: '$clientInfo.name', // Supondo que o campo do nome seja 'name'
              totalGasto: '$totalGasto',
            },
          },
        },
      },
      // ESTÁGIO 6: Desagrupa os métodos de pagamento (Existente)
      { $unwind: '$vendasPorMetodo' },
      {
        $group: {
          _id: '$_id',
          totalVendas: { $first: '$totalVendas' },
          valorTotalVendas: { $first: '$valorTotalVendas' },
          totalDescontoAplicado: { $first: '$totalDescontoAplicado' },
          topClientes: { $first: '$topClientes' }, // Preserva o novo campo

          metodosDePagamento: {
            $push: {
              k: '$vendasPorMetodo.metodo',
              v: '$vendasPorMetodo.valor',
            },
          },
        },
      },
      // ESTÁGIO 7: Projeta e remodela o array vendasPorMetodo (Existente)
      {
        $project: {
          _id: 0,
          totalVendas: 1,
          valorTotalVendas: 1,
          totalDescontoAplicado: 1,
          metodosDePagamento: {
            $arrayToObject: [
              {
                $map: {
                  input: '$metodosDePagamento',
                  as: 'item',
                  in: ['$$item.k', '$$item.v'],
                },
              },
            ],
          },
          topClientes: 1, // Inclui o novo campo
        },
      },
    ]);

    return salesSummary;
  }
}

export default new SaleRepository();
