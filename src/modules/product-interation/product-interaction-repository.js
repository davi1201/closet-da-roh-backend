import ProductInteraction from './product-interation-model.js'; // Verifique se este caminho para o 'model' está correto

class ProductInteractionRepository {
  async createOrUpdate(clientId, productId, interaction) {
    const filter = {
      client: clientId,
      product: productId,
    };

    const update = {
      $set: {
        interaction: interaction,
      },
    };

    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    };

    try {
      const result = await ProductInteraction.findOneAndUpdate(
        filter,
        update,
        options
      );
      return result;
    } catch (error) {
      if (error.code === 11000) {
        return await ProductInteraction.findOne(filter);
      }
      throw error;
    }
  }

  async findLikesByClient(clientId) {
    return await ProductInteraction.find({
      client: clientId,
      interaction: 'liked',
    })
      .populate('product')
      .lean();
  }

  async findLikedProductIdsByClient(clientId) {
    try {
      const interactions = await ProductInteraction.find({
        client: clientId,
        interaction: 'liked',
      })
        .select('product')
        .lean();

      return interactions.map((interaction) => interaction.product.toString());
    } catch (error) {
      console.error('Erro ao buscar IDs de produtos curtidos:', error);
      return [];
    }
  }

  async removeInteraction(clientId, productId) {
    const filter = {
      client: clientId,
      product: productId,
    };

    return await ProductInteraction.findOneAndDelete(filter);
  }

  async findRecentLikes(limit = 5) {
    return await ProductInteraction.find({ interaction: 'liked' })
      .sort({ createdAt: -1 }) // Pega os mais recentes
      .limit(limit)
      .populate('client', 'name') // Popula nome do cliente
      .populate('product', 'name') // Popula nome do produto
      .lean();
  }

  async findMostLikedProducts(limit = 5) {
    return await ProductInteraction.aggregate([
      // 1. Filtrar apenas "likes"
      { $match: { interaction: 'liked' } },

      // 2. Agrupar por ID do produto e contar
      {
        $group: {
          _id: '$product',
          likeCount: { $sum: 1 },
        },
      },

      // 3. Ordenar pela contagem
      { $sort: { likeCount: -1 } },

      // 4. Limitar ao top (ex: 5)
      { $limit: limit },

      // 5. Popular (fazer o $lookup) dos dados do produto
      {
        $lookup: {
          from: 'products', // Nome da coleção de produtos
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails',
        },
      },

      // 6. Formatar a saída
      {
        $project: {
          _id: 0,
          likeCount: 1,
          product: { $arrayElemAt: ['$productDetails', 0] },
        },
      },
    ]);
  }
}

export default new ProductInteractionRepository();
