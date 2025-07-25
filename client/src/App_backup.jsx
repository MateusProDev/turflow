// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useState, useEffect } from "react";
import { db } from './firebaseConfig';
import Spinner from "./components/Spinner";
import '@fortawesome/fontawesome-free/css/all.min.css'; 
import { useRef } from "react";

// Components
import HomePage from './components/HomePage/HomePage';
import AuthForm from './components/AuthForm/AuthForm';
import CreateStore from './components/CreateStore/CreateStore';
import Dashboard from './components/Dashboard/Dashboard';
import CheckoutRedirect from './components/CheckoutRedirect/CheckoutRedirect';
import CheckoutTransparent from './components/CheckoutTransparent/CheckoutTransparent';
import Lojinha from './components/Lojinha/Lojinha';
import LojinhaPreview from './components/LojinhaPreview/LojinhaPreview';
import CategoriaPage from "./components/Lojinha/CategoriaPage/CategoriaPage";
import ProdutoPage from "./components/Lojinha/ProdutoPage/ProdutoPage";
import ProdutosPage from "./pages/ProdutosPage";
import CustomDomainRouter from "./CustomDomainRouter/CustomDomainRouter";

// Utils
import { verificarPlanoUsuario } from './utils/verificarPlanoUsuario';

// Context
import { CategoriasProvider } from "./context/CategoriasContext";
import { UserPlanProvider } from "./context/UserPlanContext"; // Import the UserPlanProvider
import { useLojaContext } from "./hooks/useLojaContext";

// Componente de rota protegida
const ProtectedRoute = ({ user, children }) => {
  return user ? children : <Navigate to="/login" replace />;
};

