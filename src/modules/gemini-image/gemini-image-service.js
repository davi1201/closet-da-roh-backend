import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

class ImageGenerationService {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ apiKey });
    this.imageModel = 'imagen-4.0-fast-generate-001';
  }

  /**
   * Gera uma imagem profissional de modelo usando a peça de roupa fornecida
   */
  async generateModelImage(params) {
    try {
      const prompt = this.buildPrompt(params);

      console.log('🎨 Gerando imagem com Imagen...');
      console.log('📝 Prompt:', prompt);

      const response = await this.ai.models.generateImages({
        model: this.imageModel,
        prompt: prompt,
        config: {
          numberOfImages: params.numberOfImages || 1,
          aspectRatio: params.aspectRatio || '3:4',
        },
      });

      const images = [];

      if (response.generatedImages && response.generatedImages.length > 0) {
        for (let i = 0; i < response.generatedImages.length; i++) {
          const generatedImage = response.generatedImages[i];
          const imageBytes = generatedImage.image.imageBytes;
          const buffer = Buffer.from(imageBytes, 'base64');

          if (params.outputPath) {
            const dir = path.dirname(params.outputPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            const ext = path.extname(params.outputPath);
            const basename = path.basename(params.outputPath, ext);
            const finalPath = `${dir}/${basename}-${i + 1}${ext}`;

            fs.writeFileSync(finalPath, buffer);

            images.push({
              imageBase64: imageBytes,
              imagePath: finalPath,
            });
          } else {
            images.push({
              imageBase64: imageBytes,
            });
          }
        }

        console.log(`✅ ${images.length} imagem(ns) gerada(s) com sucesso!`);

        return {
          success: true,
          images: images,
          imageBase64: images[0].imageBase64,
          imagePath: images[0].imagePath,
          count: images.length,
        };
      }

      return {
        success: false,
        error: 'Nenhuma imagem foi gerada pela API',
      };
    } catch (error) {
      console.error('❌ Erro ao gerar imagem:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        details: error.toString(),
      };
    }
  }

  /**
   * Constrói o prompt para geração da imagem
   */
  buildPrompt(params) {
    const style = params.modelStyle || 'profissional';
    const background =
      params.background ||
      'estúdio fotográfico minimalista com iluminação profissional';

    return `Professional fashion photography of a model wearing ${params.clothingType}.

Style: ${style}
Setting: ${background}
Lighting: Professional studio lighting with soft shadows
Pose: Natural and elegant pose that showcases the clothing
Quality: High resolution, realistic, catalog-quality photograph
Composition: Fashion editorial style, professional photography

The image should look like a high-end fashion catalog photo with perfect lighting and composition.`;
  }

  getMimeType(ext) {
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    return mimeTypes[ext] || 'image/png';
  }

  /**
   * NOVO: Gera variações de cores da mesma peça de roupa
   * @param {Buffer} clothingImageBuffer - Buffer da imagem da roupa
   * @param {string} clothingType - Tipo da roupa (ex: "t-shirt", "jeans")
   * @param {string[]} colors - Array de cores desejadas (ex: ["light pink", "white", "black"])
   * @param {object} options - Opções adicionais
   */
  async generateColorVariations(
    clothingImageBuffer,
    clothingType,
    colors = [],
    options = {}
  ) {
    try {
      if (!Array.isArray(colors) || colors.length === 0) {
        return {
          success: false,
          error: 'É necessário fornecer um array de cores',
        };
      }

      console.log(
        `🎨 Gerando ${colors.length} variações de cores: ${colors.join(', ')}`
      );

      // Primeiro, analisa a peça para extrair detalhes estruturais
      const structuralDescription = await this.analyzeClothingStructure(
        clothingImageBuffer,
        clothingType
      );

      console.log('📝 Estrutura da peça identificada:', structuralDescription);

      const allResults = [];

      // Gera uma imagem para cada cor
      for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        console.log(
          `\n🎨 Gerando variação ${i + 1}/${colors.length}: ${color}`
        );

        const prompt = this.buildColorVariationPrompt(
          clothingType,
          structuralDescription,
          color,
          options
        );

        console.log('🎯 Prompt:', prompt.substring(0, 200) + '...');

        try {
          const response = await this.ai.models.generateImages({
            model: this.imageModel,
            prompt: prompt,
            config: {
              numberOfImages: options.imagesPerColor || 1,
              aspectRatio: options.aspectRatio || '3:4',
              ...(options.safetySettings && {
                safetySettings: options.safetySettings,
              }),
            },
          });

          if (response.generatedImages && response.generatedImages.length > 0) {
            const colorImages = [];

            for (const generatedImage of response.generatedImages) {
              const imageBytes = generatedImage.image.imageBytes;
              colorImages.push({
                imageBase64: imageBytes,
                mimeType: 'image/png',
                color: color,
              });
            }

            allResults.push({
              color: color,
              success: true,
              images: colorImages,
              count: colorImages.length,
            });

            console.log(
              `✅ ${colorImages.length} imagem(ns) gerada(s) para cor "${color}"`
            );
          } else {
            allResults.push({
              color: color,
              success: false,
              error: 'Nenhuma imagem gerada',
            });
          }
        } catch (colorError) {
          console.error(`❌ Erro ao gerar cor "${color}":`, colorError.message);
          allResults.push({
            color: color,
            success: false,
            error: colorError.message,
          });
        }

        // Pequeno delay entre requests para evitar rate limiting
        if (i < colors.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Calcula estatísticas
      const successCount = allResults.filter((r) => r.success).length;
      const totalImages = allResults.reduce(
        (sum, r) => sum + (r.images?.length || 0),
        0
      );

      console.log(
        `\n✅ Concluído! ${successCount}/${colors.length} cores geradas com sucesso`
      );
      console.log(`📊 Total de ${totalImages} imagens geradas`);

      return {
        success: successCount > 0,
        results: allResults,
        totalImages: totalImages,
        successfulColors: successCount,
        failedColors: colors.length - successCount,
        structuralAnalysis: structuralDescription,
      };
    } catch (error) {
      console.error('❌ Erro geral:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        details: error.toString(),
      };
    }
  }

  /**
   * Analisa a estrutura da roupa (sem focar na cor)
   * Extrai apenas características estruturais para manter nas variações
   */
  async analyzeClothingStructure(clothingImageBuffer, clothingType) {
    try {
      const clothingImageBase64 = clothingImageBuffer.toString('base64');

      const analysisPrompt = `You are a professional fashion designer analyzing clothing structure. Analyze this ${clothingType} and describe ONLY its structural characteristics, IGNORING the current color.

Focus ONLY on:

1. **Material & Texture**: Fabric type (denim, cotton, leather, silk, wool, knit, etc.) and texture (smooth, rough, ribbed, woven, etc.)

2. **Style & Cut**: Specific style (skinny, straight-leg, bootcut, oversized, fitted, cropped, etc.), silhouette, and fit

3. **Structural Details**:
   - Stitching patterns (but not stitch color)
   - Buttons, zippers, hardware placement
   - Pocket style and placement
   - Hemlines, cuffs, collars, necklines
   - Seam placement and construction
   - Any distressing, tears, or wear patterns
   - Design lines and paneling

4. **Garment Structure**: How it's constructed (tailored, relaxed, structured, unstructured, etc.)

DO NOT mention:
- The current color of the garment
- Color of stitching, buttons, or details
- Any color-related descriptions

Format as: "A [material] ${clothingType} with [style/cut], featuring [structural details]..."

Be specific about construction and design, but completely ignore all colors.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              { text: analysisPrompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: clothingImageBase64,
                },
              },
            ],
          },
        ],
      });

      const description = response.candidates[0].content.parts[0].text.trim();

      return description;
    } catch (error) {
      console.warn('⚠️ Erro ao analisar estrutura, usando descrição básica');
      return `A ${clothingType} with standard design and construction`;
    }
  }

  /**
   * Constrói prompt para variação de cor específica
   */
  buildColorVariationPrompt(
    clothingType,
    structuralDescription,
    targetColor,
    options
  ) {
    const style = options.modelStyle || 'professional';
    const background =
      options.background ||
      'minimalist photography studio with professional lighting';

    const styleDescriptions = {
      professional:
        'corporate professional, business casual, clean and polished',
      casual: 'relaxed lifestyle, everyday wear, approachable and natural',
      elegant:
        'sophisticated high-fashion, refined and luxurious, editorial elegance',
      urban: 'street style, modern city fashion, contemporary and edgy',
    };

    const styleDesc = styleDescriptions[style] || style;

    return `Professional fashion catalog photography of a model wearing a ${targetColor} ${clothingType}.

CRITICAL COLOR REQUIREMENT:
The garment MUST be exactly ${targetColor}. This is the PRIMARY and MOST IMPORTANT requirement. Every visible part of the main garment must be ${targetColor}.

GARMENT SPECIFICATIONS:
- Base Color: ${targetColor} (MANDATORY - this is non-negotiable)
- Type: ${clothingType}
- Construction: ${structuralDescription}
- All fabric, material, and visible surfaces must be ${targetColor}

PHOTOGRAPHY SPECIFICATIONS:
- Style: ${styleDesc} fashion editorial
- Setting: ${background}
- Model: Professional fashion model with perfect posture, appropriate diversity
- Pose: Natural, confident pose showcasing the ${targetColor} garment
- Expression: Sophisticated and aspirational

LIGHTING & TECHNICAL:
- Lighting: Professional three-point lighting that accurately shows the ${targetColor} color
- Color accuracy: TRUE ${targetColor} representation - no color shift or distortion
- Exposure: Perfect exposure maintaining rich ${targetColor} tones
- Focus: Sharp focus on the garment with subtle background blur (f/2.8-f/4)
- Camera angle: Eye-level or slightly above, full-body or 3/4 shot

IMAGE QUALITY:
- Resolution: Ultra high resolution (8K quality)
- Detail: Crisp fabric texture, visible construction details
- Color fidelity: EXACT ${targetColor} color match throughout the entire garment
- Retouching: Professional subtle retouching maintaining realistic texture
- Aesthetic: Premium fashion magazine editorial quality

COMPOSITION:
- Framing: Professional fashion composition with proper negative space
- Background: Neutral, complementary to ${targetColor} without competing
- Styling: Minimal accessories, complete focus on the ${targetColor} ${clothingType}
- Mood: Confident, stylish, high-end catalog aesthetic

FINAL CHECK: Verify the entire garment is ${targetColor} before generation. This is a product catalog image where color accuracy is critical for customer decision-making.`;
  }

  /**
   * Versão original mantida para compatibilidade
   */
  async generateModelImageFromBuffer(
    clothingImageBuffer,
    clothingType,
    options = {}
  ) {
    try {
      console.log('🔍 Analisando imagem da roupa...');

      const clothingDescription = await this.analyzeClothingForPrompt(
        clothingImageBuffer,
        clothingType,
        options
      );

      console.log('📝 Descrição extraída:', clothingDescription);

      const prompt = this.buildDetailedPrompt(
        clothingType,
        clothingDescription,
        options
      );

      console.log('🎨 Gerando imagem com Imagen...');
      console.log('🎯 Prompt final:', prompt.substring(0, 200) + '...');

      const response = await this.ai.models.generateImages({
        model: this.imageModel,
        prompt: prompt,
        config: {
          numberOfImages: options.numberOfImages || 4,
          aspectRatio: options.aspectRatio || '3:4',
          ...(options.safetySettings && {
            safetySettings: options.safetySettings,
          }),
        },
      });

      const images = [];

      if (response.generatedImages && response.generatedImages.length > 0) {
        for (const generatedImage of response.generatedImages) {
          const imageBytes = generatedImage.image.imageBytes;

          images.push({
            imageBase64: imageBytes,
            mimeType: 'image/png',
          });
        }

        console.log(`✅ ${images.length} imagem(ns) gerada(s) com sucesso!`);

        return {
          success: true,
          images: images,
          imageBase64: images[0].imageBase64,
          count: images.length,
          prompt: prompt,
          analysis: clothingDescription,
        };
      }

      return {
        success: false,
        error: 'Nenhuma imagem foi gerada',
      };
    } catch (error) {
      console.error('❌ Erro:', error);

      if (error.message && error.message.includes('404')) {
        return {
          success: false,
          error:
            'Modelo Imagen não encontrado. Verifique se você tem acesso ao Imagen.',
          suggestion:
            'Acesse https://console.cloud.google.com/ e habilite a API Imagen',
          details: error.message,
        };
      }

      if (error.message && error.message.includes('quota')) {
        return {
          success: false,
          error: 'Cota excedida',
          details: error.message,
        };
      }

      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        details: error.toString(),
      };
    }
  }

  rgbToColorName(r, g, b) {
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);

    const luminosity = 0.299 * r + 0.587 * g + 0.114 * b;

    const isGray =
      Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30;

    if (isGray) {
      if (luminosity < 30) return 'jet black';
      if (luminosity < 70) return 'charcoal gray';
      if (luminosity < 110) return 'dark gray';
      if (luminosity < 150) return 'slate gray';
      if (luminosity < 190) return 'light gray';
      if (luminosity < 230) return 'silver gray';
      return 'off-white';
    }

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta < 20) {
      return luminosity < 128 ? 'dark gray' : 'light gray';
    }

    let hue;
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;

    const saturation = max === 0 ? 0 : (delta / max) * 100;

    const isDark = luminosity < 100;
    const isLight = luminosity > 180;
    const isBright = saturation > 60 && luminosity > 130;

    let colorName = '';

    if (hue >= 345 || hue < 15) {
      if (isDark) colorName = 'dark red';
      else if (isBright) colorName = 'bright red';
      else if (saturation > 50) colorName = 'crimson red';
      else colorName = 'red';
    } else if (hue >= 15 && hue < 25) {
      if (isDark) colorName = 'brick red';
      else if (isBright) colorName = 'scarlet red';
      else colorName = 'rust red';
    } else if (hue >= 25 && hue < 40) {
      if (isDark) colorName = 'burnt orange';
      else if (isBright) colorName = 'bright orange';
      else if (luminosity < 120) colorName = 'rust orange';
      else colorName = 'coral';
    } else if (hue >= 40 && hue < 55) {
      if (isDark) colorName = 'dark gold';
      else if (saturation > 60) colorName = 'golden yellow';
      else colorName = 'mustard yellow';
    } else if (hue >= 55 && hue < 70) {
      if (isDark) colorName = 'olive yellow';
      else if (isBright) colorName = 'bright yellow';
      else if (isLight) colorName = 'pale yellow';
      else colorName = 'yellow';
    } else if (hue >= 70 && hue < 80) {
      if (isDark) colorName = 'olive green';
      else if (isLight) colorName = 'lime green';
      else colorName = 'chartreuse';
    } else if (hue >= 80 && hue < 165) {
      if (hue < 100) {
        if (isDark) colorName = 'dark olive green';
        else if (isLight) colorName = 'lime green';
        else colorName = 'olive green';
      } else if (hue < 140) {
        if (isDark) colorName = 'forest green';
        else if (isBright) colorName = 'bright green';
        else if (isLight) colorName = 'mint green';
        else if (saturation < 40) colorName = 'sage green';
        else colorName = 'green';
      } else {
        if (isDark) colorName = 'teal';
        else if (isBright) colorName = 'turquoise';
        else if (isLight) colorName = 'aqua';
        else colorName = 'teal green';
      }
    } else if (hue >= 165 && hue < 200) {
      if (isDark) colorName = 'dark teal';
      else if (isBright) colorName = 'cyan';
      else if (isLight) colorName = 'light turquoise';
      else colorName = 'teal';
    } else if (hue >= 200 && hue < 250) {
      if (hue < 220) {
        if (isDark) colorName = 'navy blue';
        else if (isBright) colorName = 'sky blue';
        else if (isLight) colorName = 'powder blue';
        else colorName = 'blue';
      } else {
        if (isDark && saturation > 50) colorName = 'navy blue';
        else if (isDark) colorName = 'midnight blue';
        else if (isBright) colorName = 'royal blue';
        else if (isLight) colorName = 'light blue';
        else if (saturation > 60) colorName = 'cobalt blue';
        else colorName = 'blue';
      }
    } else if (hue >= 250 && hue < 270) {
      if (isDark) colorName = 'indigo';
      else if (isBright) colorName = 'bright purple';
      else if (isLight) colorName = 'periwinkle';
      else colorName = 'purple blue';
    } else if (hue >= 270 && hue < 290) {
      if (isDark) colorName = 'deep purple';
      else if (isBright) colorName = 'violet';
      else if (isLight) colorName = 'lavender';
      else colorName = 'purple';
    } else if (hue >= 290 && hue < 320) {
      if (isDark) colorName = 'plum';
      else if (isBright) colorName = 'magenta';
      else if (isLight) colorName = 'pink';
      else colorName = 'magenta';
    } else if (hue >= 320 && hue < 345) {
      if (isDark) colorName = 'burgundy';
      else if (isBright) colorName = 'hot pink';
      else if (isLight) colorName = 'blush pink';
      else if (saturation > 50) colorName = 'rose pink';
      else colorName = 'pink';
    }

    if (colorName.includes('blue') && r < 50 && g < 50 && b > 100) {
      if (b > 150) colorName = 'dark indigo blue';
      else colorName = 'navy blue';
    }

    if (hue >= 200 && hue <= 240 && r < 100 && b > 80 && saturation > 20) {
      if (luminosity < 80) colorName = 'dark indigo blue';
      else if (luminosity < 130) colorName = 'indigo blue';
      else colorName = 'light wash blue';
    }

    if (hue >= 20 && hue <= 50 && saturation < 60) {
      if (luminosity < 80) colorName = 'chocolate brown';
      else if (luminosity < 130) colorName = 'tan brown';
      else colorName = 'camel tan';
    }

    console.log(
      `🎨 RGB(${r}, ${g}, ${b}) → "${colorName}" (hue: ${hue}, sat: ${Math.round(
        saturation
      )}%, lum: ${Math.round(luminosity)})`
    );

    return colorName;
  }

  async analyzeClothingForPrompt(
    clothingImageBuffer,
    clothingType,
    options = {}
  ) {
    try {
      const clothingImageBase64 = clothingImageBuffer.toString('base64');

      let colorDescription = '';
      if (options.dominantColor) {
        if (
          typeof options.dominantColor === 'object' &&
          options.dominantColor.r !== undefined
        ) {
          const colorName = this.rgbToColorName(
            options.dominantColor.r,
            options.dominantColor.g,
            options.dominantColor.b
          );
          colorDescription = `The dominant color of this garment is ${colorName} (RGB: ${options.dominantColor.r}, ${options.dominantColor.g}, ${options.dominantColor.b}). Use this as the primary color reference.`;
          options.dominantColor = colorName;
        } else if (
          typeof options.dominantColor === 'string' &&
          options.dominantColor.includes(',')
        ) {
          const [r, g, b] = options.dominantColor
            .split(',')
            .map((v) => parseInt(v.trim()));
          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            const colorName = this.rgbToColorName(r, g, b);
            colorDescription = `The dominant color of this garment is ${colorName} (RGB: ${r}, ${g}, ${b}). Use this as the primary color reference.`;
            options.dominantColor = colorName;
          }
        } else if (typeof options.dominantColor === 'string') {
          colorDescription = `The dominant color of this garment is ${options.dominantColor}. Use this as a reference.`;
        }
      }

      const analysisPrompt = `You are a professional fashion photographer analyzing clothing for a photoshoot. Analyze this ${clothingType} image in extreme detail.

${colorDescription}

Provide a comprehensive description including:

1. **Color & Tone**: Exact color description (be specific: "navy blue", "charcoal gray", "burgundy red", etc.), including any color variations, fading, or wash effects. Pay special attention to the exact shade and undertones.

2. **Material & Texture**: Identify the fabric type (denim, cotton, leather, silk, wool, etc.) and describe the texture (smooth, rough, ribbed, woven, knitted, etc.). Mention any visible weave patterns or fabric characteristics.

3. **Style & Cut**: Describe the specific style (skinny, straight-leg, bootcut, oversized, fitted, etc.), cut, and silhouette. Note any distinctive design elements.

4. **Details & Features**: List all visible details:
   - Stitching patterns and color
   - Buttons, zippers, pockets
   - Logos, labels, or branding
   - Distressing, tears, or vintage effects
   - Hemlines, cuffs, collars
   - Any embellishments or decorative elements

5. **Fit & Structure**: How the garment is structured (tailored, relaxed, form-fitting, etc.)

6. **Condition & Finish**: Is it new/pristine, vintage, distressed, faded? What's the overall finish?

Format your response as a single, detailed paragraph starting with: "A [specific color] [material] ${clothingType}..." 

Be extremely specific about colors and materials. This description will be used to generate a realistic fashion photograph, so accuracy is critical.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              { text: analysisPrompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: clothingImageBase64,
                },
              },
            ],
          },
        ],
      });

      const description = response.candidates[0].content.parts[0].text.trim();

      console.log('🔍 Análise detalhada da roupa:', description);

      return description;
    } catch (error) {
      console.warn(
        '⚠️ Erro ao analisar imagem, usando descrição com cor fornecida'
      );

      if (options.dominantColor) {
        return `A ${options.dominantColor} ${clothingType} with professional quality and clean design`;
      }

      return `A ${clothingType}`;
    }
  }

  buildDetailedPrompt(clothingType, clothingDescription, options) {
    const style = options.modelStyle || 'professional';
    const background =
      options.background ||
      'minimalist photography studio with professional lighting';

    const dominantColor = options.dominantColor || '';

    const colorAccuracy = dominantColor
      ? `\nCRITICAL: The garment MUST be ${dominantColor}. Ensure perfect color accuracy and fidelity to this exact shade. The lighting should showcase the true ${dominantColor} color without distortion.`
      : '';

    const styleDescriptions = {
      professional:
        'corporate professional, business casual, clean and polished',
      casual: 'relaxed lifestyle, everyday wear, approachable and natural',
      elegant:
        'sophisticated high-fashion, refined and luxurious, editorial elegance',
      urban: 'street style, modern city fashion, contemporary and edgy',
    };

    const styleDesc = styleDescriptions[style] || style;

    return `Professional fashion catalog photography of a model wearing ${clothingDescription}.

GARMENT DETAILS:
- Type: ${clothingType}
- Primary Color: ${dominantColor || 'as shown'}
- Description: ${clothingDescription}${colorAccuracy}

PHOTOGRAPHY SPECIFICATIONS:
- Style: ${styleDesc} fashion editorial
- Setting: ${background}
- Model: Professional fashion model with perfect posture and proportions, appropriate ethnicity diversity
- Pose: Natural, confident, elegant pose that showcases the garment beautifully
- Expression: Subtle, sophisticated, aspirational

LIGHTING & TECHNICAL:
- Lighting setup: Professional three-point lighting with soft key light, subtle fill, and hair light
- Color temperature: Balanced daylight (5500K) for accurate color reproduction
- Exposure: Perfect exposure with rich, accurate colors
- Focus: Tack-sharp focus on the garment with subtle background blur (f/2.8-f/4)
- Camera angle: Eye-level or slightly above, full-body or 3/4 shot as appropriate

IMAGE QUALITY:
- Resolution: Ultra high resolution (8K quality)
- Detail: Crisp fabric texture, visible stitching, realistic drape and fit
- Color accuracy: True-to-life colors, especially the garment's ${
      dominantColor || 'actual'
    } color
- Retouching: Professional subtle retouching, maintaining realistic skin and fabric texture
- Overall aesthetic: Premium fashion magazine editorial quality, aspirational yet authentic

COMPOSITION:
- Framing: Professional fashion composition with proper negative space
- Background: Complementary to the garment color without competing
- Styling: Minimal accessories, focus entirely on the showcased garment
- Mood: Confident, stylish, high-end fashion catalog aesthetic

The final image should look like it belongs in a luxury fashion brand's lookbook or a high-end fashion magazine editorial spread. Perfect for e-commerce and marketing materials.`;
  }

  /**
   * Testa se a API está configurada corretamente
   */
  async testApi() {
    try {
      console.log('🧪 Testando API Imagen...');

      const response = await this.ai.models.generateImages({
        model: this.imageModel,
        prompt: 'A simple red circle on white background',
        config: {
          numberOfImages: 1,
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        console.log('✅ API Imagen funcionando!');
        return { success: true, message: 'API Imagen operacional' };
      }

      return { success: false, error: 'Resposta inesperada da API' };
    } catch (error) {
      console.error('❌ Erro ao testar API:', error.message);
      return {
        success: false,
        error: error.message,
        suggestion:
          'Verifique se a API Imagen está habilitada em https://console.cloud.google.com/',
      };
    }
  }
}

export default ImageGenerationService;
