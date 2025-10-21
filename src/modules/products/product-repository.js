import Product from './product-model.js';

const create = async (productData) => {
  const newProduct = new Product(productData);
  return await newProduct.save();
};

const findAll = async () => {
  return await Product.find({ is_available: true }).populate('supplier').lean();
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

export default {
  create,
  findAll,
  findById,
  findByCategory,
  update,
  remove,
};
