import asyncHandler from 'express-async-handler';
import * as productService from './product-service.js';

const handleGetAllProducts = asyncHandler(async (req, res) => {
  const products = await productService.getAllProducts();
  res.json(products);
});

const handleAddNewProduct = asyncHandler(async (req, res) => {
  const payload = req.body;
  const imageFiles = req.files || [];

  if (!payload.supplier_id) {
    return res
      .status(400)
      .json({ message: 'O ID do fornecedor é obrigatório.' });
  }

  const imagesToSave = imageFiles.map((file) => ({
    url: file.location,
    key: file.key,
  }));

  const newProduct = productService.createProduct(payload, imagesToSave);
  res.status(201).json(newProduct);
});

const handleGetProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productService.getProductById(id);
  res.json(product);
});

export { handleAddNewProduct, handleGetAllProducts, handleGetProductById };
