import React, { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProductSection.css";

const SkeletonCard = () => (
  <div className="lojinha-product-card skeleton">
    <div className="lojinha-product-img skeleton-img" />
    <div className="lojinha-product-title skeleton-line" />
    <div className="lojinha-product-price skeleton-line" />
    <div className="lojinha-product-actions skeleton-btn" />
  </div>
);

const ProductSection = ({ title, products, onAddToCart, categoriaId, loading }) => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const carouselRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Drag mouse
  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
  };
  const handleMouseLeave = () => { isDragging.current = false; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Drag touch
  const handleTouchStart = (e) => {
    isDragging.current = true;
    startX.current = e.touches[0].pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
  };
  const handleTouchEnd = () => { isDragging.current = false; };
  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Badge de desconto
  const getDiscount = (price, anchorPrice) => {
    if (!anchorPrice || !price) return 0;
    return Math.round(((anchorPrice - price) / anchorPrice) * 100);
  };

  // Mostra até 5 produtos, depois "Ver mais"
  const showProducts = products ? products.slice(0, 5) : [];

  return (
    <section className="lojinha-product-section">
      <div className="lojinha-product-section-header">
        <h2>{title}</h2>
        {products && products.length > 5 && (
          <button
            className="lojinha-ver-mais-btn"
            onClick={() => navigate(`/${slug}/categoria/${encodeURIComponent(categoriaId || title)}`)}
          >
            Ver mais &rarr;
          </button>
        )}
      </div>
      <div
        className="lojinha-products-carousel"
        ref={carouselRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : showProducts.map((prod) => {
              const desconto = getDiscount(prod.price, prod.anchorPrice);
              return (
                <div key={prod.id} className="lojinha-product-card">
                  {desconto > 0 && (
                    <span className="lojinha-product-desconto">{desconto}% OFF</span>
                  )}
                  <img
                    src={prod.imagem || prod.image || prod.img || "/placeholder-produto.jpg"}
                    alt={prod.name}
                    className="product-image"
                    onClick={() => navigate(`/${slug}/produto/${prod.slug}`)}
                    onError={e => { e.target.onerror = null; e.target.src = "/placeholder-produto.jpg"; }}
                    loading="lazy"
                  />
                  <h3 className="lojinha-product-title">{prod.name}</h3>
                  <p>A partir de:</p>
                  <div className="lojinha-product-price">
                    {prod.anchorPrice && (
                      <span className="lojinha-product-original-price">
                        R$ {Number(prod.anchorPrice).toFixed(2)}
                      </span>
                    )}
                    R$ {Number(prod.price).toFixed(2)}
                  </div>
                  <div className="lojinha-product-actions">
                    <button
                      className="lojinha-view-details-btn"
                      onClick={() => navigate(`/${slug}/produto/${prod.slug}`)}
                    >
                      Mais Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
};

export default ProductSection;