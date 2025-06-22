// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useState, useEffect } from "react";
import { db } from './firebaseConfig';
import { Spinner } from 'react-bootstrap';
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

// Utils
import { verificarPlanoUsuario } from './utils/verificarPlanoUsuario';

// Context
import { CategoriasProvider } from "./context/CategoriasContext";
import { UserPlanProvider } from "./context/UserPlanContext"; // Import the UserPlanProvider

// Componente de rota protegida
const ProtectedRoute = ({ user, children }) => {
  return user ? children : <Navigate to="/login" replace />;
};

// Rota que requer loja criada
const StoreRequiredRoute = ({ user, hasStore, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return hasStore ? children : <Navigate to="/criar-loja" replace />;
};

function LojinhaPage() {
  const { slug } = useParams();
  const [lojaId, setLojaId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!slug) return;
    async function fetchLojaId() {
      const q = query(collection(db, "lojas"), where("slug", "==", slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLojaId(snap.docs[0].id);
      }
      setLoading(false);
    }
    fetchLojaId();
  }, [slug]);

  if (loading) return <div>Carregando loja...</div>;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  return <Lojinha lojaId={lojaId} />;
}

// Wrapper para garantir lojaId em CategoriaPage
function CategoriaPageWrapper() {
  const { slug, categoria } = useParams();
  const [lojaId, setLojaId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!slug) return;
    async function fetchLojaId() {
      const q = query(collection(db, "lojas"), where("slug", "==", slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLojaId(snap.docs[0].id);
      }
      setLoading(false);
    }
    fetchLojaId();
  }, [slug]);

  if (loading) return <div>Carregando categoria...</div>;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  return <CategoriaPage lojaId={lojaId} />;
}

// Wrapper para garantir lojaId em ProdutoPage
function ProdutoPageWrapper() {
  const { slug, produtoSlug } = useParams();
  const [lojaId, setLojaId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!slug) return;
    async function fetchLojaId() {
      const q = query(collection(db, "lojas"), where("slug", "==", slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLojaId(snap.docs[0].id);
      }
      setLoading(false);
    }
    fetchLojaId();
  }, [slug]);

  if (loading) return <div>Carregando pacote...</div>;
  if (!lojaId) return <div>Loja não encontrada.</div>;
  return <ProdutoPage lojaId={lojaId} />;
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

    if (isCustomDomain && !customDomainChecked) {
      console.log("[DEBUG] AppContent: Buscando loja para domínio customizado...");
      fetch("/public/loja")
        .then(async (res) => {
          console.log("[DEBUG] /public/loja status:", res.status);
          if (!res.ok) throw new Error("Loja não encontrada para este domínio.");
          return res.json();
        })
        .then((data) => {
          console.log("[DEBUG] /public/loja data:", data);
          if (data && data.lojaId && data.loja) {
            setCustomDomainLoja({ lojaId: data.lojaId, loja: data.loja });
          }
          setCustomDomainChecked(true);
        })
        .catch((err) => {
          console.log("[DEBUG] /public/loja erro:", err);
          setCustomDomainChecked(true);
        });
    } else {
      setCustomDomainChecked(true);
    }
  }, [customDomainChecked]);

  // Mostra um spinner enquanto verifica o status de autenticação
  if (loading) {
    console.log("[DEBUG] AppContent: loading...");
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </div>
    );
  }

  // Mostra mensagem amigável se domínio customizado não encontrado
  if (!customDomainChecked) {
    console.log("[DEBUG] AppContent: customDomainChecked = false, aguardando verificação...");
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </div>
    );
  }
  if (
    typeof window !== "undefined" &&
    !window.location.host.endsWith("vercel.app") &&
    !window.location.host.includes("localhost") &&
    !window.location.host.includes("onrender.com")
  ) {
    if (!customDomainChecked) {
      return <div style={{textAlign:'center',marginTop:80}}><h2>Carregando loja...</h2></div>;
    }
    if (!customDomainLoja || !customDomainLoja.lojaId || !customDomainLoja.loja) {
      return <div style={{textAlign:'center',marginTop:80,color:'red'}}><h2>Loja não encontrada ou fora do ar.</h2></div>;
    }
    console.log('[DEBUG] AppContent: Renderizando rotas customizadas com', customDomainLoja);
    return (
      <Routes>
        <Route path="/" element={
          <Lojinha
            lojaId={customDomainLoja.lojaId}
            lojaData={customDomainLoja.loja}
            logoUrl={customDomainLoja.loja.logoUrl}
          />
        } />
        <Route path="/categoria/:categoria" element={
          <CategoriaPage
            lojaId={customDomainLoja.lojaId}
            lojaData={customDomainLoja.loja}
          />
        } />
        <Route path="/pacote/:produtoSlug" element={
          <ProdutoPage
            lojaId={customDomainLoja.lojaId}
            lojaData={customDomainLoja.loja}
          />
        } />
        {/* ...outras rotas */}
      </Routes>
    );
  }

  return (
    <UserPlanProvider>
      <Routes location={location}>
        {/* Rota especial: se domínio customizado e loja encontrada, renderiza a loja na raiz */}
        {customDomainLoja && (
          <Route path="/" element={<Lojinha lojaId={customDomainLoja.lojaId} lojaData={customDomainLoja.loja} />} />
        )}

        {/* Rotas públicas */}
        <Route path="/" element={<HomePage />} />

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