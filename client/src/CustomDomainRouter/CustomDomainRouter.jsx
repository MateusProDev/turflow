import React, { Suspense, lazy, memo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import ErrorBoundary from "../components/ErrorBoundary";

// Lazy loading dos componentes para melhor performance
const Lojinha = lazy(() => import("../components/Lojinha/Lojinha"));
const CategoriaPage = lazy(() => import("../components/Lojinha/CategoriaPage/CategoriaPage"));
const ProdutoPage = lazy(() => import("../components/Lojinha/ProdutoPage/ProdutoPage"));

const CustomDomainRouter = memo(({ lojaId, lojaData }) => {
  // Validação rápida dos dados necessários
  if (!lojaId || !lojaData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2>Erro de Configuração</h2>
        <p>Dados da loja não foram carregados corretamente.</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Recarregar
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackMessage="Erro ao carregar a loja. Tente recarregar a página.">
      <Suspense fallback={<Spinner height="100vh" message="Carregando loja..." />}>
        <Routes>
          <Route 
            path="/" 
            element={
              <Lojinha 
                lojaId={lojaId} 
                lojaData={lojaData} 
                logoUrl={lojaData.logoUrl} 
              />
            } 
          />
          <Route 
            path="/categoria/:categoria" 
            element={
              <CategoriaPage 
                lojaId={lojaId} 
                lojaData={lojaData} 
              />
            } 
          />
          <Route 
            path="/pacote/:produtoSlug" 
            element={
              <ProdutoPage 
                lojaId={lojaId} 
                lojaData={lojaData} 
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
});

CustomDomainRouter.displayName = 'CustomDomainRouter';

export default CustomDomainRouter;