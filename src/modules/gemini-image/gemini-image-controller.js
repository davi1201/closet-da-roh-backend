import multer from 'multer';
import ImageGenerationService from './gemini-image-service.js';

// Configuração do multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagem não suportado. Use JPEG, PNG ou WebP.'));
    }
  },
});

export const uploadMiddleware = upload.single('clothing_image');

// Inicializa o serviço
const imageService = new ImageGenerationService(process.env.GEMINI_API_KEY);

/**
 * POST /api/images/generate-model-image
 * Gera imagens profissionais de modelo com a peça de roupa
 */
export async function generateModelImage(req, res) {
  try {
    // Valida se o arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem foi enviada. Use o campo "clothing_image".',
      });
    }

    // Extrai parâmetros do body
    const {
      clothing_type = 'peça de roupa',
      model_style = 'professional',
      background = 'minimalist photography studio with professional lighting',
      number_of_images = 1,
      aspect_ratio = '3:4',
      dominant_color = null,
    } = req.body;

    // Processa cor dominante (aceita múltiplos formatos)
    let processedColor = dominant_color;

    if (dominant_color) {
      if (
        typeof dominant_color === 'string' &&
        (dominant_color.includes(',') || dominant_color.includes('rgb'))
      ) {
        const rgbMatch = dominant_color.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        if (rgbMatch) {
          processedColor = {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3]),
          };
        }
      } else if (
        typeof dominant_color === 'string' &&
        dominant_color.startsWith('{')
      ) {
        try {
          processedColor = JSON.parse(dominant_color);
        } catch (e) {
          console.warn(
            '⚠️ Erro ao fazer parse do JSON da cor, usando valor original'
          );
        }
      }
    }

    console.log('📸 ========== GERAÇÃO DE IMAGEM INICIADA ==========');
    console.log('📋 Parâmetros recebidos:');
    console.log('   - Tipo de roupa:', clothing_type);
    console.log('   - Estilo:', model_style);
    console.log('   - Background:', background);
    console.log('   - Número de imagens:', number_of_images);
    console.log(
      '   - Cor dominante (original):',
      dominant_color || '(não fornecida)'
    );
    console.log(
      '   - Cor dominante (processada):',
      processedColor || '(não fornecida)'
    );
    console.log('   - Aspect ratio:', aspect_ratio);

    if (!processedColor) {
      console.warn(
        '⚠️  Cor dominante não fornecida. A análise será menos precisa.'
      );
      console.warn('💡 Dica: Envie "dominant_color" para melhores resultados');
    }

    console.log('\n🎨 Iniciando processo de geração...');
    const result = await imageService.generateModelImageFromBuffer(
      req.file.buffer,
      clothing_type,
      {
        modelStyle: model_style,
        background: background,
        numberOfImages: parseInt(number_of_images),
        aspectRatio: aspect_ratio,
        dominantColor: processedColor,
      }
    );

    if (!result.success) {
      console.error('❌ Erro ao gerar imagem:', result.error);
      console.error('📄 Detalhes:', result.details);

      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao gerar imagem',
        suggestion: result.suggestion,
        details: result.details,
      });
    }

    console.log(`\n✅ ${result.count} imagem(ns) gerada(s) com sucesso!`);
    console.log('📊 Análise da roupa:');
    console.log('   ', result.analysis?.substring(0, 150) + '...');
    console.log('📝 Prompt (primeiros 200 caracteres):');
    console.log('   ', result.prompt?.substring(0, 200) + '...');
    console.log('========== GERAÇÃO CONCLUÍDA ==========\n');

    return res.status(200).json({
      success: true,
      images: result.images,
      count: result.count,
      analysis: result.analysis,
      prompt: result.prompt,
      message: `${result.count} imagem(ns) gerada(s) com sucesso`,
      metadata: {
        clothing_type,
        model_style,
        background,
        aspect_ratio,
        dominant_color: dominant_color || 'not provided',
      },
    });
  } catch (error) {
    console.error('❌ ERRO CRÍTICO no controller:', error);
    console.error('Stack trace:', error.stack);

    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      details: error.toString(),
    });
  }
}

