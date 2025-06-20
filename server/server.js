const express = require('express');
const MercadoPago = require('mercadopago');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');
const axios = require('axios');

// --- ADICIONE ISSO LOGO APÓS OS REQUIRES ---
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
// --- FIM DO BLOCO ---

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
const allowedOrigins = [
  'https://turflow.vercel.app',
  'http://turflow.vercel.app',
  'https://storesync.onrender.com',
  'http://storesync.onrender.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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

// --- ROTA PRINCIPAL PARA DOMÍNIO CUSTOMIZADO (salva Firestore + adiciona na Vercel) ---
app.post('/api/loja/custom-domain', async (req, res) => {
  const { lojaId, domain } = req.body;
  console.log("Recebido pedido para custom-domain:", { lojaId, domain });

  if (!lojaId || !domain) {
    return res.status(400).json({ message: 'lojaId e domain são obrigatórios.' });
  }
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return res.status(500).json({ message: 'Configuração da Vercel ausente. Contate o suporte.' });
  }

  // Busca o slug da loja (opcional, mas não será usado para redirect)
  let lojaSlug = null;
  try {
    const lojaDoc = await db.collection('lojas').doc(lojaId).get();
    if (lojaDoc.exists) {
      lojaSlug = lojaDoc.data().slug;
    }
  } catch (e) {
    console.error("Erro ao buscar slug da loja:", e.message);
  }
  if (!lojaSlug) {
    return res.status(400).json({ message: 'Slug da loja não encontrado.' });
  }

  // --- AJUSTE: Gera instrução A para domínio sem www, CNAME para www ---
  let dnsInstructions = [];
  if (domain.trim().toLowerCase().startsWith('www.')) {
    // Subdomínio www: CNAME
    dnsInstructions = [{
      type: 'CNAME',
      name: 'www',
      value: 'cname.vercel-dns.com.',
      ttl: 3600
    }];
  } else {
    // Domínio raiz: A
    dnsInstructions = [{
      type: 'A',
      name: '@',
      value: '76.76.21.21',
      ttl: 3600
    }];
  }

  // Salva tentativa inicial no Firestore
  await db.collection('lojas').doc(lojaId).set({
    customDomain: domain,
    domainVerified: false,
    domainDNSRecords: dnsInstructions,
    domainLastUpdate: new Date(),
  }, { merge: true });

  // Tenta adicionar na Vercel (sem redirect)
  try {
    console.log("Enviando domínio para Vercel...");
    const vercelApiUrl = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    const response = await axios.post(
      vercelApiUrl,
      { name: domain },
      {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log("Resposta da Vercel:", response.data);
    // Atualiza Firestore com status da Vercel
    await db.collection('lojas').doc(lojaId).update({
      vercelDomainStatus: response.data,
      domainLastUpdate: new Date(),
    });
    res.json({
      message: 'Domínio salvo e enviado para a Vercel. Siga as instruções de DNS e aguarde a verificação.',
      dnsInstructions,
      vercelResponse: response.data,
    });
  } catch (err) {
    console.error("Erro ao adicionar domínio na Vercel:", err.response?.data || err.message);
    let apiError = err.response?.data?.error?.message || err.response?.data?.error || err.message;
    await db.collection('lojas').doc(lojaId).update({
      vercelDomainStatus: { error: apiError },
      domainLastUpdate: new Date(),
    });
    res.status(500).json({ message: 'Erro ao adicionar domínio na Vercel.', error: apiError, dnsInstructions });
  }
});

// Middleware: identifica loja pelo domínio customizado (aceita localhost para testes)
app.use(async (req, res, next) => {
  let host = req.headers.host?.replace(/^www\./, '').toLowerCase();
  console.log("DEBUG domínio customizado buscado:", host);
  // Para testes locais, permita simular domínio customizado via hosts ou query
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    if (req.query.customDomain) {
      host = req.query.customDomain.toLowerCase();
    } else {
      return next();
    }
  }
  try {
    const snapshot = await db.collection('lojas')
      .where('customDomain', '==', host)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      req.lojaCustomizada = snapshot.docs[0].data();
      req.lojaIdCustomizada = snapshot.docs[0].id;
      req.lojaSlugCustomizada = snapshot.docs[0].data().slug;
    }
  } catch (e) {
    console.error('Erro ao buscar loja pelo domínio customizado:', e.message);
  }
  next();
});

