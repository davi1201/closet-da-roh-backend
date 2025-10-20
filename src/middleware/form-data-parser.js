import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
});

/**
 * Middleware dinâmico para parsear multipart/form-data.
 * Coloca os campos de texto em req.body e os arquivos em req.files (ambos na memória RAM).
 * * @param {string} fieldName - O nome do campo de arquivo no formulário (ex: 'images').
 * @param {number} maxFiles - O número máximo de arquivos permitidos.
 * @returns {import('express').RequestHandler} Middleware do Multer.
 */
export const formDataParser = (fieldName, maxFiles) => {
  return upload.fields([{ name: fieldName, maxCount: maxFiles }]);
};
