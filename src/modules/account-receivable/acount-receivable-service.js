import { addMonths } from 'date-fns';
import { accountsReceivableRepository } from './acount-receivable-repository.js';

class AccountsReceivableService {
  async generateReceivablesForSale(sale, due_date) {
    // Procura pelo pagamento em crediário (fiado) dentro do array 'payments'
    const creditPayment = sale.payments.find((p) => p.method === 'credit');

    // Se não houver pagamento 'credit' ou não houver cliente, não faz nada.
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

    // Usa o 'amount' do pagamento de crediário, não o 'total_amount' da venda
    const totalInCents = Math.round(amount * 100);
    const baseInstallmentInCents = Math.floor(totalInCents / installments);
    const remainderInCents =
      totalInCents - baseInstallmentInCents * installments;

    const receivablesToCreate = [];
    // Usa o due_date fornecido, ou a data da venda como fallback
    const saleDate = new Date(due_date || sale.createdAt || Date.now());

    for (let i = 1; i <= installments; i++) {
      const installmentAmountInCents =
        i === 1
          ? baseInstallmentInCents + remainderInCents
          : baseInstallmentInCents;

      const installmentAmount = installmentAmountInCents / 100;
      // A primeira parcela vence no 'saleDate', as seguintes 1 mês após
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

  async deleteBySaleId(saleId) {
    const deleted = await accountsReceivableRepository.deleteBySaleId(saleId);
    if (!deleted) {
      throw new Error('Parcelas não encontradas.');
    }
    return true;
  }
}

export default new AccountsReceivableService();
