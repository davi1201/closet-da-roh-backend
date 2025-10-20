import aws from 'aws-sdk';
import env from '../../config/env.js';

const s3 = new aws.S3({
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

const uploadParams = {  
    Bucket: BUCKET_NAME, 
    Key: 'caminho/do/arquivo.jpg', 
    Body: 'Conteúdo do arquivo ou Buffer', 
    ContentType: 'image/jpeg',
    ACL: 'public-read'
};

const data = await s3.upload(uploadParams).promise();

