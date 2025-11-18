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
    return await Sale.find({
      fulfillment_status: { $ne: 'canceled' },
    })
      .sort({ createdAt: -1 })
      .populate('client')
      .lean();
  }

  async getSalesSummary() {
    const summary = await Sale.aggregate([
      {
        $match: {
          fulfillment_status: { $ne: 'canceled' },
        },
      },
      {
        $addFields: {
          normalized_discount: {
            $cond: {
              if: { $ifNull: ['$discount_amount', false] },
              then: '$discount_amount',
              else: { $ifNull: ['$payment_details.discount_amount', 0] },
            },
          },
          normalized_payments: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$payments', []] } }, 0] },
              then: '$payments',
              else: [
                {
                  method: '$payment_details.method',
                  amount: '$payment_details.amount_paid',
                },
              ],
            },
          },
        },
      },
      {
        $facet: {
          globalTotals: [
            {
              $group: {
                _id: null,
                saleIds: { $addToSet: '$_id' },
                valorTotalVendas: { $sum: '$total_amount' },
                totalDescontoAplicado: { $sum: '$normalized_discount' },
              },
            },
            {
              $project: {
                _id: 0,
                totalVendas: { $size: '$saleIds' },
                valorTotalVendas: 1,
                totalDescontoAplicado: 1,
              },
            },
          ],
          paymentMethods: [
            { $unwind: '$normalized_payments' },
            {
              $group: {
                _id: '$normalized_payments.method',
                totalAmount: { $sum: '$normalized_payments.amount' },
              },
            },
            {
              $group: {
                _id: null,
                metodos: { $push: { k: '$_id', v: '$totalAmount' } },
              },
            },
            {
              $project: {
                _id: 0,
                metodosDePagamento: { $arrayToObject: '$metodos' },
              },
            },
          ],
          topClientes: [
            { $match: { client: { $ne: null } } },
            {
              $group: {
                _id: '$client',
                totalGasto: { $sum: '$total_amount' },
              },
            },
            { $sort: { totalGasto: -1 } },
            { $limit: 3 },
            {
              $lookup: {
                from: 'clients',
                localField: '_id',
                foreignField: '_id',
                as: 'clientInfo',
              },
            },
            {
              $unwind: {
                path: '$clientInfo',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 0,
                nome: { $ifNull: ['$clientInfo.name', 'Cliente Excluído'] },
                totalGasto: '$totalGasto',
              },
            },
          ],
          supplierSales: [
            { $unwind: '$items' },
            {
              $lookup: {
                from: 'productvariants',
                localField: 'items.variant',
                foreignField: '_id',
                as: 'variantInfo',
              },
            },
            {
              $unwind: {
                path: '$variantInfo',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'products',
                localField: 'variantInfo.product',
                foreignField: '_id',
                as: 'productInfo',
              },
            },
            {
              $unwind: {
                path: '$productInfo',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'suppliers',
                localField: 'productInfo.supplier_id',
                foreignField: '_id',
                as: 'supplierInfo',
              },
            },
            {
              $unwind: {
                path: '$supplierInfo',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $group: {
                _id: '$supplierInfo._id',
                name: { $first: '$supplierInfo.name' },
                totalSold: { $sum: '$items.subtotal' },
              },
            },
            { $match: { _id: { $ne: null } } },
            { $sort: { totalSold: -1 } },
          ],
        },
      },
      {
        $project: {
          globalData: { $arrayElemAt: ['$globalTotals', 0] },
          methodData: { $arrayElemAt: ['$paymentMethods', 0] },
          topClientesData: '$topClientes',
          supplierSalesData: '$supplierSales',
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              {
                totalVendas: 0,
                valorTotalVendas: 0,
                totalDescontoAplicado: 0,
                metodosDePagamento: {},
                topClientes: [],
                supplierSales: [], // <-- CORRIGIDO
              },
              '$globalData',
              '$methodData',
              { topClientes: '$topClientesData' },
              { supplierSales: '$supplierSalesData' }, // <-- CORRIGIDO
            ],
          },
        },
      },
    ]);

    return summary[0];
  }

  async cancelSale(saleId) {
    const result = await Sale.updateOne(
      { _id: saleId },
      { $set: { fulfillment_status: 'canceled' } }
    );
    return result.modifiedCount > 0;
  }
}

export default new SaleRepository();
