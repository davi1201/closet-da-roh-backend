import express from 'express';
import {
  createResponse,
  getAllResponses,
  getResponseById,
  deleteResponse,
  getSummary,
} from './survey-controller.js';
import { protect } from '../../middleware/auth-midlleware.js';

const router = express.Router();

/**
 * @route   GET /api/survey-responses/summary
 * @desc    Busca um resumo agregado de todas as respostas
 * @access  Private (Requer autenticação)
 */
router.get('/summary', protect, getSummary);

/**
 * @route   GET /api/survey-responses
 * @desc    Lista todas as respostas do questionário
 * @access  Public (ou Private, se preferir)
 */
router.get('/', getAllResponses);

/**
 * @route   POST /api/survey-responses
 * @desc    Cria uma nova resposta para o questionário
 * @access  Private (Requer autenticação para saber quem coletou)
 */
router.post('/', createResponse);

/**
 * @route   GET /api/survey-responses/:id
 * @desc    Busca uma resposta específica pelo ID
 * @access  Public (ou Private, se preferir)
 */
router.get('/:id', getResponseById);

/**
 * @route   DELETE /api/survey-responses/:id
 * @desc    Deleta uma resposta pelo ID
 * @access  Private (Requer autenticação)
 */
router.delete('/:id', protect, deleteResponse);

export default router;
