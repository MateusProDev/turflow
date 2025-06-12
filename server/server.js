const { MercadoPago } = require('mercadopago');

app.post('/api/create-store-preference', async (req, res) => {
  console.log("Log: Rota POST /api/create-store-preference (LOJA) acessada. Body:", JSON.stringify(req.body, null, 2));

  if (!db) {
    console.error("ERRO CRÍTICO: Instância do Firestore (db) não disponível.");
    return res.status(500).json({ error: 'Erro interno do servidor - banco de dados indisponível.' });
  }

  const { storeId, items, payerInfo, backUrlsFromClient } = req.body;

  if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
    console.error("Erro: Dados incompletos.", { storeId, itemsProvided: !!items });
    return res.status(400).json({ error: 'Dados incompletos para checkout da loja: storeId e items são obrigatórios.' });
  }

  try {
    console.log(`Buscando Access Token para lojaId: ${storeId}`);
    const storeRef = db.collection('lojas').doc(storeId);
    const storeDoc = await storeRef.get();

    if (!storeDoc.exists) {
      console.error(`Erro: Loja ${storeId} não encontrada.`);
      return res.status(404).json({ error: 'Loja não encontrada.' });
    }

    const storeData = storeDoc.data();
    const storeAccessToken = storeData.mpAccessToken;

    if (!storeAccessToken) {
      console.error(`Erro: Loja ${storeId} não configurou Access Token do MP.`);
      return res.status(400).json({ error: 'A loja não configurou suas credenciais de pagamento.' });
    }

    console.log(`Access Token da loja ${storeId} encontrado. Criando instância MercadoPago local...`);
    const storeMpInstance = new MercadoPago({ access_token: storeAccessToken });

    // Função para validar e formatar quantidade e preço
    function validarQuantidade(qtd) {
      const quantidade = parseInt(qtd, 10);
      if (isNaN(quantidade) || quantidade < 1) return 1;
      return quantidade;
    }

    function validarPreco(preco) {
      const valor = parseFloat(preco);
      if (isNaN(valor) || valor <= 0) return 1.0;
      return Math.round(valor * 100) / 100; // arredonda para 2 casas decimais
    }

    const mpItems = items.map(item => ({
      id: String(item.id || item.productId || (Date.now() + Math.random()).toString()),
      title: item.title || item.name || 'Produto da loja',
      description: item.description || `Produto da loja ${storeData.nome || storeId}`,
      quantity: validarQuantidade(item.quantity || item.qtd),
      unit_price: validarPreco(item.unit_price || item.price),
      currency_id: item.currency_id || 'BRL',
    }));

    // URLs de retorno - usando variáveis de ambiente, com fallback para URLs padrão
    const baseFrontendUrl = process.env.FRONTEND_BASE_URL || `http://turflow.vercel.app`;
    const defaultSuccessUrl = `${baseFrontendUrl}/loja/${storeId}/payment-status?status=success&storeid=${storeId}`;
    const defaultFailureUrl = `${baseFrontendUrl}/loja/${storeId}/payment-status?status=failure&storeid=${storeId}`;
    const defaultPendingUrl = `${baseFrontendUrl}/loja/${storeId}/payment-status?status=pending&storeid=${storeId}`;

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

    console.log(`Payload da preferência para loja ${storeId}:`, JSON.stringify(preferencePayload, null, 2));

    const response = await storeMpInstance.preferences.create(preferencePayload);

    console.log(`Preferência para loja ${storeId} criada com ID: ${response.body.id}, init_point: ${response.body.init_point}`);

    return res.json({
      preferenceId: response.body.id,
      init_point: response.body.init_point,
    });

  } catch (err) {
    console.error(`Erro ao criar preferência para loja ${storeId}:`, err.message || err);
    if (err.cause) console.error('Causa do erro (MP):', err.cause);

    let mpErrorDetails = err.cause?.message || err.message;
    if (err.response && err.response.data && err.response.data.message) {
      mpErrorDetails = err.response.data.message;
      if (err.response.data.cause) {
        mpErrorDetails += ` - Causa: ${JSON.stringify(err.response.data.cause)}`;
      }
    }

    return res.status(500).json({
      error: 'Erro interno ao criar preferência de pagamento para a loja.',
      details: mpErrorDetails,
    });
  }
});
