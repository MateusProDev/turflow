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

const AppContent = () => {
  const [user, setUser] = useState(null);
  const [hasStore, setHasStore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customDomainChecked, setCustomDomainChecked] = useState(false);
  const [customDomainLoja, setCustomDomainLoja] = useState(null);
  const auth = getAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const customDomainRedirected = useRef(false);

  useEffect(() => {
    console.log("[DEBUG] AppContent: Iniciando verificação de autenticação...");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        console.log("[DEBUG] AppContent: Usuário autenticado:", currentUser.uid);
        // Verifica plano do usuário
        await verificarPlanoUsuario(currentUser.uid);

        // Verifica se o usuário tem uma loja
        const [userSnap, storeSnap] = await Promise.all([
          getDoc(doc(db, 'usuarios', currentUser.uid)),
          getDoc(doc(db, 'lojas', currentUser.uid))
        ]);

        const userData = userSnap.exists() ? userSnap.data() : {};
        const storeExists = storeSnap.exists();

        // Define se o usuário tem loja criada
        setHasStore(!!(userData.storeCreated || storeExists));
        console.log("[DEBUG] AppContent: hasStore =", !!(userData.storeCreated || storeExists));
      } else {
        setHasStore(false);
        console.log("[DEBUG] AppContent: Usuário não autenticado");
      }

      setLoading(false);
    });

    // Limpa a assinatura
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const host = window.location.host;
    const isCustomDomain =
      !host.endsWith("vercel.app") &&
      !host.includes("localhost") &&
      !host.includes("127.0.0.1") &&
      !host.endsWith("onrender.com");

    console.log("[DEBUG] AppContent: host =", host, "isCustomDomain =", isCustomDomain);

    if (isCustomDomain) {
      fetch("/public/loja")
        .then(async (res) => {
          if (!res.ok) throw new Error("Loja não encontrada para este domínio.");
          return res.json();
        })
        .then((data) => {
          if (data && data.lojaId && data.loja) {
            setCustomDomainLoja({ lojaId: data.lojaId, loja: data.loja });
          }
          setCustomDomainChecked(true);
        })
        .catch((err) => {
          setCustomDomainChecked(true);
        });
    } else {
      setCustomDomainChecked(true);
    }
  }, []); // Executa só uma vez ao montar

  // Mostra um spinner enquanto verifica o status de autenticação
  if (loading) {
    console.log("[DEBUG] AppContent: loading...");
    return <Spinner />;
  }

  // Mostra mensagem amigável se domínio customizado não encontrado
  if (!customDomainChecked) {
    console.log("[DEBUG] AppContent: customDomainChecked = false, aguardando verificação...");
    return <Spinner />;
  }
  const host = typeof window !== "undefined" ? window.location.host : "";
  const isCustomDomain =
    !host.endsWith("vercel.app") &&
    !host.includes("localhost") &&
    !host.includes("onrender.com");

  // Renderização das rotas customizadas
  if (isCustomDomain) {
    if (!customDomainChecked || !customDomainLoja) {
      return <Spinner />;
    }
    return <CustomDomainRouter lojaId={customDomainLoja.lojaId} lojaData={customDomainLoja.loja} />;
  }

  // Rotas harmonizadas para ambos os domínios
  return (
    <UserPlanProvider>
      <Routes location={location}>
        <Route path="/" element={<LojinhaPage />} />
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
          element={
            <LojinhaPage />
          }
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
    </UserPlanProvider>
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