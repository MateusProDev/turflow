import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useLojaContext } from "../../../hooks/useLojaContext";
import "./CategoriaPage.css";

const SkeletonCard = () => (
  <div className="categoria-produto-card skeleton">
    <div className="categoria-produto-img skeleton-img" />
    <div className="categoria-produto-nome skeleton-line" />
    <div className="categoria-produto-preco skeleton-line" />
    <div className="categoria-produto-btn skeleton-btn" />
  </div>
);

const CategoriaPage = (props) => {
  const { categoria } = useParams();
  const navigate = useNavigate();
  const { lojaId, lojaData, loading: lojaLoading } = useLojaContext(props.lojaId, props.lojaData);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categorias, setCategorias] = useState([]);
  const carouselRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    if (!lojaId || !lojaData) {
      navigate("/", { replace: true });
    }
  }, [lojaId, lojaData, navigate]);

  useEffect(() => {
    if (!lojaId) return;
    async function fetchProdutos() {
      setLoading(true);
      const produtosRef = collection(db, `lojas/${lojaId}/produtos`);
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
      const categoriasUnicas = Array.from(new Set(produtosData.map(p => (p.category || "").trim()).filter(Boolean)));
      setCategorias(categoriasUnicas);
      const produtosFiltrados = produtosData.filter(p => (p.category || "").toLowerCase() === (categoria || "").toLowerCase());
      setProdutos(produtosFiltrados);
      setLoading(false);
    }
    fetchProdutos();
  }, [lojaId, categoria]);

  if (lojaLoading || loading) return <div style={{textAlign:'center',marginTop:80}}><h2>Carregando dados da loja...</h2></div>;
  if (!lojaId || !lojaData) return <div style={{textAlign:'center',marginTop:80}}><h2>Loja não encontrada.</h2></div>;

  return (
    <div className="categoria-page-container">
      <h1 className="categoria-titulo">Categoria: {categoria}</h1>
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
          onMouseDown={e => { isDragging.current = true; startX.current = e.pageX - carouselRef.current.offsetLeft; scrollLeft.current = carouselRef.current.scrollLeft; }}
          onMouseLeave={() => { isDragging.current = false; }}
          onMouseUp={() => { isDragging.current = false; }}
          onMouseMove={e => {
            if (!isDragging.current) return;
            e.preventDefault();
            const x = e.pageX - carouselRef.current.offsetLeft;
            const walk = (x - startX.current) * 1.2;
            carouselRef.current.scrollLeft = scrollLeft.current - walk;
          }}
          onTouchStart={e => { isDragging.current = true; startX.current = e.touches[0].pageX - carouselRef.current.offsetLeft; scrollLeft.current = carouselRef.current.scrollLeft; }}
          onTouchEnd={() => { isDragging.current = false; }}
          onTouchMove={e => {
            if (!isDragging.current) return;
            const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
            const walk = (x - startX.current) * 1.2;
            carouselRef.current.scrollLeft = scrollLeft.current - walk;
          }}
        >
          {produtos
            .filter(produto => produto.name.toLowerCase().includes(search.toLowerCase()))
            .map(produto => (
              <div className="categoria-produto-card" key={produto.id}>
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
            ))}
        </div>
      )}
    </div>
  );
};

export default CategoriaPage;