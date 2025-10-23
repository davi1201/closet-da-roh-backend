import jwt from 'jsonwebtoken';

// (Crie um arquivo .env e adicione JWT_SECRET=seu_segredo_muito_longo)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_NUNCA_USE_ISSO';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '1d', // Token expira em 1 dia
  });
};

export default generateToken;
