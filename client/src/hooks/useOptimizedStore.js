import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { storeCache, productCache } from '../utils/cacheManager';

export const useOptimizedStore = (lojaId, initialData = null) => {
  const [storeData, setStoreData] = useState(initialData);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  // Função para buscar dados da loja
  const fetchStoreData = useCallback(async () => {
    if (!lojaId) return;

    // Verifica cache primeiro
    const cached = storeCache.get(lojaId);
    if (cached) {
      setStoreData(cached);
      setLoading(false);
      return cached;
    }

    try {
      setLoading(true);
      setError(null);

      const lojaRef = doc(db, 'lojas', lojaId);
      const lojaSnap = await getDoc(lojaRef);

      if (lojaSnap.exists()) {
        const data = { id: lojaSnap.id, ...lojaSnap.data() };
        
        // Salva no cache
        storeCache.set(lojaId, data);
        setStoreData(data);
        return data;
      } else {
        throw new Error('Loja não encontrada');
      }
    } catch (err) {
      console.error('Erro ao buscar dados da loja:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lojaId]);

  // Função para configurar listener de produtos
  const setupProductsListener = useCallback(() => {
    if (!lojaId) return;

    // Limpa listener anterior se existir
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Verifica cache de produtos primeiro
    const cachedProducts = productCache.get(lojaId);
    if (cachedProducts) {
      setProducts(cachedProducts);
    }

    const q = query(collection(db, `lojas/${lojaId}/produtos`));
    
    unsubscribeRef.current = onSnapshot(q, 
      (snapshot) => {
        try {
          const produtosList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Filtra e organiza produtos
          const produtosAtivos = produtosList.filter(p => p.ativo !== false);
          const produtosOrdenados = produtosAtivos.sort((a, b) => {
            if (a.prioridade === true && b.prioridade !== true) return -1;
            if (a.prioridade !== true && b.prioridade === true) return 1;
            return 0;
          });

          // Agrupa por categoria
          const produtosPorCategoria = produtosOrdenados.reduce((acc, produto) => {
            const categoria = produto.categoria || 'Sem Categoria';
            if (!acc[categoria]) acc[categoria] = [];
            acc[categoria].push(produto);
            return acc;
          }, {});

          setProducts(produtosPorCategoria);
          
          // Salva no cache
          productCache.set(lojaId, produtosPorCategoria);
        } catch (err) {
          console.error('Erro ao processar produtos:', err);
        }
      },
      (error) => {
        console.error('Erro no listener de produtos:', error);
        setError('Erro ao carregar produtos');
      }
    );
  }, [lojaId]);

  // Efeito para inicializar dados
  useEffect(() => {
    if (initialData) {
      setStoreData(initialData);
      storeCache.set(lojaId, initialData);
      setLoading(false);
    } else {
      fetchStoreData();
    }
  }, [lojaId, initialData, fetchStoreData]);

  // Efeito para configurar listener de produtos
  useEffect(() => {
    if (lojaId && storeData) {
      setupProductsListener();
    }

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [lojaId, storeData, setupProductsListener]);

  // Função para refrescar dados
  const refresh = useCallback(() => {
    storeCache.delete(lojaId);
    productCache.delete(lojaId);
    fetchStoreData();
  }, [lojaId, fetchStoreData]);

  // Função para atualizar cache quando dados mudam
  const updateStoreData = useCallback((newData) => {
    setStoreData(newData);
    storeCache.set(lojaId, newData);
  }, [lojaId]);

  return {
    storeData,
    products,
    loading,
    error,
    refresh,
    updateStoreData,
    // Estados calculados
    categories: storeData?.categorias || [],
    bannerImages: storeData?.bannerImages || [],
    logoUrl: storeData?.logoUrl,
    storeName: storeData?.nome || 'Minha Loja',
    totalProducts: Object.values(products).flat().length
  };
};

export default useOptimizedStore;