// Rota que requer loja criada
const StoreRequiredRoute = ({ user, hasStore, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return hasStore ? children : <Navigate to="/criar-loja" replace />;
};

// Wrapper para garantir lojaId e lojaData em CategoriaPage
function CategoriaPageWrapper() {
  const { lojaId, lojaData, loading } = useLojaContext();
  if (loading) return <Spinner />;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  return <CategoriaPage lojaId={lojaId} lojaData={lojaData} />;
}

// Wrapper para garantir lojaId e lojaData em ProdutoPage
function ProdutoPageWrapper() {
  const { lojaId, lojaData, loading } = useLojaContext();
  if (loading) return <Spinner />;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  return <ProdutoPage lojaId={lojaId} lojaData={lojaData} />;
}

// Wrapper para garantir lojaId e lojaData em Lojinha
function LojinhaPage() {
  const { lojaId, lojaData, loading } = useLojaContext();
  if (loading) return <div>Carregando loja...</div>;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  return <Lojinha lojaId={lojaId} lojaData={lojaData} />;
}

// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo } from "react";
import { db } from './firebaseConfig';
import Spinner from "./components/Spinner";
import '@fortawesome/fontawesome-free/css/all.min.css'; 
import { getLojaByCustomDomain } from './utils/getLojaByCustomDomain';

// Components
import HomePage from './components/HomePage/HomePage';
import AuthForm from './components/AuthForm/AuthForm';
import CreateStore from './components/CreateStore/CreateStore';
import Dashboard from './components/Dashboard/Dashboard';
import CheckoutRedirect from './components/CheckoutRedirect/CheckoutRedirect';
import CheckoutTransparent from './components/CheckoutTransparent/CheckoutTransparent';
import Lojinha from './components/Lojinha/Lojinha';
import LojinhaPreview from './components/LojinhaPreview/LojinhaPreview';
import CategoriaPage from "./components/Lojinha/CategoriaPage/CategoriaPage";
import ProdutoPage from "./components/Lojinha/ProdutoPage/ProdutoPage";
import ProdutosPage from "./pages/ProdutosPage";
import CustomDomainRouter from "./CustomDomainRouter/CustomDomainRouter";

// Utils
import { verificarPlanoUsuario } from './utils/verificarPlanoUsuario';

// Context
import { CategoriasProvider } from "./context/CategoriasContext";
import { UserPlanProvider } from "./context/UserPlanContext";
import { useLojaContext } from "./hooks/useLojaContext";

// Componente de rota protegida
const ProtectedRoute = ({ user, children }) => {
  return user ? children : <Navigate to="/login" replace />;
};

// Rota que requer loja criada
const StoreRequiredRoute = ({ user, hasStore, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return hasStore ? children : <Navigate to="/criar-loja" replace />;
};

// Wrapper para garantir lojaId e lojaData em CategoriaPage
function CategoriaPageWrapper() {
  const { lojaId, lojaData, loading } = useLojaContext();
  if (loading) return <Spinner />;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  return <CategoriaPage lojaId={lojaId} lojaData={lojaData} />;
}

// Wrapper para garantir lojaId e lojaData em ProdutoPage
function ProdutoPageWrapper() {
  const { lojaId, lojaData, loading } = useLojaContext();
  if (loading) return <Spinner />;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  return <ProdutoPage lojaId={lojaId} lojaData={lojaData} />;
}

// Wrapper para garantir lojaId e lojaData em Lojinha
function LojinhaPage() {
  const { lojaId, lojaData, loading } = useLojaContext();
  if (loading) return <div>Carregando loja...</div>;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  return <Lojinha lojaId={lojaId} lojaData={lojaData} />;
}

// Hook para detectar domínio customizado
function useCustomDomain() {
  return useMemo(() => {
    if (typeof window === "undefined") return { isCustomDomain: false, host: "" };
    
    const host = window.location.host;
    const isCustomDomain = !host.endsWith("vercel.app") && 
                          !host.includes("localhost") && 
                          !host.includes("127.0.0.1") && 
                          !host.endsWith("onrender.com");
    
    return { isCustomDomain, host };
  }, []);
}

const AppContent = () => {
  const [user, setUser] = useState(null);
  const [hasStore, setHasStore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customDomainLoja, setCustomDomainLoja] = useState(null);
  const [customDomainLoading, setCustomDomainLoading] = useState(false);
  const [customDomainError, setCustomDomainError] = useState(null);
  
  const auth = getAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isCustomDomain, host } = useCustomDomain();

  // Verificação de autenticação - otimizada
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // Executa verificações em paralelo
          const [userDoc, storeDoc] = await Promise.all([
            getDoc(doc(db, 'usuarios', currentUser.uid)),
            getDoc(doc(db, 'lojas', currentUser.uid)),
            verificarPlanoUsuario(currentUser.uid) // Não bloqueia o fluxo
          ]);

          const userData = userDoc.exists() ? userDoc.data() : {};
          const storeExists = storeDoc.exists();

          setHasStore(!!(userData.storeCreated || storeExists));
        } catch (error) {
          console.error("Erro ao verificar dados do usuário:", error);
          setHasStore(false);
        }
      } else {
        setHasStore(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

// App.js
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo } from "react";
import { db } from './firebaseConfig';
import Spinner from "./components/Spinner";
import ErrorBoundary from "./components/ErrorBoundary";
import '@fortawesome/fontawesome-free/css/all.min.css'; 
import { getLojaByCustomDomain } from './utils/getLojaByCustomDomain';

// Lazy loading dos componentes principais
const HomePage = lazy(() => import('./components/HomePage/HomePage'));
const AuthForm = lazy(() => import('./components/AuthForm/AuthForm'));
const CreateStore = lazy(() => import('./components/CreateStore/CreateStore'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const CheckoutRedirect = lazy(() => import('./components/CheckoutRedirect/CheckoutRedirect'));
const CheckoutTransparent = lazy(() => import('./components/CheckoutTransparent/CheckoutTransparent'));
const Lojinha = lazy(() => import('./components/Lojinha/Lojinha'));
const LojinhaPreview = lazy(() => import('./components/LojinhaPreview/LojinhaPreview'));
const CategoriaPage = lazy(() => import("./components/Lojinha/CategoriaPage/CategoriaPage"));
const ProdutoPage = lazy(() => import("./components/Lojinha/ProdutoPage/ProdutoPage"));
const ProdutosPage = lazy(() => import("./pages/ProdutosPage"));
const CustomDomainRouter = lazy(() => import("./CustomDomainRouter/CustomDomainRouter"));

// Utils
import { verificarPlanoUsuario } from './utils/verificarPlanoUsuario';

// Context
import { CategoriasProvider } from "./context/CategoriasContext";
import { UserPlanProvider } from "./context/UserPlanContext";
import { useLojaContext } from "./hooks/useLojaContext";

// Componente de rota protegida
const ProtectedRoute = ({ user, children }) => {
  return user ? children : <Navigate to="/login" replace />;
};

// Rota que requer loja criada
const StoreRequiredRoute = ({ user, hasStore, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return hasStore ? children : <Navigate to="/criar-loja" replace />;
};

// Wrapper otimizado para CategoriaPage
function CategoriaPageWrapper() {
  const { lojaId, lojaData, loading } = useLojaContext();
  
  if (loading) return <Spinner message="Carregando categoria..." />;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  
  return (
    <ErrorBoundary fallbackMessage="Erro ao carregar categoria">
      <CategoriaPage lojaId={lojaId} lojaData={lojaData} />
    </ErrorBoundary>
  );
}

// Wrapper otimizado para ProdutoPage
function ProdutoPageWrapper() {
  const { lojaId, lojaData, loading } = useLojaContext();
  
  if (loading) return <Spinner message="Carregando produto..." />;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  
  return (
    <ErrorBoundary fallbackMessage="Erro ao carregar produto">
      <ProdutoPage lojaId={lojaId} lojaData={lojaData} />
    </ErrorBoundary>
  );
}

// Wrapper otimizado para Lojinha
function LojinhaPage() {
  const { lojaId, lojaData, loading } = useLojaContext();
  
  if (loading) return <Spinner message="Carregando loja..." />;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  
  return (
    <ErrorBoundary fallbackMessage="Erro ao carregar loja">
      <Lojinha lojaId={lojaId} lojaData={lojaData} />
    </ErrorBoundary>
  );
}

// Hook otimizado para detectar domínio customizado
function useCustomDomain() {
  return useMemo(() => {
    if (typeof window === "undefined") return { isCustomDomain: false, host: "" };
    
    const host = window.location.host;
    const isCustomDomain = !host.endsWith("vercel.app") && 
                          !host.includes("localhost") && 
                          !host.includes("127.0.0.1") && 
                          !host.endsWith("onrender.com");
    
    return { isCustomDomain, host };
  }, []);
}

const AppContent = () => {
  const [user, setUser] = useState(null);
  const [hasStore, setHasStore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customDomainLoja, setCustomDomainLoja] = useState(null);
  const [customDomainLoading, setCustomDomainLoading] = useState(false);
  const [customDomainError, setCustomDomainError] = useState(null);
  
  const auth = getAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isCustomDomain, host } = useCustomDomain();

  // Verificação de autenticação - otimizada
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // Executa verificações em paralelo
          const [userDoc, storeDoc] = await Promise.all([
            getDoc(doc(db, 'usuarios', currentUser.uid)),
            getDoc(doc(db, 'lojas', currentUser.uid)),
            verificarPlanoUsuario(currentUser.uid) // Não bloqueia o fluxo
          ]);

          const userData = userDoc.exists() ? userDoc.data() : {};
          const storeExists = storeDoc.exists();

          setHasStore(!!(userData.storeCreated || storeExists));
        } catch (error) {
          console.error("Erro ao verificar dados do usuário:", error);
          setHasStore(false);
        }
      } else {
        setHasStore(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // Verificação de domínio customizado - otimizada e não bloqueante
  useEffect(() => {
    if (!isCustomDomain) return;

    setCustomDomainLoading(true);
    setCustomDomainError(null);

    // Busca de forma assíncrona sem bloquear a UI
    getLojaByCustomDomain(host)
      .then((data) => {
        if (data && data.lojaId && data.loja) {
          setCustomDomainLoja({ lojaId: data.lojaId, loja: data.loja });
        } else {
          setCustomDomainError("Loja não encontrada para este domínio.");
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar loja por domínio customizado:", error);
        setCustomDomainError(error.message);
      })
      .finally(() => {
        setCustomDomainLoading(false);
      });
  }, [isCustomDomain, host]);

  // Loading principal (autenticação)
  if (loading) {
    return <Spinner height="100vh" message="Inicializando aplicação..." />;
  }

  // Renderização para domínios customizados
  if (isCustomDomain) {
    if (customDomainLoading) {
      return <Spinner height="100vh" message="Carregando loja..." />;
    }
    
    if (customDomainError || !customDomainLoja) {
      return (
        <ErrorBoundary>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: '20px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <h2>Loja não encontrada</h2>
            <p>{customDomainError || "Esta loja não existe ou não está configurada corretamente."}</p>
            <button 
              onClick={() => window.location.href = 'https://turflow.vercel.app'}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Ir para TurFlow
            </button>
          </div>
        </ErrorBoundary>
      );
    }
    
    return (
      <Suspense fallback={<Spinner height="100vh" message="Carregando loja..." />}>
        <CustomDomainRouter lojaId={customDomainLoja.lojaId} lojaData={customDomainLoja.loja} />
      </Suspense>
    );
  }

  // Rotas principais para domínios não customizados
  return (
    <ErrorBoundary fallbackMessage="Erro na aplicação. Tente recarregar a página.">
      <UserPlanProvider>
        <Suspense fallback={<Spinner height="100vh" message="Carregando..." />}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/categoria/:categoria" element={<CategoriaPageWrapper />} />
            <Route path="/pacote/:produtoSlug" element={<ProdutoPageWrapper />} />

            {/* Rotas de autenticação */}
            <Route
              path="/login"
              element={
                !user ? (
                  <AuthForm
                    initialMode="login"
                    onLoginSuccess={() => navigate(hasStore ? '/dashboard' : '/criar-loja', { replace: true })}
                  />
                ) : (
                  <Navigate to={hasStore ? '/dashboard' : '/criar-loja'} replace />
                )
              }
            />
            <Route
              path="/signup"
              element={
                !user ? (
                  <AuthForm
                    initialMode="signup"
                    onLoginSuccess={() => navigate(hasStore ? '/dashboard' : '/criar-loja', { replace: true })}
                  />
                ) : (
                  <Navigate to={hasStore ? '/dashboard' : '/criar-loja'} replace />
                )
              }
            />
            {/* Mantém /auth para compatibilidade com versões anteriores */}
            <Route
              path="/auth"
              element={
                !user ? (
                  <AuthForm
                    initialMode={location.state?.authMode || 'login'}
                    onLoginSuccess={() => navigate(hasStore ? '/dashboard' : '/criar-loja', { replace: true })}
                  />
                ) : (
                  <Navigate to={hasStore ? '/dashboard' : '/criar-loja'} replace />
                )
              }
            />

            {/* Loja do usuário */}
            <Route
              path="/:slug"
              element={<LojinhaPage />}
            />
            <Route path="/:slug/categoria/:categoria" element={<CategoriaPageWrapper />} />
            <Route path="/:slug/produto/:produtoSlug" element={<ProdutoPageWrapper />} />

            {/* Rotas protegidas que requerem apenas autenticação */}
            <Route
              path="/criar-loja"
              element={
                <ProtectedRoute user={user}>
                  <CreateStore onStoreCreated={() => setHasStore(true)} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute user={user}>
                  <CheckoutRedirect currentUser={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upgrade"
              element={
                <ProtectedRoute user={user}>
                  <CheckoutTransparent currentUser={user} />
                </ProtectedRoute>
              }
            />

            {/* Rotas protegidas que requerem autenticação e uma loja */}
            <Route
              path="/dashboard"
              element={
                <StoreRequiredRoute user={user} hasStore={hasStore}>
                  <CategoriasProvider lojaId={user?.uid}>
                    <Dashboard user={user} />
                  </CategoriasProvider>
                </StoreRequiredRoute>
              }
            />
            <Route
              path="/minha-loja"
              element={
                <StoreRequiredRoute user={user} hasStore={hasStore}>
                  <LojinhaPreview user={user} />
                </StoreRequiredRoute>
              }
            />
            <Route
              path="/dashboard/produtos"
              element={
                <StoreRequiredRoute user={user} hasStore={hasStore}>
                  <ProdutosPage lojaId={user?.uid} />
                </StoreRequiredRoute>
              }
            />

            {/* Rota para todos os outros casos */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </UserPlanProvider>
    </ErrorBoundary>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;