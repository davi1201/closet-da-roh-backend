import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false; // Evita reconexões desnecessárias

export const connectDB = async () => {
  if (isConnected) {
    console.log('🔄 Usando conexão existente com o MongoDB');
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Aumenta para 30 segundos (exemplo)
      socketTimeoutMS: 45000, // Aumenta timeout do socket
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log('✅ MongoDB conectado com sucesso');
    return conn;
  } catch (err) {
    console.error('❌ Erro ao conectar no MongoDB:', err.message);
    process.exit(1);
  }
};
