import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    fcmTokens: {
      type: [String], // Array de strings
      default: [],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: true, // Por padrão, usuários são admins (pro seu caso)
    },
  },
  {
    timestamps: true,
  }
);

// Middleware (Hook) do Mongoose: ANTES de salvar, criptografa a senha
userSchema.pre('save', async function (next) {
  // Roda o 'hash' apenas se a senha foi modificada
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar a senha (ex: this.password com a senha do login)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
