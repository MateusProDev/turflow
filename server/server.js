const express = require('express');
const MercadoPago = require('mercadopago');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

console.log("--- INICIANDO ARQUIVO server.js (VERSÃO COM LOGS DETALHADOS STORESYNC) ---"); // Log de versão

const app = express();

// --- INÍCIO: Inicialização do Firebase Admin SDK COM LOGS DETALHADOS ---
console.log("--- TENTANDO INICIALIZAR FIREBASE ADMIN SDK ---");
let db; // Declarar db aqui para escopo mais amplo

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
    // A linha abaixo dará erro no deploy se o arquivo não existir e nenhuma das vars de ambiente acima estiver definida.
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase: Admin SDK inicializado com config local.');
  }

  db = admin.firestore(); // Atribui à variável db
  console.log("Firebase: Instância do Firestore (db) criada com sucesso APÓS init.");

  // Teste de acesso ao Firestore
  if (admin.apps.length) { // Só testa se o app foi inicializado
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
  // Se o Firebase for essencial, você pode querer impedir o servidor de continuar:
  // process.exit(1); // Descomente se quiser que o servidor pare aqui em caso de erro no Firebase
}
// --- FIM: Inicialização do Firebase Admin SDK COM LOGS DETALHADOS ---


// Configuração de CORS
app.use(cors({
  origin: [
    'https://storesync.vercel.app',
    'https://storesync-two.vercel.app', // Sua segunda URL de frontend
    'http://localhost:3000', // Para desenvolvimento local do frontend
    // Adicione outras URLs se necessário
  ],
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());

// Configura Mercado Pago com SEU token principal (para pagamentos de plano da plataforma)
if (process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    MercadoPago.configure({
        access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    });
    console.log("Mercado Pago SDK (Plataforma) configurado com Access Token principal.");
} else {
    console.warn("ATENÇÃO: MERCADO_PAGO_ACCESS_TOKEN não definido. Rotas de pagamento de plano da plataforma podem falhar.");
}


// Rota de teste
app.get('/', (req, res) => {
  console.log("Log: Rota / (raiz) acessada");
  res.send('Servidor StoreSync funcionando ✅. Firebase Admin SDK status: ' + (admin.apps.length ? 'Inicializado com sucesso ('+admin.apps.length+' app(s))' : 'NÃO INICIALIZADO OU FALHOU'));
});

// Rota de checkout padrão (redirecionamento PARA PAGAMENTO DE PLANO DA PLATAFORMA)
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
      success: `https://storesync.vercel.app/success?userId=${userId}&type=plan_payment`, // Sua URL de frontend
      failure: `https://storesync.vercel.app/failure?userId=${userId}&type=plan_payment`,
      pending: `https://storesync.vercel.app/pending?userId=${userId}&type=plan_payment`,
    },
    auto_return: 'approved',
    notification_url: `${process.env.BASE_API_URL}/api/mp-platform-webhook`, // Precisa de BASE_API_URL no .env
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

// Rota de checkout transparente (embedado via SDK PARA PAGAMENTO DE PLANO DA PLATAFORMA)
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


// --- ROTA PARA CHECKOUT DE PRODUTOS DA LOJA DO CLIENTE ---
app.post('/api/create-store-preference', async (req, res) => {
  console.log("Log: Rota POST /api/create-store-preference (LOJA) acessada. Body:", JSON.stringify(req.body, null, 2));

  if (!db) { // Verifica se a instância do Firestore está disponível
      console.error("ERRO CRÍTICO em /api/create-store-preference: Instância do Firestore (db) não está definida. Firebase Admin SDK pode não ter inicializado corretamente.");
      return res.status(500).json({ error: 'Erro interno crítico do servidor - Configuração de banco de dados indisponível.' });
  }

  const { storeId, items, payerInfo, backUrlsFromClient } = req.body;

  if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
    console.error("Erro em /api/create-store-preference: Dados incompletos.", { storeId, itemsProvided: !!items });
    return res.status(400).json({ error: 'Dados incompletos para o checkout da loja: storeId e items (array) são obrigatórios.' });
  }

  try {
    console.log(`Buscando Access Token para lojaId: ${storeId}`);
    const storeRef = db.collection('lojas').doc(storeId);
    const storeDoc = await storeRef.get();

    if (!storeDoc.exists) {
      console.error(`Erro em /api/create-store-preference: Loja ${storeId} não encontrada.`);
      return res.status(404).json({ error: 'Loja não encontrada.' });
    }

    const storeData = storeDoc.data();
    const storeAccessToken = storeData.mpAccessToken;

    if (!storeAccessToken) {
      console.error(`Erro em /api/create-store-preference: Loja ${storeId} não configurou Access Token do MP.`);
      return res.status(400).json({ error: 'A loja não configurou suas credenciais de pagamento (Access Token ausente).' });
    }
    console.log(`Access Token da loja ${storeId} encontrado. Configurando instância MP...`);

    const storeMpInstance = new MercadoPago.MercadoPagoConfig({
        accessToken: storeAccessToken,
        options: { timeout: 7000 } // Aumentar timeout pode ajudar
    });
    const preferenceService = new MercadoPago.Preference(storeMpInstance);

    const mpItems = items.map(item => ({
      id: String(item.id || item.productId || Date.now() + Math.random()), // ID precisa ser string e único na preferência
      title: item.title || item.name, // Ajuste conforme o nome do campo no seu frontend
      description: item.description || `Produto da loja ${storeData.nome || storeId}`,
      quantity: parseInt(item.quantity || item.qtd, 10),
      unit_price: parseFloat(item.unit_price || item.price),
      currency_id: item.currency_id || 'BRL',
    }));

    const defaultSuccessUrl = `https://storesync.vercel.app/loja/${storeId}/payment-status?status=success&storeid=${storeId}`; // Exemplo, ajuste para sua URL de frontend
    const defaultFailureUrl = `https://storesync.vercel.app/loja/${storeId}/payment-status?status=failure&storeid=${storeId}`;
    const defaultPendingUrl = `https://storesync.vercel.app/loja/${storeId}/payment-status?status=pending&storeid=${storeId}`;

    const preferencePayload = {
      items: mpItems,
      payer: payerInfo ? {
        name: payerInfo.name,
        surname: payerInfo.surname,
        email: payerInfo.email,
        // ... outros dados do payer se disponíveis
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
      // marketplace_fee: ... // Se aplicável
    };
    console.log(`Payload da preferência para loja ${storeId}:`, JSON.stringify(preferencePayload, null, 2));

    const response = await preferenceService.create({ body: preferencePayload });
    console.log(`Preferência para loja ${storeId} criada com ID: ${response.id}, init_point: ${response.init_point}`);

    res.json({
      preferenceId: response.id,
      init_point: response.init_point,
    });

  } catch (err) {
    console.error(`Erro CRÍTICO ao criar preferência para loja ${storeId}:`, err.message || err);
    if(err.cause) console.error('Causa do erro (MP):', err.cause);
    // Tenta extrair mais detalhes do erro do MP se disponível
    let mpErrorDetails = err.cause?.message || err.message;
    if (err.response && err.response.data && err.response.data.message) {
        mpErrorDetails = err.response.data.message;
        if (err.response.data.cause) {
            mpErrorDetails += ` - Causa: ${JSON.stringify(err.response.data.cause)}`;
        }
    }
    res.status(500).json({
        error: 'Erro interno ao criar preferência de pagamento para a loja.',
        details: mpErrorDetails
    });
  }
});


// Rota de Webhook para pagamentos da LOJA (Exemplo básico)
app.post('/api/mp-store-webhook', async (req, res) => {
    const { query, body } = req;
    const storeId = query.storeId;
    const eventData = body;

    console.log(`Log Webhook: Recebido para loja ${storeId}. Tipo: ${eventData?.type}. Ação: ${eventData?.action}. Data ID: ${eventData?.data?.id}`);

    // Validação básica
    if (!storeId || !eventData || !eventData.type || !eventData.data || !eventData.data.id) {
        console.warn("Log Webhook: Dados incompletos ou malformados.", { query, body });
        return res.status(400).send('Dados de webhook incompletos.');
    }

    if (eventData.type === 'payment') {
        const paymentId = eventData.data.id;
        console.log(`Log Webhook: Processando pagamento ${paymentId} para loja ${storeId}...`);
        // Lógica para buscar o Access Token da loja, buscar detalhes do pagamento e atualizar o pedido
        // (Como discutido anteriormente)
    }
    res.status(200).send('Webhook recebido');
});

// Porta dinâmica (Render define via process.env.PORT)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} 🚀 (Render define a porta)`);
  if (!admin.apps.length) {
      console.warn("ATENÇÃO: Servidor rodando, MAS o Firebase Admin SDK PODE NÃO TER SIDO INICIALIZADO CORRETAMENTE.");
  } else {
      console.log("Firebase Admin SDK parece estar inicializado (" + admin.apps.length + " app(s)).");
  }
});