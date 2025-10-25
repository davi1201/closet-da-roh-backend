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
    origin: (origin, callback) => {
      // Lista de origens permitidas
      const allowedOrigins = [
        'https://closet-da-roh-front.vercel.app',
        'https://closetdaroh.com.br',
        process.env.APP_FRONTEND_URL,
      ].filter(Boolean); // Remove valores undefined/null

      // Em desenvolvimento, permite qualquer origem
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Permite requisições sem origin (como Postman, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Verifica se a origem está na lista de permitidas
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials: true, // Permite envio de cookies/credenciais
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conecta ao banco de dados
connectDB();

// Rotas
app.get('/api', (req, res) => res.send('API Closet da Roh está rodando! 🚀'));
app.use('/api/v1', v1Routes);

// Opcional: Bloco para rodar localmente (NÃO será executado na Vercel)
if (process.env.NODE_ENV !== 'production') {
  const localPort = process.env.API_PORT || 5005;
  app.listen(localPort, () =>
    console.log(
      `Servidor LOCAL rodando em http://localhost:${localPort} (e acessível via IP local)`
    )
  );
}

// Exporta o app para o Vercel
export default app;