// Rota pública que serve os dados da loja pelo domínio customizado
app.get('/public/loja', async (req, res) => {
  if (!req.lojaCustomizada) {
    return res.status(404).json({ message: 'Loja não encontrada para este domínio.' });
  }
  res.json({
    lojaId: req.lojaIdCustomizada,
    loja: req.lojaCustomizada,
    slug: req.lojaSlugCustomizada,
  });
});

// Endpoint: verifica status do domínio na Vercel e atualiza Firestore
app.post('/api/loja/verificar-dominio', async (req, res) => {
  const { lojaId, domain } = req.body;
  if (!lojaId || !domain) {
    return res.status(400).json({ message: 'lojaId e domain são obrigatórios.' });
  }
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return res.status(500).json({ message: 'Configuração da Vercel ausente.' });
  }

  try {
    const url = `https://api.vercel.com/v6/domains/${domain}/config${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
    });

    const verified = response.data?.configured === true && response.data?.misconfigured === false;
    await db.collection('lojas').doc(lojaId).update({
      domainVerified: verified,
      domainLastCheck: new Date(),
      vercelDomainCheck: response.data,
    });

    res.json({ verified, vercelStatus: response.data });
  } catch (err) {
    console.error('Erro ao verificar domínio na Vercel:', err.response?.data || err.message);
    res.status(500).json({ message: 'Erro ao verificar domínio na Vercel.', error: err.response?.data || err.message });
  }
});

// ROTA: Forçar integração do domínio já salvo no Firestore com a Vercel
app.post('/api/loja/forcar-vercel-domain', async (req, res) => {
  const { lojaId } = req.body;
  if (!lojaId) {
    return res.status(400).json({ message: 'lojaId é obrigatório.' });
  }
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return res.status(500).json({ message: 'Configuração da Vercel ausente. Contate o suporte.' });
  }

  try {
    const lojaDoc = await db.collection('lojas').doc(lojaId).get();
    if (!lojaDoc.exists) {
      return res.status(404).json({ message: 'Loja não encontrada.' });
    }
    const lojaData = lojaDoc.data();
    const domain = lojaData.customDomain;
    if (!domain || typeof domain !== 'string' || !domain.trim()) {
      return res.status(400).json({ message: 'Domínio não encontrado no documento da loja.' });
    }

    // --- AJUSTE: Gera instrução A para domínio sem www, CNAME para www ---
    let dnsInstructions = [];
    if (domain.trim().toLowerCase().startsWith('www.')) {
      dnsInstructions = [{
        type: 'CNAME',
        name: 'www',
        value: 'cname.vercel-dns.com.',
        ttl: 3600
      }];
    } else {
      dnsInstructions = [{
        type: 'A',
        name: '@',
        value: '76.76.21.21',
        ttl: 3600
      }];
    }

    const vercelApiUrl = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    const response = await axios.post(
      vercelApiUrl,
      { name: domain },
      {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    await db.collection('lojas').doc(lojaId).update({
      vercelDomainStatus: response.data,
      domainDNSRecords: dnsInstructions,
      domainLastUpdate: new Date(),
    });

    res.json({
      message: 'Domínio forçado e enviado para a Vercel. Siga as instruções de DNS e aguarde a verificação.',
      dnsInstructions,
      vercelResponse: response.data,
    });
  } catch (err) {
    let apiError = err.response?.data?.error?.message || err.response?.data?.error || err.message;
    res.status(500).json({ message: 'Erro ao adicionar domínio na Vercel.', error: apiError });
  }
});

// PORT e start do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor StoreSync rodando na porta ${PORT}`);
});
