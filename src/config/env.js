const env = {
  PORT: process.env.PORT || 3000,
  MONGO_URI:
    process.env.MONGO_URI || 'mongodb://localhost:27017/camarim-da-roh',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  API_AWS_SECRET_ACCESS_KEY: process.env.API_AWS_SECRET_ACCESS_KEY || '',
  API_AWS_REGION: process.env.API_AWS_REGION || 'us-east-1',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'closet-da-roh',
};

export default env;
