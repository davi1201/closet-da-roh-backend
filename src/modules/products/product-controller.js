import asyncHandler from 'express-async-handler';
import * as productService from './product-service.js';

const handleGetAllProducts = asyncHandler(async (req, res) => {
  const filters = req.query;
  const products = await productService.getAllProducts(filters);
  res.json(products);
});

const handleAddNewProduct = asyncHandler(async (req, res) => {
  const payload = req.body;
  const imageFiles = req.body.images || [];

  if (!payload.supplier_id) {
    return res
      .status(400)
      .json({ message: 'O ID do fornecedor é obrigatório.' });
  }

  const imagesToSave = imageFiles.map((file) => ({
    url: file.url,
    key: file.key,
  }));

  const newProduct = await productService.createProduct(payload, imagesToSave);
  res.status(201).json(newProduct);
});

const handleGetProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productService.getProductById(id);
  res.json(product);
});

const handleUpdateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const imageFiles = req.body?.images || [];

  const imagesToSave = imageFiles.map((file) => ({
    url: file.location || file.url,
    key: file.key,
  }));

  const updatedProduct = await productService.updateProduct(
    id,
    payload,
    imagesToSave
  );
  res.json(updatedProduct);
});

export {
  handleAddNewProduct,
  handleGetAllProducts,
  handleGetProductById,
  handleUpdateProduct,
};
