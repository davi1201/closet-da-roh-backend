// Remova: import multerS3 from 'multer-s3';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp'; // Importe o sharp

// --- Configuração do S3 (igual) ---
const s3Client = new S3Client({
  region: process.env.API_AWS_REGION,
  credentials: {
    accessKeyId: process.env.API_AWS_ACCESS_KEY,
    secretAccessKey: process.env.API_AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET_NAME = process.env.API_AWS_BUCKET_NAME;

// --- ETAPA 1: Middleware do Multer (para MemoryStorage) ---
// Isso apenas coloca o(s) arquivo(s) em req.files
export const s3UploadMiddleware = multer({
  storage: multer.memoryStorage(), // Salva o arquivo na RAM (req.files[...].buffer)
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
});

// --- ETAPA 2: Middleware de Otimização e Upload ---

/**
 * Função auxiliar para processar e enviar um único arquivo
 */
const optimizeAndUpload = async (file) => {
  // Pega o nome do arquivo sem a extensão
  const originalName = file.originalname.split('.').slice(0, -1).join('_');
  // Define a nova chave com extensão .webp
  const newKey = `product-images/${Date.now()}-${originalName.replace(
    / /g,
    '_'
  )}.webp`;

  // Otimiza o buffer
  const optimizedBuffer = await sharp(file.buffer)
    .resize({ width: 1920, fit: 'inside', withoutEnlargement: true }) // Redimensiona se for maior que 1920px
    .webp({ quality: 80 }) // Converte para WebP com 80% de qualidade
    .toBuffer();

  // Prepara o comando de upload
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: newKey,
    Body: optimizedBuffer,
    ContentType: 'image/webp',
    ACL: 'public-read', // Se você ainda usa ACLs
  });

  // Envia para o S3
  await s3Client.send(command);

  // Retorna os dados que o controller precisará
  const s3Url = `https://${BUCKET_NAME}.s3.${process.env.API_AWS_REGION}.amazonaws.com/${newKey}`;
  return {
    url: s3Url,
    key: newKey,
  };
};

/**
 * O middleware que será usado na rota.
 * Ele espera que 'req.files' (array) ou 'req.files.images' (objeto) exista.
 */
export const optimizeImagesMiddleware = async (req, res, next) => {
  if (!req.files) {
    return next(); // Nenhum arquivo para processar, pula
  }

  let filesToProcess = [];

  // Ajusta se você usa .array('images') [req.files]
  // ou .fields([{ name: 'images' }]) [req.files.images]
  if (Array.isArray(req.files)) {
    filesToProcess = req.files;
  } else if (req.files.images) {
    filesToProcess = req.files.images;
  }

  if (filesToProcess.length === 0) {
    return next(); // Nenhum arquivo no campo 'images', pula
  }

  try {
    // Processa todos os arquivos em paralelo
    const processedImages = await Promise.all(
      filesToProcess.map((file) => optimizeAndUpload(file))
    );

    // Salva os dados das imagens otimizadas em req.body
    // (O controller vai ler daqui)
    req.body.images = processedImages;

    next();
  } catch (error) {
    console.error('Erro ao otimizar ou enviar imagens:', error);
    next(error);
  }
};
