import { addMonths } from 'date-fns';
import { accountsReceivableRepository } from './acount-receivable-repository.js';

class AccountsReceivableService {
  async generateReceivablesForSale(sale, due_date) {
    const creditPayment = sale.payments.find((p) => p.method === 'credit');

    if (!creditPayment || !sale.client) {
      return;
    }

    const { installments, amount } = creditPayment;
    const { client: customerId, _id: saleId } = sale;

    if (!installments || installments <= 0) {
      console.warn(
        `Venda ${saleId} (crediário) sem número de parcelas, contas a receber não gerado.`
      );
      return;
    }

    const totalInCents = Math.round(amount * 100);
    const baseInstallmentInCents = Math.floor(totalInCents / installments);
    const remainderInCents =
      totalInCents - baseInstallmentInCents * installments;

    const receivablesToCreate = [];

    const saleDate = new Date(due_date || sale.createdAt || Date.now());

    for (let i = 1; i <= installments; i++) {
      const installmentAmountInCents =
        i === 1
          ? baseInstallmentInCents + remainderInCents
          : baseInstallmentInCents;

      const installmentAmount = installmentAmountInCents / 100;

      const dueDate = addMonths(saleDate, i - 1);

      receivablesToCreate.push({
        customerId: customerId,
        saleId: saleId,
        amount: installmentAmount,
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

  // Este map é usado apenas pelo `updateStatus`,
  // pois o `updateById` ainda usa .populate()
  _mapReceivableToFrontend(doc) {
    if (!doc) return null;
    return {
      ...doc,
      client: doc.customerId,
      customerId: doc.customerId._id,
    };
  }

  /**
   * Busca os dados centralizados do repositório.
   * @param {object} filters
   * @returns {Promise<{accountsToReceive: Array<object>, totalByMonth: number}>}
   */
  async getAll(filters) {
    const { receivables, total } =
      await accountsReceivableRepository.getDataByMonth(filters);

    return {
      accountsToReceive: receivables,
      totalByMonth: total,
    };
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
    // O map ainda é necessário aqui, pois `updateById` retorna
    // o documento populado de forma diferente do aggregate.
    return this._mapReceivableToFrontend(updated);
  }

  async deleteBySaleId(saleId) {
    const deleted = await accountsReceivableRepository.deleteBySaleId(saleId);
    if (!deleted) {
      throw new Error('Parcelas não encontradas.');
    }
    return true;
  }
}

export default new AccountsReceivableService();
