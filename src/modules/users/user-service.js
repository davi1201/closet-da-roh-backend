import userRepository from './user-repository.js';
import generateToken from '../../utils/generate-token.js';
import admin from '../../config/firebase-admin.js';

// Defina o nome do tópico (pode vir de .env)
const ADMIN_NOTIFICATION_TOPIC =
  process.env.ADMIN_NOTIFICATION_TOPIC || 'admin_notifications';

class UserService {
  async authenticateUser(email, password) {
    const user = await userRepository.findByEmail(email);

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: token,
      };
    } else {
      const error = new Error('E-mail ou senha inválidos');
      error.statusCode = 401;
      throw error;
    }
  }

  async registerUser(userData) {
    const { name, email, password } = userData;

    const userExists = await userRepository.findByEmail(email);
    if (userExists) {
      const error = new Error('Usuário já existe');
      error.statusCode = 400;
      throw error;
    }

    const user = await userRepository.create({
      name,
      email: email.toLowerCase(),
      password,
      isAdmin: true,
    });

    if (user) {
      const token = generateToken(user._id);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: token,
      };
    } else {
      const error = new Error('Dados de usuário inválidos');
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Salva o token FCM no usuário E o inscreve no tópico de admin.
   */
  async saveFcmToken(userId, token) {
    if (!userId || !token) {
      throw new Error('UserId e Token são obrigatórios.');
    }

    // 1. Salva o token no banco de dados (usando $addToSet no repo)
    await userRepository.addFcmToken(userId, token);

    // 2. Inscreve o token no tópico
    try {
      await admin
        .messaging()
        .subscribeToTopic([token], ADMIN_NOTIFICATION_TOPIC);
      console.log(
        `Token ${token} inscrito no tópico ${ADMIN_NOTIFICATION_TOPIC}`
      );
    } catch (error) {
      console.error(`Erro ao inscrever token ${token} no tópico:`, error);
      // Decide se quer lançar o erro ou apenas logar
      // throw new Error('Erro ao inscrever token no tópico de notificações.');
    }

    return { message: 'Token salvo e inscrito com sucesso.' };
  }

  /**
   * (Opcional) Remove o token do usuário e o desinscreve do tópico.
   * Chamar esta função na lógica de logout.
   */
  async removeAndUnsubscribeFcmToken(userId, token) {
    if (!userId || !token) {
      console.warn('Tentativa de remover/desinscrever token inválido.');
      return;
    }
    try {
      // Remove do banco (adicione removeFcmToken ao seu userRepository)
      // await userRepository.removeFcmToken(userId, token);

      // Desinscreve do tópico
      await admin
        .messaging()
        .unsubscribeFromTopic([token], ADMIN_NOTIFICATION_TOPIC);
      console.log(
        `Token ${token} removido e desinscrito do tópico ${ADMIN_NOTIFICATION_TOPIC}`
      );
    } catch (error) {
      console.error(`Erro ao desinscrever/remover token ${token}:`, error);
      // Não lançar erro no logout, apenas logar
    }
  }
}

export default new UserService();
