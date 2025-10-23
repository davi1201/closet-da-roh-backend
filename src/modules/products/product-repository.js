import mongoose from 'mongoose';
import Product from './product-model.js';

const create = async (productData) => {
  const newProduct = new Product(productData);
  return await newProduct.save();
};

const findAll = async (filters = {}, options = {}) => {
  const { limit, random } = options;
  const { searchTerm, search, ...queryFilters } = filters;
  const effectiveSearchTerm = searchTerm || search;

  const pipeline = [];
  const matchQuery = { is_available: true, ...queryFilters };

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
    ];
  }

  pipeline.push({ $match: matchQuery });

  if (random && limit) {
    pipeline.push({ $sample: { size: limit } });
  }

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
  pipeline.push({
    $project: {
      supplierDetails: 0,
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
