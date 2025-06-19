const express = require('express');
const MercadoPago = require('mercadopago');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

console.log("--- INICIANDO ARQUIVO server.js (VERSÃO COM LOGS DETALHADOS STORESYNC) ---"); // Log de versão

const app = express();

// --- INÍCIO: Inicialização do Firebase Admin SDK COM LOGS DETALHADOS ---
console.log("--- TENTANDO INICIALIZAR FIREBASE ADMIN SDK ---");
let db;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    console.log("Firebase: Tentando inicializar com GOOGLE_APPLICATION_CREDENTIALS_JSON...");
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase: Admin SDK inicializado com GOOGLE_APPLICATION_CREDENTIALS_JSON.');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log("Firebase: Tentando inicializar com GOOGLE_APPLICATION_CREDENTIALS (path)...");
    admin.initializeApp({
      credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
    });
    console.log('Firebase: Admin SDK inicializado com GOOGLE_APPLICATION_CREDENTIALS (path).');
  } else {
    console.log("Firebase: Tentando inicializar com config local (serviceAccountKey.json)...");
    const serviceAccountPath = __dirname + '/serviceAccountKey.json';
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase: Admin SDK inicializado com config local serviceAccountKey.json.');
  }

  db = admin.firestore();
  console.log("Firebase: Instância do Firestore (db) criada com sucesso APÓS init.");

  if (admin.apps.length) {
    console.log("Firebase Teste: Acessando coleção 'lojas' (limit 1)...");
    db.collection('lojas').limit(1).get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('Firebase Teste: Nenhuma loja encontrada (ou coleção vazia), mas a conexão parece OK.');
            } else {
                console.log('Firebase Teste: Conexão bem-sucedida, primeira loja ID:', snapshot.docs[0].id);
            }
        })
        .catch(err => {
            console.error('Firebase Teste: ERRO ao tentar acessar coleção "lojas":', err.message);
        });
  }

} catch (error) {
  console.error('--- ERRO CRÍTICO AO INICIALIZAR FIREBASE ADMIN SDK ---');
  console.error('Mensagem:', error.message);
  console.error('Stack:', error.stack);
  console.error('--- FIM ERRO CRÍTICO FIREBASE ---');
}

