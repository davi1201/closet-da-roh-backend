import DesiredProductService from './desired-product-service.js';

class DesiredProductController {
  async create(req, res, next) {
    try {
      const productData = req.body;
      // Seria bom adicionar validação do req.body (ex: com Joi ou Zod) aqui

      const newProduct = await DesiredProductService.create(productData);

      res.status(201).json(newProduct);
    } catch (error) {
      next(error); // Passa o erro para o middleware de erro do Express
    }
  }

  async findAll(req, res, next) {
    try {
      const products = await DesiredProductService.findAll();
      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await DesiredProductService.findById(id);

      if (!product) {
        return res
          .status(404)
          .json({ message: 'Produto desejado não encontrado.' });
      }

      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  async findByClientId(req, res, next) {
    try {
      const { clientId } = req.params; // Pegando da URL: /desired-products/client/12345
      const products = await DesiredProductService.findByClientId(clientId);

      // Retorna 200 e um array vazio se não houver produtos, o que é o esperado
      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deletedProduct = await DesiredProductService.delete(id);

      if (!deletedProduct) {
        return res
          .status(404)
          .json({ message: 'Produto desejado não encontrado para exclusão.' });
      }

      res.status(200).json({
        message: 'Produto deletado com sucesso.',
        data: deletedProduct,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DesiredProductController();
