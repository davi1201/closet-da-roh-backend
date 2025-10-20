import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

const s3Storage = multerS3({
  s3: s3Client,
  bucket: BUCKET_NAME,
  acl: 'public-read',
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname.replace(/ /g, '_')}`;
    cb(null, `product-images/${fileName}`);
  },
});

export const s3UploadMiddleware = multer({
  storage: s3Storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB por arquivo
});
