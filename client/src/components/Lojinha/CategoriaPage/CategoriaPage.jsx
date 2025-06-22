import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./CategoriaPage.css";

const SkeletonCard = () => (
  <div className="categoria-produto-card skeleton">
    <div className="categoria-produto-img skeleton-img" />
    <div className="categoria-produto-nome skeleton-line" />
    <div className="categoria-produto-preco skeleton-line" />
    <div className="categoria-produto-btn skeleton-btn" />
  </div>
);

const CategoriaPage = ({ lojaId: propLojaId, lojaData }) => {
  console.log('[DEBUG] CategoriaPage: props recebidas', { propLojaId, lojaData });
  const { slug, categoria } = useParams();
  const [lojaId, setLojaId] = useState(propLojaId || null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categorias, setCategorias] = useState([]);

  const carouselRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const navigate = useNavigate();

  // Função para calcular o desconto
  const getDiscount = (price, anchorPrice) => {
    if (!anchorPrice || !price) return 0;
    return Math.round(((anchorPrice - price) / anchorPrice) * 100);
  };

  useEffect(() => {
    async function ensureLojaIdAndFetchProdutos() {
      setLoading(true);
      let finalLojaId = propLojaId;
      const isCustomDomain =
        typeof window !== 'undefined' &&
        !window.location.host.endsWith('vercel.app') &&
        !window.location.host.includes('localhost') &&
        !window.location.host.includes('onrender.com');
      try {
        if (isCustomDomain) {
          if (!finalLojaId && lojaData && lojaData.id) {
            finalLojaId = lojaData.id;
          }
        } else {
          if (!finalLojaId && slug) {
            console.log('[DEBUG] CategoriaPage: Buscando lojaId pelo slug', slug);
            const lojaQuery = query(collection(db, "lojas"), where("slug", "==", slug));
            const lojaSnap = await getDocs(lojaQuery);
            if (!lojaSnap.empty) {
              finalLojaId = lojaSnap.docs[0].id;
              console.log('[DEBUG] CategoriaPage: lojaId encontrado', finalLojaId);
            } else {
              console.log('[DEBUG] CategoriaPage: Nenhuma loja encontrada para slug', slug);
            }
          }
        }
        if (!finalLojaId) {
          setLoading(false);
          setProdutos([]);
          setCategorias([]);
          console.log('[DEBUG] CategoriaPage: lojaId não encontrado, abortando fetch');
          return;
        }
        setLojaId(finalLojaId);
        const produtosRef = collection(db, `lojas/${finalLojaId}/produtos`);
        const produtosQuery = query(produtosRef, where("ativo", "==", true));
        const produtosSnap = await getDocs(produtosQuery);
        const produtosData = produtosSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            price: parseFloat(data.price) || 0,
            anchorPrice: data.anchorPrice ? parseFloat(data.anchorPrice) : null
          };
        });
        console.log('[DEBUG] CategoriaPage: Produtos recebidos', produtosData);
        const categoriasUnicas = Array.from(new Set(produtosData.map(p => (p.category || "").trim()).filter(Boolean)));
        setCategorias(categoriasUnicas);
        const produtosFiltrados = produtosData.filter(p => (p.category || "").toLowerCase() === (categoria || "").toLowerCase());
        const produtosOrdenados = produtosFiltrados.sort((a, b) => {
          if (a.prioridade && !b.prioridade) return -1;
          if (!a.prioridade && b.prioridade) return 1;
          return 0;
        });
        setProdutos(produtosOrdenados);
        console.log('[DEBUG] CategoriaPage: Produtos filtrados para categoria', categoria, produtosOrdenados);
      } catch (error) {
        setProdutos([]);
        setCategorias([]);
        console.error('[DEBUG] CategoriaPage: Erro ao buscar produtos/categorias', error);
      } finally {
        setLoading(false);
      }
    }
    if (categoria) {
      ensureLojaIdAndFetchProdutos();
    }
  }, [slug, categoria, propLojaId, lojaData]);

  // Funções de drag para carrossel
  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
  };

  const handleMouseLeave = () => { 
    isDragging.current = false; 
  };

  const handleMouseUp = () => { 
    isDragging.current = false; 
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Touch events
  const handleTouchStart = (e) => {
    isDragging.current = true;
    startX.current = e.touches[0].pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
  };

  const handleTouchEnd = () => { 
    isDragging.current = false; 
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  if (!propLojaId || !lojaData) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'70vh'}}>
        <div className="spinner" style={{width:60,height:60,border:'6px solid #eee',borderTop:'6px solid #1976d2',borderRadius:'50%',animation:'spin 1s linear infinite'}} />
        <style>{`@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  return (
    <div className="categoria-page-container">
      {console.log('[DEBUG] CategoriaPage: Renderizando produtos', produtos)}
      <h1 className="categoria-titulo">Categoria: {categoria}</h1>
      {/* Lista de categorias disponíveis */}
      {categorias.length > 0 && (
        <div className="categoria-lista-categorias">
          <span>Categorias: </span>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => navigate(`/categoria/${encodeURIComponent(cat)}`)}
              className={`categoria-link${cat.toLowerCase() === (categoria || '').toLowerCase() ? ' ativa' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      <input
        type="text"
        className="categoria-pesquisa-input"
        placeholder="Pesquisar produto nesta categoria..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      
      {loading ? (
        <div className="categoria-produtos-carousel">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : produtos.length === 0 ? (
        <div className="categoria-sem-produtos">
          Nenhum produto encontrado nesta categoria.
        </div>
      ) : (
        <div
          className="categoria-produtos-carousel"
          ref={carouselRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          {produtos
            .filter(produto => 
              produto.name.toLowerCase().includes(search.toLowerCase())
            )
            .map(produto => {
              const desconto = getDiscount(produto.price, produto.anchorPrice);
              return (
                <div className="categoria-produto-card" key={produto.id}>
                  {desconto > 0 && (
                    <span className="categoria-produto-desconto">{desconto}% OFF</span>
                  )}
                  <img
                    src={produto.images?.[0] || "/placeholder-product.jpg"}
                    alt={produto.name}
                    className="categoria-produto-img"
                  />
                  <div className="categoria-produto-nome">{produto.name}</div>
                  <div className="categoria-produto-preco">
                    {produto.anchorPrice && (
                      <span className="categoria-produto-preco-antigo">
                        R$ {Number(produto.anchorPrice).toFixed(2)}
                      </span>
                    )}
                    R$ {Number(produto.price).toFixed(2)}
                  </div>
                  <button
                    className="categoria-produto-btn categoria-produto-btn-detalhes"
                    onClick={() => navigate(`/pacote/${produto.slug}`)}
                  >
                    Ver detalhes
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default CategoriaPage;