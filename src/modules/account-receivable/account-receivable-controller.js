import accountsReceivableService from './acount-receivable-service.js';

class AccountsReceivableController {
  async getAll(req, res, next) {
    try {
      const filters = req.query;
      const receivables = await accountsReceivableService.getAll(filters);
      res.status(200).json(receivables);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res
          .status(400)
          .json({ message: 'O campo "status" é obrigatório.' });
      }

      const updatedReceivable = await accountsReceivableService.updateStatus(
        id,
        status
      );
      res.status(200).json(updatedReceivable);
    } catch (error) {
      next(error);
    }
  }
}

export default new AccountsReceivableController();