/**
 * POST /api/images/generate-color-variations
 * NOVO: Gera variações de cores da mesma peça de roupa
 *
 * Body params:
 * - clothing_type: tipo da roupa (ex: "t-shirt", "jeans")
 * - colors: array de cores (ex: ["light pink", "white", "black"])
 * - images_per_color: quantas imagens por cor (padrão: 1)
 * - model_style: estilo (professional, casual, elegant, urban)
 * - background: cenário da foto
 * - aspect_ratio: proporção (3:4, 1:1, etc)
 */
export async function generateColorVariations(req, res) {
  try {
    // Valida se o arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem foi enviada. Use o campo "clothing_image".',
      });
    }

    // Extrai parâmetros do body
    const {
      clothing_type = 'peça de roupa',
      colors = [],
      images_per_color = 1,
      model_style = 'professional',
      background = 'minimalist photography studio with professional lighting',
      aspect_ratio = '3:4',
    } = req.body;

    // Valida o array de cores
    let colorArray = colors;

    // Se colors veio como string JSON, faz parse
    if (typeof colors === 'string') {
      try {
        colorArray = JSON.parse(colors);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'O parâmetro "colors" deve ser um array JSON válido',
          example: '["light pink", "white", "black"]',
        });
      }
    }

    // Valida se é array e não está vazio
    if (!Array.isArray(colorArray) || colorArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'É necessário fornecer um array de cores',
        example: {
          colors: ['light pink', 'white', 'black'],
        },
        tip: 'Envie as cores como array JSON no body da requisição',
      });
    }

    // Valida se todas as cores são strings
    if (!colorArray.every((c) => typeof c === 'string')) {
      return res.status(400).json({
        success: false,
        error: 'Todas as cores devem ser strings',
        received: colorArray,
      });
    }

    console.log(
      '🎨 ========== GERAÇÃO DE VARIAÇÕES DE CORES INICIADA =========='
    );
    console.log('📋 Parâmetros recebidos:');
    console.log('   - Tipo de roupa:', clothing_type);
    console.log('   - Cores solicitadas:', colorArray.join(', '));
    console.log('   - Total de cores:', colorArray.length);
    console.log('   - Imagens por cor:', images_per_color);
    console.log('   - Estilo:', model_style);
    console.log('   - Background:', background);
    console.log('   - Aspect ratio:', aspect_ratio);

    console.log('\n🎨 Iniciando processo de geração de variações...');

    const result = await imageService.generateColorVariations(
      req.file.buffer,
      clothing_type,
      colorArray,
      {
        imagesPerColor: parseInt(images_per_color),
        modelStyle: model_style,
        background: background,
        aspectRatio: aspect_ratio,
      }
    );

    if (!result.success) {
      console.error('❌ Erro ao gerar variações:', result.error);
      console.error('📄 Detalhes:', result.details);

      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao gerar variações de cores',
        details: result.details,
      });
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`📊 Estatísticas:`);
    console.log(
      `   - Cores processadas: ${result.successfulColors}/${colorArray.length}`
    );
    console.log(`   - Total de imagens: ${result.totalImages}`);
    console.log(`   - Cores com falha: ${result.failedColors}`);
    console.log('📝 Análise estrutural:');
    console.log('   ', result.structuralAnalysis?.substring(0, 150) + '...');
    console.log('========== GERAÇÃO DE VARIAÇÕES CONCLUÍDA ==========\n');

    return res.status(200).json({
      success: true,
      results: result.results,
      summary: {
        totalColors: colorArray.length,
        successfulColors: result.successfulColors,
        failedColors: result.failedColors,
        totalImages: result.totalImages,
        imagesPerColor: parseInt(images_per_color),
      },
      structuralAnalysis: result.structuralAnalysis,
      metadata: {
        clothing_type,
        colors: colorArray,
        model_style,
        background,
        aspect_ratio,
      },
      message: `${result.successfulColors} de ${colorArray.length} cores geradas com sucesso (${result.totalImages} imagens no total)`,
    });
  } catch (error) {
    console.error('❌ ERRO CRÍTICO no controller:', error);
    console.error('Stack trace:', error.stack);

    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      details: error.toString(),
    });
  }
}

