import express from 'express';
import {
  generateColorVariations,
  generateModelImage,
  healthCheck,
  uploadMiddleware,
} from './gemini-image-controller.js';
const router = express.Router();
/**
 * POST /generate-model-image
 * Gera uma imagem profissional de modelo
 *
 * Body (multipart/form-data):
 * - clothing_image: arquivo de imagem (obrigatório)
 * - clothing_type: tipo da roupa (opcional, padrão: "peça de roupa")
 * - model_style: profissional | casual | elegante | urbano (opcional, padrão: "profissional")
 * - background: descrição do cenário (opcional)
 */
router.post('/generate-model-image', uploadMiddleware, generateModelImage);
router.post(
  '/generate-color-variations',
  uploadMiddleware,
  generateColorVariations
);

/**
 * GET /health
 * Verifica o status do serviço
 */
router.get('/health', healthCheck);

export default router;
