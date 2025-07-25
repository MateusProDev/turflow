import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

// Cache local para evitar múltiplas consultas
const lojaCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

export function useLojaContext(propLojaId, propLojaData) {
  const { slug } = useParams();
  const [lojaId, setLojaId] = useState(propLojaId || null);
  const [lojaData, setLojaData] = useState(propLojaData || null);
  const [loading, setLoading] = useState(!propLojaId);

  // Memoriza se é domínio customizado para evitar recálculos
  const isCustomDomain = useMemo(() => {
    if (typeof window === "undefined") return false;
    const host = window.location.host;
    return !host.endsWith("vercel.app") && 
           !host.includes("localhost") && 
           !host.includes("onrender.com") &&
           !host.includes("127.0.0.1");
  }, []);

  useEffect(() => {
    // Se já temos os dados necessários, não precisa buscar
    if (propLojaId && propLojaData) {
      setLojaId(propLojaId);
      setLojaData(propLojaData);
      setLoading(false);
      return;
    }

    // Se é domínio customizado e temos propLojaData, usar diretamente
    if (isCustomDomain && propLojaData) {
      setLojaId(propLojaData.id || propLojaId);
      setLojaData(propLojaData);
      setLoading(false);
      return;
    }

    // Se não é domínio customizado e não temos slug, não buscar
    if (!isCustomDomain && !slug) {
      setLoading(false);
      return;
    }

    async function fetchLoja() {
      const cacheKey = `loja_${slug || 'custom'}`;
      const cached = lojaCache.get(cacheKey);
      
      // Verifica cache primeiro
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setLojaId(cached.data.id);
        setLojaData(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        if (!isCustomDomain && slug) {
          const lojaQuery = query(collection(db, "lojas"), where("slug", "==", slug));
          const lojaSnap = await getDocs(lojaQuery);
          
          if (!lojaSnap.empty) {
            const data = { id: lojaSnap.docs[0].id, ...lojaSnap.docs[0].data() };
            
            // Armazena no cache
            lojaCache.set(cacheKey, {
              data,
              timestamp: Date.now()
            });
            
            setLojaId(data.id);
            setLojaData(data);
          } else {
            console.warn(`Loja não encontrada para slug: ${slug}`);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar loja:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLoja();
  }, [propLojaId, propLojaData, slug, isCustomDomain]);

  return { lojaId, lojaData, loading };
}