/**
 * GET /api/images/health
 * Verifica se o serviço está funcionando
 */
export async function healthCheck(req, res) {
  try {
    const hasApiKey = !!process.env.GEMINI_API_KEY;

    res.status(200).json({
      success: true,
      message: 'Serviço de geração de imagens operacional',
      apiKeyConfigured: hasApiKey,
      models: {
        imageGeneration: 'imagen-4.0-fast-generate-001',
        imageAnalysis: 'gemini-2.0-flash-lite',
      },
      features: [
        'Análise detalhada de roupas com Gemini Vision',
        'Geração de imagens com Imagen',
        'Suporte a cor dominante para fidelidade',
        'Múltiplas variações por requisição',
        'Geração de variações de cores da mesma peça',
        'Prompts otimizados para qualidade editorial',
      ],
      endpoints: [
        'POST /api/images/generate-model-image - Gera imagens com a cor original',
        'POST /api/images/generate-color-variations - Gera variações de cores',
        'GET /api/images/health - Status do serviço',
        'GET /api/images/test - Testa a API Imagen',
        'GET /api/images/colors - Lista de cores recomendadas',
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * GET /api/images/test
 * Testa se a API Imagen está funcionando
 */
export async function testImagenApi(req, res) {
  try {
    console.log('🧪 Testando API Imagen...');

    const result = await imageService.testApi();

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        status: 'operational',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(500).json({
      success: false,
      status: 'error',
      error: result.error,
      suggestion: result.suggestion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'error',
      error: error.message,
    });
  }
}

/**
 * GET /api/images/colors
 * Retorna lista de cores recomendadas
 */
export async function getRecommendedColors(req, res) {
  const colors = {
    blues: [
      'navy blue',
      'dark indigo blue',
      'light wash blue',
      'powder blue',
      'royal blue',
      'midnight blue',
      'sky blue',
      'teal',
    ],
    reds: [
      'burgundy red',
      'wine red',
      'crimson red',
      'rust red',
      'brick red',
      'cherry red',
      'maroon',
    ],
    grays: [
      'charcoal gray',
      'slate gray',
      'heather gray',
      'light gray',
      'dark gray',
      'stone gray',
      'silver gray',
    ],
    greens: [
      'olive green',
      'forest green',
      'emerald green',
      'sage green',
      'mint green',
      'hunter green',
    ],
    browns: [
      'camel tan',
      'khaki tan',
      'chocolate brown',
      'sand beige',
      'tan brown',
      'coffee brown',
      'taupe',
    ],
    pinks: [
      'light pink',
      'blush pink',
      'rose pink',
      'hot pink',
      'coral pink',
      'dusty pink',
      'salmon pink',
    ],
    purples: [
      'lavender purple',
      'deep purple',
      'violet',
      'plum',
      'mauve',
      'burgundy',
    ],
    neutrals: [
      'jet black',
      'off-white',
      'cream white',
      'ivory',
      'pearl white',
      'pure white',
      'bone white',
    ],
    others: [
      'mustard yellow',
      'golden yellow',
      'burnt orange',
      'olive drab',
      'turquoise',
    ],
  };

  res.json({
    success: true,
    colors: colors,
    tips: [
      'Use cores compostas: "dark indigo blue" é melhor que "blue"',
      'Seja específico sobre o tom: "burgundy red" em vez de "red"',
      'Use referências de materiais: "denim blue", "leather black"',
      'Adicione contexto: "vintage faded blue", "brand new navy blue"',
      'Para variações, use 3-5 cores complementares',
    ],
    examples: {
      jeans: ['dark indigo blue', 'light wash blue', 'jet black'],
      tshirt: ['white', 'heather gray', 'navy blue', 'light pink'],
      blazer: ['charcoal gray', 'navy blue', 'camel tan'],
      dress: ['burgundy red', 'navy blue', 'emerald green', 'jet black'],
      jacket: ['olive green', 'tan brown', 'navy blue'],
    },
    usage: {
      singleImage: 'Use o endpoint /generate-model-image com dominant_color',
      colorVariations:
        'Use o endpoint /generate-color-variations com array colors',
    },
  });
}
