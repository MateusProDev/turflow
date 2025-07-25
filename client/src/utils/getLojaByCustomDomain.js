// Cache para evitar múltiplas requisições
const domainCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function getLojaByCustomDomain(customDomain, apiBaseUrl = "https://storesync.onrender.com") {
  // Verifica cache primeiro
  const cacheKey = `${customDomain}_${apiBaseUrl}`;
  const cached = domainCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const url = `${apiBaseUrl}/public/loja`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300' // 5 minutos de cache
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Loja não encontrada para este domínio.`);
    }
    
    const data = await response.json();
    
    // Armazena no cache
    domainCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error("Timeout: A requisição demorou muito para responder.");
    }
    throw new Error(err.message || "Erro ao buscar loja pelo domínio customizado.");
  }
}

// Limpa cache expirado periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of domainCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      domainCache.delete(key);
    }
  }
}, CACHE_DURATION);
