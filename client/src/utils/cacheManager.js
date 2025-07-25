// Sistema de cache otimizado para o projeto
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // Máximo de 100 entradas
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos
    
    // Limpa cache expirado a cada 2 minutos
    setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }

  set(key, value, ttl = this.defaultTTL) {
    // Remove entrada mais antiga se exceder tamanho máximo
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Verifica se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instância global do cache
export const cacheManager = new CacheManager();

// Cache específico para dados de loja
export const storeCache = {
  set: (lojaId, data) => cacheManager.set(`store_${lojaId}`, data, 5 * 60 * 1000),
  get: (lojaId) => cacheManager.get(`store_${lojaId}`),
  delete: (lojaId) => cacheManager.delete(`store_${lojaId}`)
};

// Cache específico para produtos
export const productCache = {
  set: (lojaId, products) => cacheManager.set(`products_${lojaId}`, products, 3 * 60 * 1000),
  get: (lojaId) => cacheManager.get(`products_${lojaId}`),
  delete: (lojaId) => cacheManager.delete(`products_${lojaId}`)
};

// Cache para domínios customizados
export const domainCache = {
  set: (domain, data) => cacheManager.set(`domain_${domain}`, data, 10 * 60 * 1000),
  get: (domain) => cacheManager.get(`domain_${domain}`),
  delete: (domain) => cacheManager.delete(`domain_${domain}`)
};

export default cacheManager;
