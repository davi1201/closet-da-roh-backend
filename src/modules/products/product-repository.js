import mongoose from 'mongoose';
import Product from './product-model.js';

const create = async (productData) => {
  const newProduct = new Product(productData);
  return await newProduct.save();
};

const findAll = async (filters = {}, options = {}) => {
  const { limit, random } = options;
  // 1. Extraímos 'sku' dos filtros
  const { searchTerm, search, sku, ...queryFilters } = filters;
  const effectiveSearchTerm = searchTerm || search;

  const pipeline = [];
  const matchQuery = { is_available: true, ...queryFilters };

  // 2. Lógica para decidir se precisamos fazer JOIN com Variantes
  // Precisamos das variantes se houver um termo de busca (para checar se bate com SKU)
  // ou se o usuário filtrou especificamente por SKU.
  const needsVariantLookup = effectiveSearchTerm || sku;

  if (needsVariantLookup) {
    pipeline.push({
      $lookup: {
        from: 'productvariants', // Nome da coleção no MongoDB (mongoose default é lowercase + plural)
        localField: '_id',
        foreignField: 'product',
        as: 'variants',
      },
    });
  }

  // 3. Se houver um filtro explícito de SKU (ex: ?sku=XYZ)
  if (sku) {
    // 'variants.sku' funciona porque 'variants' é um array.
    // O MongoDB verifica se ALGUM item do array tem esse sku.
    matchQuery['variants.sku'] = sku;
    // Opcional: Se quiser busca parcial no filtro específico:
    // matchQuery['variants.sku'] = { $regex: sku, $options: 'i' };
  }

  // 4. Lógica de Busca Geral (Search Term)
  if (effectiveSearchTerm) {
    pipeline.push({
      $lookup: {
        from: 'suppliers',
        localField: 'supplier',
        foreignField: '_id',
        as: 'supplierDetails',
      },
    });
    pipeline.push({
      $unwind: { path: '$supplierDetails', preserveNullAndEmptyArrays: true },
    });

    matchQuery.$or = [
      { name: { $regex: effectiveSearchTerm, $options: 'i' } },
      { code: { $regex: effectiveSearchTerm, $options: 'i' } },
      {
        'supplierDetails.name': { $regex: effectiveSearchTerm, $options: 'i' },
      },
      // Adicionado: Busca também no SKU das variantes trazidas pelo lookup acima
      { 'variants.sku': { $regex: effectiveSearchTerm, $options: 'i' } },
    ];
  }

  pipeline.push({ $match: matchQuery });

  if (random && limit) {
    pipeline.push({ $sample: { size: limit } });
  }

  // Se não houve busca (que já faz o lookup de supplier), fazemos o lookup agora
  // para garantir que o supplier sempre venha preenchido no retorno.
  if (!effectiveSearchTerm) {
    pipeline.push({
      $lookup: {
        from: 'suppliers',
        localField: 'supplier',
        foreignField: '_id',
        as: 'supplierDetails',
      },
    });
    pipeline.push({
      $unwind: { path: '$supplierDetails', preserveNullAndEmptyArrays: true },
    });
  }

  if (!random && limit) {
    pipeline.push({ $limit: limit });
  }

  pipeline.push({
    $addFields: {
      supplier: '$supplierDetails',
    },
  });

  // Limpeza final: removemos campos auxiliares pesados para não trafegar dados inúteis
  pipeline.push({
    $project: {
      supplierDetails: 0,
      variants: 0, // Removemos o array de variantes para manter o retorno igual ao original (apenas dados do Produto)
    },
  });

  return await Product.aggregate(pipeline);
};

const findById = async (id) => {
  return await Product.findById(id).populate('supplier').lean();
};

const findByCategory = async (category) => {
  return await Product.find({ category, is_available: true })
    .populate('supplier')
    .lean();
};

const update = async (id, updateData) => {
  return await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('supplier')
    .lean();
};

const remove = async (id) => {
  return await Product.findByIdAndDelete(id);
};

const countActive = async () => {
  return await Product.countDocuments({ is_available: true });
};

export default {
  create,
  findAll,
  findById,
  findByCategory,
  update,
  remove,
  countActive,
};
