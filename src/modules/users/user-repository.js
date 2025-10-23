import User from './user-model.js';

class UserRepository {
  /**
   * Encontra um usuário pelo email.
   * @param {string} email
   * @returns {Promise<Document|null>} O documento completo do Mongoose ou null.
   */
  async findByEmail(email) {
    // Retorna o documento Mongoose completo, não .lean()
    // pois precisaremos do método .matchPassword()
    return await User.findOne({ email: email.toLowerCase() });
  }

  async findById(id) {
    return await User.findById(id).select('-password');
  }

  /**
   * Cria um novo usuário.
   * A senha já deve vir hasheada pelo 'pre-save' hook do model.
   * @param {object} userData - { name, email, password, isAdmin }
   * @returns {Promise<Document>} O documento Mongoose criado.
   */
  async create(userData) {
    // O Model User fará o hash da senha automaticamente
    const user = new User(userData);
    return await user.save();
  }

  async addFcmToken(userId, token) {
    return await User.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: token }, // Adiciona apenas se não existir
    });
  }
}

export default new UserRepository();
