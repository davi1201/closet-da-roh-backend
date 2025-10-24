import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Inicializa o dotenv ANTES de qualquer outro código que use process.env
dotenv.config();

import { connectDB } from './config/database.js';
import { v1Routes } from './routes/v1.js';
import './config/firebase-admin.js'; // Inicializa o Firebase Admin SDK

const app = express();

// Middlewares
app.use(
  cors({
    // Use a variável de ambiente renomeada ou permita tudo em dev
    origin:
      process.env.APP_FRONTEND_URL ||
      (process.env.NODE_ENV === 'development' ? '*' : undefined),
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conecta ao banco de dados (pode ser chamado aqui ou dentro de uma função async)
connectDB(); // Assuming connectDB handles potential errors or logs success

// Rotas
app.get('/api', (req, res) => res.send('API Closet da Roh está rodando! 🚀')); // Mudado para /api para consistência
app.use('/api/v1', v1Routes); // Assume que v1Routes contém todas as suas rotas (/users, /products, etc.)

// --- Ajuste para Vercel ---
// Remove a chamada direta de listen daqui e exporta o app

// Opcional: Bloco para rodar localmente (NÃO será executado na Vercel)
if (process.env.NODE_ENV !== 'production') {
  const localPort = process.env.API_PORT || 5005; // Usa a porta do .env ou 5005
  // Removido o HOST fixo, '0.0.0.0' (padrão) ou deixar em branco geralmente funciona melhor localmente
  // para aceitar conexões de qualquer interface de rede (incluindo IP local)
  app.listen(localPort, () =>
    console.log(
      `Servidor LOCAL rodando em http://localhost:${localPort} (e acessível via IP local)`
    )
  );
}

// --- Exporta o app para o Vercel ---
export default app;