// Configuração de CORS
app.use(cors({
  origin: [
    'http://turflow.vercel.app',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());

// --- CONSTANTES PARA URLs DE RETORNO ---
const BASE_FRONTEND_URL = process.env.FRONTEND_URL || 'http://turflow.vercel.app';

const getDefaultBackUrls = (context = {}) => {
  const { userId, storeId, type = 'payment' } = context;
  const baseSuccessUrl = `${BASE_FRONTEND_URL}/${storeId ? `loja/${storeId}/` : ''}payment-status`;
  
  return {
    success: `${baseSuccessUrl}?status=success${userId ? `&userId=${userId}` : ''}${storeId ? `&storeId=${storeId}` : ''}&type=${type}`,
    failure: `${baseSuccessUrl}?status=failure${userId ? `&userId=${userId}` : ''}${storeId ? `&storeId=${storeId}` : ''}&type=${type}`,
    pending: `${baseSuccessUrl}?status=pending${userId ? `&userId=${userId}` : ''}${storeId ? `&storeId=${storeId}` : ''}&type=${type}`,
  };
};

// Configura Mercado Pago com token principal (única instância)
if (process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    MercadoPago.configure({
        access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    });
    console.log("Mercado Pago SDK configurado com Access Token principal.");
} else {
    console.warn("ATENÇÃO: MERCADO_PAGO_ACCESS_TOKEN não definido. Rotas de pagamento podem falhar.");
}

// Rota de teste
app.get('/', (req, res) => {
  console.log("Log: Rota / (raiz) acessada");
  res.send('Servidor StoreSync funcionando ✅. Firebase Admin SDK status: ' + (admin.apps.length ? 'Inicializado com sucesso ('+admin.apps.length+' app(s))' : 'NÃO INICIALIZADO OU FALHOU'));
});

// Rota de checkout para planos (usa a instância centralizada)
app.post('/api/create-preference', async (req, res) => {
  console.log("Log: Rota POST /api/create-preference (PLANOS) acessada. Body:", req.body);
  const { userId, planName, amount } = req.body;

  if (!userId || !planName || !amount) {
    console.error("Erro em /api/create-preference: Dados incompletos", { userId, planName, amount });
    return res.status(400).json({ error: 'Dados incompletos para pagamento de plano' });
  }

  // Usar função auxiliar para gerar URLs de retorno
  const backUrls = getDefaultBackUrls({ userId, type: 'plan_payment' });

  // Garantir que backUrls.success é sempre uma string válida
  if (!backUrls.success || typeof backUrls.success !== 'string' || backUrls.success.trim() === '') {
    backUrls.success = 'https://turflow.vercel.app/success?type=plan_payment';
  }
  if (!backUrls.failure || typeof backUrls.failure !== 'string' || backUrls.failure.trim() === '') {
    backUrls.failure = 'https://turflow.vercel.app/failure?type=plan_payment';
  }
  if (!backUrls.pending || typeof backUrls.pending !== 'string' || backUrls.pending.trim() === '') {
    backUrls.pending = 'https://turflow.vercel.app/pending?type=plan_payment';
  }

  console.log('DEBUG back_urls:', backUrls);

  const preference = {
    items: [{
      title: `Plano ${planName} StoreSync`,
      quantity: 1,
      unit_price: parseFloat(amount),
      currency_id: 'BRL',
    }],
    back_urls: backUrls,
    auto_return: 'approved',
    notification_url: `${process.env.BASE_API_URL}/api/mp-platform-webhook`,
    metadata: {
      userId,
      planName,
      payment_context: 'platform_plan_upgrade',
    },
  };

  try {
    const response = await MercadoPago.preferences.create(preference);
    console.log("Log: Preferência de PLANO criada com ID:", response.body.id);
    res.json({ preferenceId: response.body.id, init_point: response.body.init_point });
  } catch (err) {
    // LOG DETALHADO DO ERRO
    if (err.response) {
      console.error('Erro ao criar preferência de PLANO:', err.response.status, err.response.statusText);
      console.error('Body:', err.response.data || err.response.body);
    } else {
      console.error('Erro ao criar preferência de PLANO:', err.message || err);
    }
    if(err.cause) console.error('Causa do erro (MP):', err.cause);
    res.status(500).send('Erro ao criar preferência de plano');
  }
});

// Rota de checkout transparente para planos
app.post('/api/mercadopago', async (req, res) => {
  console.log("Log: Rota POST /api/mercadopago (PLANOS TRANSPARENTE) acessada. Body:", req.body);
  const { userId, amount, description } = req.body;

  if (!userId || !amount) {
    console.error("Erro em /api/mercadopago: Dados incompletos", { userId, amount });
    return res.status(400).json({ error: 'Dados incompletos para checkout transparente de plano' });
  }

  const backUrls = getDefaultBackUrls({ userId, type: 'plan_payment_transparent' });

  const preference = {
    items: [{
      title: description || 'Plano StoreSync',
      quantity: 1,
      unit_price: parseFloat(amount),
      currency_id: 'BRL',
    }],
    back_urls: backUrls,
    auto_return: 'approved',
    notification_url: `${process.env.BASE_API_URL}/api/mp-platform-webhook`,
    metadata: {
      userId,
      payment_context: 'platform_plan_transparent',
    },
  };

  try {
    const response = await MercadoPago.preferences.create(preference);
    console.log("Log: Preferência de PLANO (transparente) criada:", response.body.id);
    res.json({ preference: response.body });
  } catch (err) {
    console.error('Erro no checkout transparente de PLANO:', err.message || err);
    if(err.cause) console.error('Causa do erro (MP):', err.cause);
    res.status(500).send('Erro ao gerar checkout transparente de plano');
  }
});

// PORT e start do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor StoreSync rodando na porta ${PORT}`);
});
