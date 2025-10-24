// import admin from 'firebase-admin';
// import path from 'path'; // Para lidar com caminhos
// import { fileURLToPath } from 'url'; // Para __dirname em ES Modules

// // Obtenha o __dirname no ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// try {
//   // Tenta carregar do arquivo (MUITO CUIDADO COM ESTE ARQUIVO!)
//   // Idealmente, use variáveis de ambiente
//   const serviceAccountPath = path.join(
//     __dirname,
//     '..',
//     'closet-da-roh-firebase-adminsdk-fbsvc-f7104becf4.json'
//   ); // <-- Coloque o nome do seu arquivo JSON aqui

//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccountPath),
//     // (Opcional) Adicione databaseURL se for usar Realtime Database
//     // databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
//   });
//   console.log('Firebase Admin SDK inicializado com sucesso.');
// } catch (error) {
//   console.error('Erro ao inicializar Firebase Admin SDK:', error);
//   // Alternativa mais segura: Carregar de variáveis de ambiente
//   /*
//   if (process.env.FIREBASE_SERVICE_ACCOUNT) {
//     const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount)
//     });
//     console.log('Firebase Admin SDK inicializado via ENV VAR.');
//   } else {
//     console.error('Credenciais do Firebase não encontradas!');
//   }
//   */
// }

// export default admin;

import admin from 'firebase-admin';
import 'dotenv/config'; // Make sure dotenv is configured early in your app entry point, or import it here

try {
  // --- AJUSTE AQUI ---
  // Tenta carregar as credenciais da variável de ambiente FIREBASE_SERVICE_ACCOUNT
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const base64Credentials = process.env.FIREBASE_SERVICE_ACCOUNT;
    const jsonCredentials = Buffer.from(base64Credentials, 'base64').toString(
      'utf-8'
    );
    const serviceAccount = JSON.parse(jsonCredentials);

    console.log('Raw ENV VAR:', jsonCredentials); // Log para ver a string crua
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // (Opcional) Adicione databaseURL se for usar Realtime Database
      // databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
    });
    console.log('Firebase Admin SDK inicializado via Variável de Ambiente.');
  } else {
    // Se a variável de ambiente não estiver definida, lança um erro
    throw new Error(
      'Variável de ambiente FIREBASE_SERVICE_ACCOUNT não definida.'
    );
  }
  // --- FIM DO AJUSTE ---
} catch (error) {
  console.error('Erro ao inicializar Firebase Admin SDK:', error);
  // Considerar parar a aplicação se o Firebase for essencial
  // process.exit(1);
}

export default admin;
