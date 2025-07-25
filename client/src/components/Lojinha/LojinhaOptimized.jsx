import { collection, onSnapshot, query, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import NavBar from "./NavBar/NavBar";
import SideMenu from "./SideMenu/SideMenu";
import Cart from "./Cart/Cart";
import ProductSection from "./ProductSection/ProductSection";
import Footer from "./Footer/Footer";
import Banner from "./Banner/Banner";
import "./Lojinha.css";
import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import { CircularProgress, Box, Typography, Button } from '@mui/material';

// URL do backend
const API_BASE_URL = 'https://storesync.onrender.com';

// Cache local para melhorar performance
const storeDataCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

// Função Debounce otimizada
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

const Lojinha = ({
  lojaId,
  lojaData,
  logoUrl,
  menuItems = [],
}) => {
  console.log('[DEBUG] Lojinha: props recebidas', { lojaId, lojaData, logoUrl, menuItems });
  
  // States essenciais
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(`lojinha_cart_${lojaId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [imgCategorias, setImgCategorias] = useState([]);
  const [produtosPorCategoria, setProdutosPorCategoria] = useState({});
  const [nomeLoja, setNomeLoja] = useState("Sua Loja");
  const [bannerImages, setBannerImages] = useState([]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [exibirLogo, setExibirLogo] = useState(true);
  const [logoUrlState, setLogoUrlState] = useState(logoUrl || "");
  const [storeData, setStoreData] = useState(lojaData || null);
  const [loading, setLoading] = useState(!lojaData);
  const [error, setError] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  
  const navigate = useNavigate();
  const { slug } = useParams();

  // Memoização para evitar recálculos desnecessários
  const isDataComplete = useMemo(() => {
    return !!(lojaId && (lojaData || storeData));
  }, [lojaId, lojaData, storeData]);

  // Função otimizada para buscar dados da loja
  const fetchStoreData = useCallback(async () => {
    if (!lojaId) return;

    const cacheKey = `store_${lojaId}`;
    const cached = storeDataCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      const data = cached.data;
      setStoreData(data);
      setNomeLoja(data.nome || "Minha Loja");
      setLogoUrlState(data.logoUrl || "");
      setExibirLogo(data.exibirLogo !== false);
      setCategorias(Array.isArray(data.categorias) ? data.categorias : []);
      setImgCategorias(Array.isArray(data.imgcategorias) ? data.imgcategorias : []);
      setBannerImages(
        Array.isArray(data.bannerImages)
          ? data.bannerImages.filter(Boolean)
          : typeof data.bannerImages === 'object'
            ? Object.values(data.bannerImages).filter(Boolean)
            : []
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const lojaRef = doc(db, "lojas", lojaId);
      const lojaSnap = await getDoc(lojaRef);
      
      if (lojaSnap.exists()) {
        const data = lojaSnap.data();
        
        // Armazena no cache
        storeDataCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        setStoreData(data);
        setNomeLoja(data.nome || "Minha Loja");
        setLogoUrlState(data.logoUrl || "");
        setExibirLogo(data.exibirLogo !== false);
        setCategorias(Array.isArray(data.categorias) ? data.categorias : []);
        setImgCategorias(Array.isArray(data.imgcategorias) ? data.imgcategorias : []);
        setBannerImages(
          Array.isArray(data.bannerImages)
            ? data.bannerImages.filter(Boolean)
            : typeof data.bannerImages === 'object'
              ? Object.values(data.bannerImages).filter(Boolean)
              : []
        );
      } else {
        setError("Loja não encontrada.");
      }
    } catch (error) {
      console.error("Erro ao carregar dados da loja:", error);
      setError("Erro ao carregar dados da loja.");
    } finally {
      setLoading(false);
    }
  }, [lojaId]);

  // Efeito para inicializar dados da loja
  useEffect(() => {
    if (lojaData) {
      // Se já temos dados via props, usar diretamente
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
    } else {
      // Buscar dados se não foram fornecidos
      fetchStoreData();
    }
  }, [lojaData, fetchStoreData]);

  // Efeito otimizado para produtos com debounce e cache
  useEffect(() => {
    if (!lojaId) {
      console.log('[DEBUG] Lojinha: lojaId ausente, não buscará produtos');
      return;
    }

    console.log('[DEBUG] Lojinha: Configurando listener de produtos para lojaId =', lojaId);

    const q = query(collection(db, `lojas/${lojaId}/produtos`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const produtos = snapshot.docs.map(docSnap => ({ 
          id: docSnap.id, 
          ...docSnap.data() 
        }));

        console.log("[DEBUG] Lojinha: Produtos encontrados:", produtos.length);

        // Filtra e ordena produtos de forma otimizada
        const produtosAtivos = produtos.filter(p => p.ativo !== false);
        const produtosOrdenados = produtosAtivos.sort((a, b) => {
          if (a.prioridade === true && b.prioridade !== true) return -1;
          if (a.prioridade !== true && b.prioridade === true) return 1;
          return 0;
        });

        // Agrupa produtos por categoria usando Map para melhor performance
        const agrupados = new Map();
        const categoriasEncontradas = new Set();

        produtosOrdenados.forEach(produto => {
          const categoria = produto.categoria || "Sem Categoria";
          categoriasEncontradas.add(categoria);
          
          if (!agrupados.has(categoria)) {
            agrupados.set(categoria, []);
          }
          agrupados.get(categoria).push(produto);
        });

        // Converte Map para objeto
        const produtosPorCategoriaObj = Object.fromEntries(agrupados);
        setProdutosPorCategoria(produtosPorCategoriaObj);

        // Atualiza categorias dinâmicas apenas se necessário
        const categoriasArray = Array.from(categoriasEncontradas);
        if (JSON.stringify(categoriasArray) !== JSON.stringify(categorias)) {
          setCategorias(prevCategorias => {
            // Mantém categorias configuradas manualmente
            const categoriasConfiguradas = prevCategorias.filter(cat => 
              typeof cat === 'string' ? categoriasArray.includes(cat) : true
            );
            
            // Adiciona novas categorias encontradas
            const novasCategorias = categoriasArray.filter(cat => 
              !categoriasConfiguradas.some(existente => 
                typeof existente === 'string' ? existente === cat : existente.nome === cat
              )
            );
            
            return [...categoriasConfiguradas, ...novasCategorias];
          });
        }
      } catch (error) {
        console.error("Erro ao processar produtos:", error);
      }
    }, (error) => {
      console.error("Erro no listener de produtos:", error);
    });

    return () => unsubscribe();
  }, [lojaId]); // Remove categorias da dependência para evitar loops

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      if (!searchTerm.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const allProducts = Object.values(produtosPorCategoria).flat();
      const filtered = allProducts.filter(produto =>
        produto.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5); // Limita a 5 sugestões

      setSuggestions(filtered);
      setShowSuggestions(true);
    }, 300),
    [produtosPorCategoria]
  );

  useEffect(() => {
    debouncedSearch(search);
  }, [search, debouncedSearch]);

  // Resto das funções... (continuarei na próxima parte)
  
  // Função para salvar carrinho no localStorage
  useEffect(() => {
    if (lojaId && cart.length >= 0) {
      try {
        localStorage.setItem(`lojinha_cart_${lojaId}`, JSON.stringify(cart));
      } catch (error) {
        console.warn("Erro ao salvar carrinho no localStorage:", error);
      }
    }
  }, [cart, lojaId]);

  const addToCart = useCallback((produto) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.id === produto.id);
      
      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantidade: newCart[existingItemIndex].quantidade + 1
        };
        return newCart;
      } else {
        return [...prevCart, { ...produto, quantidade: 1 }];
      }
    });
  }, []);

  const removeFromCart = useCallback((produtoId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== produtoId));
  }, []);

  const updateQuantity = useCallback((produtoId, quantidade) => {
    if (quantidade <= 0) {
      removeFromCart(produtoId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === produtoId ? { ...item, quantidade } : item
      )
    );
  }, [removeFromCart]);

  const getTotalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantidade, 0);
  }, [cart]);

  const getTotalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  }, [cart]);

  // Loading state
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6">Carregando loja...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <Typography variant="h5" color="error">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  return (
    <div className="lojinha">
      {/* NavBar */}
      <NavBar
        nomeLoja={nomeLoja}
        exibirLogo={exibirLogo}
        logoUrl={logoUrlState}
        onMenuClick={() => setSideMenuOpen(true)}
        onCartClick={() => setCartOpen(true)}
        cartItemCount={getTotalItems}
        search={search}
        setSearch={setSearch}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        produtosPorCategoria={produtosPorCategoria}
      />

      {/* Banner */}
      {bannerImages.length > 0 && (
        <Banner images={bannerImages} />
      )}

      {/* SideMenu */}
      <SideMenu
        isOpen={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        categorias={categorias}
        imgCategorias={imgCategorias}
        nomeLoja={nomeLoja}
        exibirLogo={exibirLogo}
        logoUrl={logoUrlState}
      />

      {/* Cart */}
      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateQuantity}
        totalPrice={getTotalPrice}
        lojaId={lojaId}
        storeData={storeData}
        setLoadingCheckout={setLoadingCheckout}
        setCheckoutError={setCheckoutError}
      />

      {/* Product Section */}
      <ProductSection
        produtosPorCategoria={produtosPorCategoria}
        onAddToCart={addToCart}
        categorias={categorias}
        imgCategorias={imgCategorias}
        search={search}
      />

      {/* Footer */}
      <Footer storeData={storeData} />

      {/* Loading Checkout Overlay */}
      {loadingCheckout && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgcolor="rgba(0,0,0,0.7)"
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={9999}
          flexDirection="column"
          gap={2}
        >
          <CircularProgress size={60} style={{ color: 'white' }} />
          <Typography variant="h6" style={{ color: 'white' }}>
            Processando pagamento...
          </Typography>
        </Box>
      )}

      {/* Checkout Error */}
      {checkoutError && (
        <Box
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bgcolor="white"
          p={3}
          borderRadius={2}
          boxShadow={3}
          zIndex={10000}
          maxWidth="400px"
          width="90%"
        >
          <Typography variant="h6" color="error" gutterBottom>
            Erro no Checkout
          </Typography>
          <Typography variant="body2" gutterBottom>
            {checkoutError}
          </Typography>
          <Button
            variant="contained"
            onClick={() => setCheckoutError(null)}
            fullWidth
            style={{ marginTop: 16 }}
          >
            Fechar
          </Button>
        </Box>
      )}
    </div>
  );
};

export default Lojinha;
