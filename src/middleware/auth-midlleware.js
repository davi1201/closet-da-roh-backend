import jwt from 'jsonwebtoken';
// Remova a importação direta do Model
// import User from '../models/UserModel.js';
// Importe o Repository
import userRepository from '../modules/users/user-repository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_NUNCA_USE_ISSO';

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      // --- AJUSTE AQUI: Use o Repository ---
      // Substitua a linha antiga:
      // req.user = await User.findById(decoded.id).select('-password');
      // Pela nova linha:
      req.user = await userRepository.findById(decoded.id);
      // --- FIM DO AJUSTE ---

      // Verifica se o usuário ainda existe (caso tenha sido deletado após token gerado)
      if (!req.user) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }

      next();
    } catch (error) {
      console.error('Erro de token:', error.message);
      // Diferencia erro de token inválido de usuário não encontrado
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        res.status(401).json({ message: 'Token inválido ou expirado' });
      } else {
        res.status(401).json({ message: 'Não autorizado' });
      }
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Sem token, acesso não autorizado' });
  }
};

// O middleware 'adminOnly' não precisa mudar, pois ele lê 'req.user'
const adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Não autorizado como admin' });
  }
};

export { protect, adminOnly };
