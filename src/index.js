import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDB } from './config/database.js';
import { v1Routes } from './routes/v1.js';
import './config/firebase-admin.js';
// Inicializa o dotenv antes de usar variáveis de ambiente
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Define a função principal assíncrona para encapsular a conexão com o DB
async function startServer() {
  try {
    // Conecta ao banco de dados
    await connectDB();
    console.log('✅ Conexão com o banco de dados estabelecida.');

    // Rotas
    app.get('/', (req, res) => res.send('API de Vendas Online 🚀'));
    app.use('/api/v1', v1Routes);

    // Inicializa o servidor
    const PORT = process.env.API_PORT || 3000;
    const HOST = '192.168.0.102'; // Garante que o servidor escute em todas as interfaces de rede (incluindo o IP local)

    // Chamada de listen com o host explicitamente definido
    app.listen(PORT, HOST, () =>
      console.log(
        `Servidor rodando em http://${HOST}:${PORT} (e acessível via IP local)`
      )
    );
  } catch (error) {
    console.error(
      '❌ Erro fatal ao iniciar o servidor ou conectar ao DB:',
      error.message
    );
    process.exit(1);
  }
}

// Chama a função para iniciar a aplicação
startServer();
