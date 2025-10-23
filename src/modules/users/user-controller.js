// Remove importações desnecessárias (User, generateToken)
import userService from './user-service.js'; // Importa o Service

/**
 * [POST] /api/users/login
 * Autentica o usuário e retorna um token.
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Delega a lógica para o Service
    const userData = await userService.authenticateUser(email, password);
    res.json(userData); // Retorna o que o service preparou
  } catch (error) {
    // Usa o statusCode definido no Service (ou 500 como fallback)
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * [POST] /api/users/register
 * Cria um novo usuário (admin).
 */
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Delega a lógica para o Service
    const newUser = await userService.registerUser({ name, email, password });
    res.status(201).json(newUser); // Retorna o que o service preparou
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const saveFcmToken = async (req, res) => {
  const { token } = req.body;
  const userId = req.user._id; // Obtido do middleware 'protect'

  try {
    const result = await userService.saveFcmToken(userId, token);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { loginUser, registerUser, saveFcmToken };
