import { collection, onSnapshot, query, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Garanta que este caminho está correto
import React, { useEffect, useState, useRef } from "react";
import NavBar from "./NavBar/NavBar";
import SideMenu from "./SideMenu/SideMenu";
import Cart from "./Cart/Cart";
import ProductSection from "./ProductSection/ProductSection";
import Footer from "./Footer/Footer"; // Importa o Footer
import Banner from "./Banner/Banner";
import "./Lojinha.css";
import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios'; // <-- ADICIONADO
import { CircularProgress, Box, Typography, Button } from '@mui/material'; // <-- ADICIONADO

// <-- ADICIONADO: URL DO SEU BACKEND (MUITO IMPORTANTE!)
const API_BASE_URL = 'https://storesync.onrender.com'; // **ATENÇÃO: Use a URL correta do seu backend na Render!**

// Função Debounce (pode ser movida para um arquivo utilitário se preferir)
function debounce(func, delay) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    }; 
    clearTimeout(timeout);
    timeout = setTimeout(later, delay);
  };
}

const Lojinha = ({
  lojaId,
  lojaData,
  logoUrl,
  menuItems = [],
}) => {
  console.log('[DEBUG] Lojinha: props recebidas', { lojaId, lojaData, logoUrl, menuItems });
  const [cart, setCart] = useState(() => {
    // Tenta carregar o carrinho do localStorage ao iniciar (Corrigido para usar lojaId)
    const saved = localStorage.getItem(`lojinha_cart_${lojaId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [imgCategorias, setImgCategorias] = useState([]);
  const [produtosPorCategoria, setProdutosPorCategoria] = useState({});
  const [nomeLoja, setNomeLoja] = useState("Sua Loja"); // Valor padrão
  const [bannerImages, setBannerImages] = useState([]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [exibirLogo, setExibirLogo] = useState(true);
  const [logoUrlState, setLogoUrlState] = useState(logoUrl || "");
  const navigate = useNavigate();
  const { slug } = useParams(); // Pega o 'slug' da URL (se estiver usando)
  const [storeData, setStoreData] = useState(lojaData || null);
  const [loading, setLoading] = useState(!lojaData);
  const [error, setError] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  // Sincroniza todos os estados principais ao receber lojaData (domínio customizado)
  useEffect(() => {
    if (lojaData) {
      console.log('[DEBUG] Lojinha: lojaData recebido via props', lojaData);
      setStoreData(lojaData);
      setNomeLoja(lojaData.nome || "Minha Loja");
      setLogoUrlState(lojaData.logoUrl || "");
      setExibirLogo(lojaData.exibirLogo !== false);
      setCategorias(Array.isArray(lojaData.categorias) ? lojaData.categorias : []);
      setImgCategorias(Array.isArray(lojaData.imgcategorias) ? lojaData.imgcategorias : []);
      setBannerImages(
        Array.isArray(lojaData.bannerImages)
          ? lojaData.bannerImages.filter(Boolean)
          : typeof lojaData.bannerImages === 'object'
            ? Object.values(lojaData.bannerImages).filter(Boolean)
            : []
      );
      setLoading(false);
    }
  }, [lojaData]);

  // Efeito para buscar dados iniciais da loja (apenas se NÃO veio lojaData)
  useEffect(() => {
    if (lojaData) return;
    if (!lojaId) {
      console.log('[DEBUG] Lojinha: lojaId ausente, não buscará dados');
      return;
    }
    setLoading(true);
    setError(null);
    async function fetchStoreData() {
      console.log('[DEBUG] Lojinha: Buscando dados da loja pelo lojaId', lojaId);
      try {
        const lojaRef = doc(db, "lojas", lojaId);
        const lojaSnap = await getDoc(lojaRef);
        if (lojaSnap.exists()) {
          const lojaData = lojaSnap.data();
          setStoreData(lojaData);
          setNomeLoja(lojaData.nome || "Minha Loja");
          setLogoUrlState(lojaData.logoUrl || "");
          setExibirLogo(lojaData.exibirLogo !== false);
          setCategorias(Array.isArray(lojaData.categorias) ? lojaData.categorias : []);
          setImgCategorias(Array.isArray(lojaData.imgcategorias) ? lojaData.imgcategorias : []);
          setBannerImages(
            Array.isArray(lojaData.bannerImages)
              ? lojaData.bannerImages.filter(Boolean)
              : typeof lojaData.bannerImages === 'object'
                ? Object.values(lojaData.bannerImages).filter(Boolean)
                : []
          );
        } else {
          setError("Loja não encontrada.");
        }
      } catch (error) {
        setError("Erro ao carregar dados da loja.");
      } finally {
        setLoading(false);
      }
    }
    fetchStoreData();
  }, [lojaId, lojaData]);

  // Efeito para ouvir produtos em tempo real E extrair categorias dinamicamente
  useEffect(() => {
    if (!lojaId) {
      console.log('[DEBUG] Lojinha: lojaId ausente, não buscará produtos');
      return;
    }
    console.log('[DEBUG] Lojinha: Buscando produtos para lojaId =', lojaId);

    const q = query(collection(db, `lojas/${lojaId}/produtos`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('[DEBUG] Lojinha: Produtos recebidos do Firestore', snapshot.docs.map(d => d.data()));
      const produtos = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      // Log para depuração
      console.log("[DEBUG] Lojinha: Produtos encontrados:", produtos);

      // Filtra e ordena produtos
      const produtosAtivos = produtos.filter(p => p.ativo !== false);
      const produtosOrdenados = [...produtosAtivos].sort((a, b) => {
        if (a.prioridade === true && (b.prioridade !== true)) return -1;
        if ((a.prioridade !== true) && b.prioridade === true) return 1;
        return 0;
      });

      // Agrupa produtos por categoria
      const agrupados = {};
      produtosOrdenados.forEach(prod => {
        const cat = prod.category || "Outros";
        if (!agrupados[cat]) agrupados[cat] = [];
        agrupados[cat].push(prod);
      });
      setProdutosPorCategoria(agrupados);

      // Extrai categorias dinamicamente dos produtos
      const categoriasDinamicas = Array.from(new Set(produtosAtivos.map(p => p.category || "Outros")));
      setCategorias(categoriasDinamicas);
    }, (error) => {
      console.error('[DEBUG] Lojinha: Erro ao buscar produtos', error);
    });

    return () => unsubscribe();
  }, [lojaId]); // <-- Certifique-se que depende de lojaId

  // Efeito para persistir o carrinho no localStorage
  useEffect(() => {
    localStorage.setItem(`lojinha_cart_${lojaId}`, JSON.stringify(cart)); // Corrigido para usar lojaId
  }, [cart, lojaId]); // Adicionado lojaId

  // Funções de toggle para menu e carrinho
  const handleMenuToggle = () => {
    setSideMenuOpen(prev => !prev);
    if (cartOpen) setCartOpen(false);
  };
  const handleSideMenuClose = () => setSideMenuOpen(false);
  const handleCartToggle = () => {
    setCartOpen(prev => !prev);
    if (sideMenuOpen) setSideMenuOpen(false);
  };

  // Funções de manipulação do carrinho
  const handleAddToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, qtd: (item.qtd || 0) + 1 } : item
        );
      }
      return [...prevCart, { ...product, qtd: 1 }];
    });
    // setCartOpen(true); // Descomente se quiser abrir o carrinho ao adicionar
  };
  const handleRemoveItemFromCartCompletely = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };
  const handleIncrement = (productId) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, qtd: (item.qtd || 0) + 1 } : item
      )
    );
  };
  const handleDecrement = (productId) => {
    setCart(prevCart =>
      prevCart
        .map(item =>
          item.id === productId ? { ...item, qtd: Math.max(0, (item.qtd || 0) - 1) } : item
        )
        .filter(item => item.qtd > 0) // Remove se a quantidade for 0
    );
  };

  // <-- ADICIONADO: Função para chamar o backend e iniciar checkout MP -->
  const handleCheckoutMercadoPago = async () => {
    if (!storeData?.enableMpCheckout) {
      alert("Desculpe, esta loja não está aceitando pagamentos via Mercado Pago no momento.");
      return;
    }
    setLoadingCheckout(true);
    setCheckoutError(null);
    setCartOpen(false); // Fecha o carrinho

    try {
      const response = await axios.post(`${API_BASE_URL}/api/create-store-preference`, {
        storeId: lojaId,
        items: cart.map(item => ({
          id: item.id,
          title: item.name, // Use 'name' ou 'nome', dependendo do seu DB
          quantity: item.qtd,
          unit_price: item.price,
          currency_id: 'BRL',
        })),
      });

      const { init_point } = response.data;
      if (init_point) {
        window.location.href = init_point; // Redireciona!
      } else {
        setCheckoutError("Não foi possível iniciar o checkout. Tente novamente.");
        setLoadingCheckout(false); // Só para aqui se der erro mas não redirecionar
      }
    } catch (err) {
      console.error("Erro ao criar preferência MP:", err);
      setCheckoutError(`Erro ao iniciar pagamento: ${err.response?.data?.error || err.message}`);
      setLoadingCheckout(false);
    }
  };
  // <-- FIM ADIÇÃO -->

  // Função de checkout antiga (mantida para referência ou WPP)
  const handleCheckout = () => {
      console.log("Prosseguindo para checkout (WPP ou outro):", cart);
      setCartOpen(false);
      // Aqui você abriria seu modal do WhatsApp, por exemplo.
  };

  // Cálculos do carrinho
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * (item.qtd || 0)), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + (item.qtd || 0), 0);

  // Função para obter sugestões de busca
  const getSuggestions = (input) => {
    if (!input || input.trim() === "") return [];
    const inputLower = input.toLowerCase().trim();
    const catSuggestions = categorias
      .filter(cat => (cat.nome || cat).toLowerCase().includes(inputLower))
      .map(cat => ({
        type: "categoria",
        value: cat.id || cat.nome || cat,
        label: cat.nome || cat
      }));
    let prodSuggestions = [];
    Object.entries(produtosPorCategoria).forEach(([catId, prods]) => {
      prods.forEach(prod => {
        if (prod.name && prod.name.toLowerCase().includes(inputLower)) {
          prodSuggestions.push({
            type: "produto",
            value: prod.id,
            label: prod.name,
            categoria: catId
          });
        }
      });
    });
    const uniqueProdSuggestions = Array.from(new Map(prodSuggestions.map(item => [item.value, item])).values());
    return [...catSuggestions, ...uniqueProdSuggestions].slice(0, 10);
  };

  // Debounce para a busca
  const debouncedSetSearch = useRef(
    debounce(newVal => {
      const suggestions = getSuggestions(newVal);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    }, 300)
  ).current;

  // Handler para mudança no input de busca
  const handleSearchChange = e => {
    const val = e.target.value;
    setSearch(val);
    debouncedSetSearch(val);
  };

  // Função para lidar com clique na sugestão
  const handleSuggestionClick = (suggestion) => {
    setShowSuggestions(false);
    setSearch(suggestion.label);
    // Lógica de navegação ou filtro
    if (suggestion.type === 'categoria') {
        const element = document.getElementById(`category-title-${suggestion.value}`);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (suggestion.type === 'produto') {
       // Poderia rolar para o produto ou abrir um modal
    }
  };

  // Função para renderizar os produtos (normal ou busca)
  const renderProducts = () => {
    const searchTermLower = search.trim().toLowerCase();
    if (!searchTermLower) {
      return categorias.map(cat => {
        const nome = typeof cat === "string" ? cat : cat.nome;
        const key = (typeof cat === 'object' && cat.id) ? cat.id : nome;
        const produtos = produtosPorCategoria[nome] || [];
        return produtos.length > 0 ? (
          <ProductSection
            key={key}
            id={`category-title-${key}`}
            title={nome}
            products={produtos}
            onAddToCart={handleAddToCart}
            navigate={navigate}
            // Passe imgCategorias para ProductSection se quiser mostrar imagem da categoria
            imgCategoria={imgCategorias.find(c => c.nome === nome)?.imagem || ""}
          />
        ) : null;
      });
    }

    let foundSomething = false;
    const searchResults = categorias.map(cat => {
      const nome = typeof cat === "string" ? cat : cat.nome;
      const key = (typeof cat === 'object' && cat.id) ? cat.id : nome;
      const produtosFiltrados = (produtosPorCategoria[nome] || [])
        .filter(prod => prod.name && prod.name.toLowerCase().includes(searchTermLower));
      const categoryMatches = nome.toLowerCase().includes(searchTermLower);

      if (produtosFiltrados.length > 0 || categoryMatches) {
        foundSomething = true;
        const productsToShow = categoryMatches ? (produtosPorCategoria[nome] || []) : produtosFiltrados;
        return productsToShow.length > 0 ? (
          <ProductSection
            key={key}
            id={`category-title-${key}`}
            title={nome}
            products={productsToShow}
            onAddToCart={handleAddToCart}
            navigate={navigate}
          />
        ) : null;
      }
      return null;
    }).filter(Boolean);

    return foundSomething ? searchResults : (
      <div className="lojinha-no-results">
        Nenhum produto ou categoria encontrada para "{search}".
      </div>
    );
  };

  // Exibe loading ou erro se necessário
  if (loading) {
    console.log('[DEBUG] Lojinha: loading...');
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }
  if (error) {
    console.error('[DEBUG] Lojinha: erro detectado', error);
    return <Box sx={{ textAlign: 'center', mt: 5 }}><Typography color="error">{error}</Typography></Box>;
  }


  return (
    <div className="lojinha-container">
      {console.log('[DEBUG] Lojinha: Renderizando, categorias:', categorias, 'produtosPorCategoria:', produtosPorCategoria)}
      <NavBar
        logoUrl={logoUrlState}
        nomeLoja={nomeLoja}
        exibirLogo={exibirLogo}
        onMenuClick={handleMenuToggle}
        onCartClick={handleCartToggle}
        cartCount={cartItemCount}
      />

      {/* SideMenu com Overlay */}
      {sideMenuOpen && (
        <>
          <div className="overlay" onClick={handleSideMenuClose}></div>
          <SideMenu
            open={sideMenuOpen}
            menuItems={menuItems}
            onClose={handleSideMenuClose}
          />
        </>
      )}

      {/* Cart com Overlay */}
      {cartOpen && (
        <>
          <div className="overlay" onClick={handleCartToggle}></div>
          <Cart
            items={cart}
            onRemoveItemCompletely={handleRemoveItemFromCartCompletely}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onCheckout={handleCheckout} // Mantido para WPP ou outro
            open={cartOpen}
            onClose={handleCartToggle}
            // userPlan={storeData?.plano || "free"} // Removido se não usado no Cart
            whatsappNumber={storeData?.whatsappNumber || ""}
            // **** AQUI ESTÁ A MUDANÇA ****
            onCheckoutTransparent={handleCheckoutMercadoPago} // <-- USA A NOVA FUNÇÃO!
            // **** FIM DA MUDANÇA ****
            enableWhatsappCheckout={storeData?.enableWhatsappCheckout ?? true}
            enableMpCheckout={storeData?.enableMpCheckout ?? false}
            cartTotal={cartTotal}
          />
        </>
      )}

      {/* Banner */}
      {bannerImages?.length > 0 && (
        <div className="lojinha-banner-wrapper">
          <Banner banners={
            bannerImages.map(b =>
              typeof b === "string"
                ? b
                : b?.url || "" // Suporte para ambos formatos
            ).filter(Boolean)
          } />
        </div>
      )}

      {/* Barra de Busca */}
      <div className="lojinha-search-container">
        <input
          type="search"
          className="lojinha-pesquisa-input"
          placeholder="Pesquisar pacote ou localidade..."
          value={search}
          onChange={handleSearchChange}
          onFocus={() => search.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
          aria-label="Pesquisar produtos ou categorias"
        /> 
        <span className="lojinha-search-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        {showSuggestions && suggestions.length > 0 && (
          <ul className="lojinha-suggestions-list" role="listbox">
            {suggestions.map((s, idx) => (
              <li
                key={s.value + idx}
                className="lojinha-suggestion-item"
                role="option"
                aria-selected={false}
                onMouseDown={() => handleSuggestionClick(s)}
              >
                <span className="lojinha-suggestion-type">
                  {s.type === "categoria" ? "Categoria" : "Produto"}:
                </span>
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Categorias */}
      {categorias.length > 0 && (
        <div className="lojinha-categorias-scroll-wrapper">
          <div className="lojinha-categorias-scroll">
            {categorias.map(cat => {
              const nome = typeof cat === "string" ? cat : cat.nome;
              const key = (typeof cat === 'object' && cat.id) ? cat.id : nome;
              // Busca a imagem da categoria pelo nome
              const imgCat = imgCategorias.find(c => c.nome === nome);
              return (
                <button
                  key={key}
                  className="lojinha-categoria-btn"
                  onClick={() => {
                    // Detecta domínio customizado
                    const isCustomDomain =
                      typeof window !== 'undefined' &&
                      !window.location.host.endsWith('vercel.app') &&
                      !window.location.host.includes('localhost') &&
                      !window.location.host.includes('onrender.com');
                    if (isCustomDomain) {
                      navigate(`/categoria/${encodeURIComponent(nome.toLowerCase())}`);
                    } else {
                      navigate(`/${slug}/categoria/${encodeURIComponent(nome.toLowerCase())}`);
                    }
                  }}
                  title={`Ver categoria ${nome}`}
                >
                  <img
                    src={imgCat?.imagem || "/placeholder-categoria.jpg"}
                    alt={nome}
                    className="lojinha-categoria-icone"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder-categoria.jpg";
                    }}
                    loading="lazy"
                  />
                  <span className="lojinha-categoria-nome">{nome}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      

      {/* Conteúdo Principal (Produtos) */}
      <main className="lojinha-main">
          {renderProducts()}
      </main>

      {/* <-- ADICIONADO: Feedback visual para o checkout --> */}
      {loadingCheckout && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
              <Box sx={{ p: 3, background: 'white', borderRadius: 2, textAlign: 'center' }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Aguarde, redirecionando para o pagamento seguro...</Typography>
              </Box>
          </div>
      )}
      {checkoutError && (
           <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'red', color: 'white', padding: '10px 20px', borderRadius: '5px', zIndex: 9998, textAlign: 'center' }}>
               Erro: {checkoutError}
               <Button onClick={() => setCheckoutError(null)} sx={{ ml: 2, color: 'white', minWidth: 'auto', p: '2px' }}>X</Button>
           </div>
      )}
      {/* <-- FIM ADIÇÃO --> */}

      {/* Footer */}
      <Footer
        nomeLoja={nomeLoja}
        footerData={{
          descricao: storeData?.footer?.descricao || "",
          social: {
            instagram: storeData?.footer?.instagram || "",
            facebook: storeData?.footer?.facebook || "",
            twitter: storeData?.footer?.twitter || "",
            youtube: storeData?.footer?.youtube || ""
          },
          extras: storeData?.footer?.extras || []
        }}
        showSocial={true}
        showExtras={true}
      />
    </div>
  );
};

export default Lojinha;