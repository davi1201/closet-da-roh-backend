import supplierService from '../supplier/supplier-service.js';
import productRepository from './product-repository.js';
import productVariantRepository from '../product-variant/product-variant-repository.js';

const getProductById = async (id) => {
  const product = await productRepository.findById(id);

  if (!product || product.is_available === false) {
    throw new Error('Produto não encontrado ou inativo.');
  }

  const variants = await productVariantRepository.findVariantsByProductId(id);

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
  const { supplier_id, ...parentProductData } = productData;

  let variants = productData.variants;

  try {
    variants = JSON.parse(productData.variants);
  } catch (e) {
    console.error('Erro ao parsear variantes:', e);
    throw new Error('Dados de variação inválidos (Não é um JSON válido).');
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

      const initialPriceLog = {
        buyPrice: buy_price,
        salePrice: sale_price,
        changedAt: new Date(),
      };

      const variantToCreate = {
        ...variantDetails,
        product: newProduct._id,
        buy_price,
        sale_price,
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

export { createProduct, updatePrices, getAllProducts, getProductById };
