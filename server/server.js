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
        credential: admin.credential.applicationDefault(),
    });
    console.log('Firebase: Admin SDK inicializado com GOOGLE_APPLICATION_CREDENTIALS (path).');
  } else {
    console.log("Firebase: Tentando inicializar com config local (FIREBASE_ADMIN_SDK_CONFIG_PATH)...");
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_CONFIG_PATH || './serviceAccountKey.json';
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase: Admin SDK inicializado com config local.');
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

  const preference = {
    items: [{
        title: `Plano ${planName} StoreSync`,
        quantity: 1,
        unit_price: parseFloat(amount),
        currency_id: 'BRL',
    }],
    back_urls: {
      success: `http://turflow.vercel.app/success?userId=${userId}&type=plan_payment`,
      failure: `http://turflow.vercel.app/failure?userId=${userId}&type=plan_payment`,
      pending: `http://turflow.vercel.app/pending?userId=${userId}&type=plan_payment`,
    },
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
    console.error('Erro ao criar preferência de PLANO:', err.message || err);
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

  const preference = {
    items: [{
        title: description || 'Plano StoreSync',
        quantity: 1,
        unit_price: parseFloat(amount),
        currency_id: 'BRL',
    }],
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


// --- ROTA PARA CHECKOUT DE PRODUTOS DA LOJA DO CLIENTE (SEM INSTÂNCIA SEPARADA) ---
app.post('/api/create-store-preference', async (req, res) => {
  console.log("Log: Rota POST /api/create-store-preference (LOJA) acessada. Body:", JSON.stringify(req.body, null, 2));

  if (!db) {
      console.error("ERRO CRÍTICO em /api/create-store-preference: Instância do Firestore (db) não está definida.");
      return res.status(500).json({ error: 'Erro interno crítico do servidor - Configuração de banco de dados indisponível.' });
  }

  const { storeId, items, payerInfo, backUrlsFromClient } = req.body;

  if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
    console.error("Erro em /api/create-store-preference: Dados incompletos.", { storeId, itemsProvided: !!items });
    return res.status(400).json({ error: 'Dados incompletos para o checkout da loja: storeId e items (array) são obrigatórios.' });
  }

  try {
    // Busca dados da loja apenas para validar e pegar info básica, não para token MP
    console.log(`Buscando dados da loja para storeId: ${storeId}`);
    const storeRef = db.collection('lojas').doc(storeId);
    const storeDoc = await storeRef.get();

    if (!storeDoc.exists) {
      console.error(`Erro em /api/create-store-preference: Loja ${storeId} não encontrada.`);
      return res.status(404).json({ error: 'Loja não encontrada.' });
    }

    const storeData = storeDoc.data();

    // Construção dos itens para MercadoPago
    const mpItems = items.map(item => ({
      id: String(item.id || item.productId || Date.now() + Math.random()),
      title: item.title || item.name,
      description: item.description || `Produto da loja ${storeData.nome || storeId}`,
      quantity: parseInt(item.quantity || item.qtd, 10),
      unit_price: parseFloat(item.unit_price || item.price),
      currency_id: item.currency_id || 'BRL',
    }));

    const defaultSuccessUrl = `http://turflow.vercel.app/loja/${storeId}/payment-status?status=success&storeid=${storeId}`;
    const defaultFailureUrl = `http://turflow.vercel.app/loja/${storeId}/payment-status?status=failure&storeid=${storeId}`;
    const defaultPendingUrl = `http://turflow.vercel.app/loja/${storeId}/payment-status?status=pending&storeid=${storeId}`;

    const preferencePayload = {
      items: mpItems,
      payer: payerInfo ? {
        name: payerInfo.name,
        surname: payerInfo.surname,
        email: payerInfo.email,
      } : undefined,
      back_urls: {
        success: backUrlsFromClient?.success || defaultSuccessUrl,
        failure: backUrlsFromClient?.failure || defaultFailureUrl,
        pending: backUrlsFromClient?.pending || defaultPendingUrl,
      },
      auto_return: 'approved',
      notification_url: `${process.env.BASE_API_URL}/api/mp-store-webhook?storeId=${storeId}`,
      metadata: {
        storeId,
        cart_items_ids: items.map(i => i.id || i.productId),
        payment_context: 'store_product_purchase',
      },
    };

    console.log("Criando preferência MercadoPago com payload:", JSON.stringify(preferencePayload, null, 2));

    // Usa única instância MercadoPago já configurada globalmente
    const response = await MercadoPago.preferences.create(preferencePayload);

    console.log("Preferência criada com sucesso para a loja", storeId, "ID da preferência:", response.body.id);

    res.json({
      preferenceId: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
    });
  } catch (error) {
    console.error("Erro ao criar preferência MercadoPago para a loja", storeId, error.message || error);
    res.status(500).json({ error: 'Erro ao criar preferência de pagamento para a loja.' });
  }
});

// PORT e start do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor StoreSync rodando na porta ${PORT}`);
});
