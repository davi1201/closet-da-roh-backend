import { addMonths } from 'date-fns';
import { accountsReceivableRepository } from './acount-receivable-repository.js';

class AccountsReceivableService {
  async generateReceivablesForSale(sale) {
    if (
      sale.payment_details.method !== 'credit' ||
      !sale.payment_details.installments
    ) {
      return;
    }

    const { total_amount, client: customer_id, _id: saleId } = sale;
    const { installments } = sale.payment_details;

    if (installments <= 0 || !customer_id) {
      console.warn(
        `Venda ${saleId} sem cliente ou parcelas, contas a receber não gerado.`
      );
      return;
    }

    const totalInCents = Math.round(total_amount * 100);
    const baseInstallmentInCents = Math.floor(totalInCents / installments);
    const remainderInCents =
      totalInCents - baseInstallmentInCents * installments;

    const receivablesToCreate = [];
    const saleDate = new Date(sale.createdAt || Date.now());

    for (let i = 1; i <= installments; i++) {
      const installmentAmountInCents =
        i === 1
          ? baseInstallmentInCents + remainderInCents
          : baseInstallmentInCents;

      const amount = installmentAmountInCents / 100;
      const dueDate = addMonths(saleDate, i);

      receivablesToCreate.push({
        customerId: customer_id,
        saleId: saleId,
        amount: amount,
        dueDate: dueDate,
        status: 'PENDING',
        installmentNumber: i,
        totalInstallments: installments,
      });
    }

    if (receivablesToCreate.length > 0) {
      await accountsReceivableRepository.createMany(receivablesToCreate);
      console.log(
        `[Service] Geradas ${installments} parcelas para a Venda ${saleId}.`
      );
    }
  }

  _mapReceivableToFrontend(doc) {
    if (!doc) return null;
    return {
      ...doc,
      client: doc.customerId,
      customerId: doc.customerId._id,
    };
  }

  async getAll(filters) {
    const query = {};
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.customerId) {
      query.customerId = filters.customerId;
    }

    const results = await accountsReceivableRepository.find(query);
    return results.map(this._mapReceivableToFrontend);
  }

  async updateStatus(id, status) {
    if (!status || !['PAID', 'PENDING', 'OVERDUE'].includes(status)) {
      throw new Error('Status inválido.');
    }
    const updated = await accountsReceivableRepository.updateById(id, {
      status,
    });
    if (!updated) {
      throw new Error('Parcela não encontrada.');
    }
    return this._mapReceivableToFrontend(updated);
  }
}

export default new AccountsReceivableService();
