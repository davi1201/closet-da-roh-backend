import supplierService from '../supplier/supplier-service.js';
import productRepository from './product-repository.js';
import productVariantRepository from '../product-variant/product-variant-repository.js';

// --- AJUSTE 1: Importe suas constantes de SKU ---
// (Ajuste os caminhos se necessário)
import { PRODUCT_CATEGORIES } from '../../constants/product-categories.js';
import { PRODUCT_COLORS } from '../../constants/product-colors.js';

// --- AJUSTE 2: Helper para buscar o código das constantes ---
const getCode = (list, value, field = 'value') => {
  if (!value) return 'XXX'; // Retorna 'XXX' se o valor for nulo/vazio
  const item = list.find((it) => it[field] === value);
  if (item && item.code) return item.code;

  // Fallback: Pega os 3 primeiros caracteres se não achar um código
  return value
    .toUpperCase()
    .substring(0, 3)
    .replace(/[^A-Z0-9]/g, '');
};

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

const getAllProducts = async (filters = {}) => {
  const products = await productRepository.findAll(filters);

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

// --- AJUSTE 3: Modificação no createProduct ---
const createProduct = async (productData, imageFiles) => {
  const {
    supplier_id,
    variants: variantsJSON,
    category, // Pega a Categoria
    code, // Pega o Código
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

  // Monta a base do SKU (ex: "VES-12345")
  const categoryCode = getCode(PRODUCT_CATEGORIES, category);
  const productCode = code ? String(code).toUpperCase() : 'NOCODE';
  const skuBase = `${categoryCode}-${productCode}`;

  parentProductData.supplier = supplier_id;
  parentProductData.images = imageFiles;
  parentProductData.category = category; // Garante que a categoria seja salva
  parentProductData.code = code; // Garante que o código seja salvo

  const newProduct = await productRepository.create(parentProductData);

  const createdVariants = await Promise.all(
    variants.map(async (variant) => {
      const { buy_price, sale_price, color, size, ...variantDetails } = variant;

      // Monta o final do SKU (ex: "PTO-M")
      const colorCode = getCode(PRODUCT_COLORS, color);
      const sizeCode = size ? String(size).toUpperCase() : 'U'; // 'U' para Tamanho Único

      // SKU Final: "VES-12345-PTO-M"
      const generatedSku = `${skuBase}-${colorCode}-${sizeCode}`;

      const numericBuyPrice = unmaskCurrency(buy_price);
      const numericSalePrice = unmaskCurrency(sale_price);

      const initialPriceLog = {
        buyPrice: numericBuyPrice,
        salePrice: numericSalePrice,
        changedAt: new Date(),
      };

      const variantToCreate = {
        ...variantDetails,
        color, // Salva o valor (ex: 'preto')
        size, // Salva o valor (ex: 'P')
        sku: generatedSku, // Salva o SKU gerado
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

// --- AJUSTE 4: Modificação no updateProduct ---
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

  // Atualiza o produto PAI primeiro
  const updatedProduct = await productRepository.update(id, parentUpdateData);

  // Define a base do SKU usando os dados ATUALIZADOS do produto
  const category = updatedProduct.category;
  const code = updatedProduct.code;
  const categoryCode = getCode(PRODUCT_CATEGORIES, category);
  const productCode = code ? String(code).toUpperCase() : 'NOCODE';
  const skuBase = `${categoryCode}-${productCode}`;

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
        color, // Pega a cor
        size, // Pega o tamanho
        ...variantDetails
      } = variant;

      const numericBuyPrice = unmaskCurrency(buy_price);
      const numericSalePrice = unmaskCurrency(sale_price);

      if (variantId) {
        // Variante existente: apenas atualiza os dados
        // (SKUs não devem mudar após a criação)
        return await productVariantRepository.updateVariant(variantId, {
          ...variantDetails,
          color,
          size,
          buy_price: numericBuyPrice,
          sale_price: numericSalePrice,
        });
      } else {
        // Nova variante: Gera um SKU para ela
        const colorCode = getCode(PRODUCT_COLORS, color);
        const sizeCode = size ? String(size).toUpperCase() : 'U';
        const generatedSku = `${skuBase}-${colorCode}-${sizeCode}`;

        const initialPriceLog = {
          buyPrice: numericBuyPrice,
          salePrice: numericSalePrice,
          changedAt: new Date(),
        };

        return await productVariantRepository.createVariant({
          ...variantDetails,
          color,
          size,
          sku: generatedSku, // Salva o SKU gerado
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
