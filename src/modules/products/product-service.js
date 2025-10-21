import supplierService from '../supplier/supplier-service.js';
import productRepository from './product-repository.js';
import productVariantRepository from '../product-variant/product-variant-repository.js';

const unmaskCurrency = (value) => {
  if (typeof value === 'number' || !value) {
    return value;
  }
  const onlyDigits = value.replace(/[^\d]/g, '');
  const numericValue = parseFloat(onlyDigits) / 100;
  return isNaN(numericValue) ? 0 : numericValue;
};

const parseJSONIfNeeded = (data) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      throw new Error('Dados JSON inválidos.');
    }
  }
  return data;
};

const getProductById = async (id) => {
  const product = await productRepository.findById(id);

  if (!product || product.is_available === false) {
    throw new Error('Produto não encontrado ou inativo.');
  }

  const variants = await productVariantRepository.findVariantsByProductIds([
    id,
  ]);

  return {
    ...product,
    variants: variants,
  };
};

const getAllProducts = async () => {
  const products = await productRepository.findAll();

  const productIds = products.map((p) => p._id);

  const allVariants = await productVariantRepository.findVariantsByProductIds(
    productIds
  );

  const productsWithVariants = products.map((product) => {
    const variants = allVariants.filter(
      (variant) => variant.product.toString() === product._id.toString()
    );
    return {
      ...product,
      variants: variants,
    };
  });

  return productsWithVariants;
};

const createProduct = async (productData, imageFiles) => {
  const {
    supplier_id,
    variants: variantsJSON,
    ...parentProductData
  } = productData;

  let variants = parseJSONIfNeeded(variantsJSON);
  if (!variants) {
    throw new Error('Dados de variação inválidos.');
  }

  try {
    await supplierService.getSupplierById(supplier_id);
  } catch (error) {
    throw new Error('Fornecedor não encontrado.');
  }

  parentProductData.supplier = supplier_id;
  parentProductData.images = imageFiles;

  const newProduct = await productRepository.create(parentProductData);

  const createdVariants = await Promise.all(
    variants.map(async (variant) => {
      const { buy_price, sale_price, ...variantDetails } = variant;

      const numericBuyPrice = unmaskCurrency(buy_price);
      const numericSalePrice = unmaskCurrency(sale_price);

      const initialPriceLog = {
        buyPrice: numericBuyPrice,
        salePrice: numericSalePrice,
        changedAt: new Date(),
      };

      const variantToCreate = {
        ...variantDetails,
        product: newProduct._id,
        buy_price: numericBuyPrice,
        sale_price: numericSalePrice,
        price_history: [initialPriceLog],
      };

      return await productVariantRepository.createVariant(variantToCreate);
    })
  );

  return {
    ...newProduct.toObject(),
    variants: createdVariants,
  };
};

const updatePrices = async (variantId, newBuyPrice, newSalePrice) => {
  if (newSalePrice < newBuyPrice) {
    throw new Error(
      'O preço de venda não pode ser menor que o preço de compra (custo).'
    );
  }

  if (newBuyPrice <= 0 || newSalePrice <= 0) {
    throw new Error('Ambos os preços devem ser maiores que zero.');
  }

  const updatedVariant =
    await productVariantRepository.updatePricesAndLogHistory(
      variantId,
      newBuyPrice,
      newSalePrice
    );

  return updatedVariant;
};

const updateProduct = async (id, updateData, imageFiles) => {
  const {
    variants: variantsJSON,
    existing_images: existingImagesJSON,
    ...parentUpdateData
  } = updateData;

  const product = await productRepository.findById(id);

  if (!product || product.is_available === false) {
    throw new Error('Produto não encontrado ou inativo.');
  }

  let finalImagesList = [];
  if (existingImagesJSON) {
    finalImagesList = parseJSONIfNeeded(existingImagesJSON);
  } else {
    finalImagesList = product.images || [];
  }

  if (imageFiles && imageFiles.length > 0) {
    finalImagesList = finalImagesList.concat(imageFiles);
  }

  parentUpdateData.images = finalImagesList;

  if (parentUpdateData.supplier_id) {
    parentUpdateData.supplier = parentUpdateData.supplier_id;
    delete parentUpdateData.supplier_id;
  }

  const updatedProduct = await productRepository.update(id, parentUpdateData);

  let variants = [];
  if (variantsJSON) {
    variants = parseJSONIfNeeded(variantsJSON);
    if (variants === null) {
      throw new Error('Dados de variação inválidos.');
    }
  }

  const updatedVariants = await Promise.all(
    variants.map(async (variant) => {
      const {
        _id: variantId,
        buy_price,
        sale_price,
        ...variantDetails
      } = variant;

      const numericBuyPrice = unmaskCurrency(buy_price);
      const numericSalePrice = unmaskCurrency(sale_price);

      if (variantId) {
        return await productVariantRepository.updateVariant(variantId, {
          ...variantDetails,
          buy_price: numericBuyPrice,
          sale_price: numericSalePrice,
        });
      } else {
        const initialPriceLog = {
          buyPrice: numericBuyPrice,
          salePrice: numericSalePrice,
          changedAt: new Date(),
        };
        return await productVariantRepository.createVariant({
          ...variantDetails,
          product: id,
          buy_price: numericBuyPrice,
          sale_price: numericSalePrice,
          price_history: [initialPriceLog],
        });
      }
    })
  );

  const currentVariants =
    await productVariantRepository.findVariantsByProductIds([id]);

  const updatedVariantIds = updatedVariants.map((v) => v._id.toString());

  const variantsToDelete = currentVariants.filter(
    (v) => !updatedVariantIds.includes(v._id.toString())
  );

  if (variantsToDelete.length > 0) {
    await Promise.all(
      variantsToDelete.map((variant) =>
        productVariantRepository.removeVariant(variant._id)
      )
    );
  }

  return {
    ...updatedProduct,
    variants: updatedVariants,
  };
};

export {
  createProduct,
  updatePrices,
  getAllProducts,
  getProductById,
  updateProduct,
};
