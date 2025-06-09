import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
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

const CategoriaPage = () => {
  const { slug, categoria } = useParams();
  const [lojaId, setLojaId] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const carouselRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Função para calcular o desconto
  const getDiscount = (price, anchorPrice) => {
    if (!anchorPrice || !price) return 0;
    return Math.round(((anchorPrice - price) / anchorPrice) * 100);
  };

  useEffect(() => {
    async function fetchLojaIdAndProdutos() {
      setLoading(true);
      try {
        // Busca a loja pelo slug
        const lojaQuery = query(collection(db, "lojas"), where("slug", "==", slug));
        const lojaSnap = await getDocs(lojaQuery);
        
        if (!lojaSnap.empty) {
          const lojaId = lojaSnap.docs[0].id;
          setLojaId(lojaId);

          // Busca produtos da categoria (case insensitive)
          const produtosRef = collection(db, `lojas/${lojaId}/produtos`);
          const produtosQuery = query(
            produtosRef,
            where("category", "==", "Camisas"), // Teste com valor fixo primeiro
            where("ativo", "==", true)
          );

          console.log("Executando query:", produtosQuery); // Debug

          const produtosSnap = await getDocs(produtosQuery);
          console.log("Produtos encontrados:", produtosSnap.docs.length); // Debug

          const produtosData = produtosSnap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Converte strings numéricas para números
              price: parseFloat(data.price) || 0,
              anchorPrice: data.anchorPrice ? parseFloat(data.anchorPrice) : null
            };
          });

          console.log("Produtos processados:", produtosData); // Debug

          // Ordenação
          const produtosOrdenados = produtosData.sort((a, b) => {
            if (a.prioridade && !b.prioridade) return -1;
            if (!a.prioridade && b.prioridade) return 1;
            return 0;
          });

          setProdutos(produtosOrdenados);
        } else {
          console.error("Loja não encontrada");
        }
      } catch (error) {
        console.error("Erro completo:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLojaIdAndProdutos();
  }, [slug, categoria]);

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

  return (
    <div className="categoria-page-container">
      <h1 className="categoria-titulo">Categoria: {categoria}</h1>
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
                  <button className="categoria-produto-btn">Adicionar ao carrinho</button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default CategoriaPage;