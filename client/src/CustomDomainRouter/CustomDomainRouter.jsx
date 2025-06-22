// src/CustomDomainRouter/CustomDomainRouter.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Lojinha from "../components/Lojinha/Lojinha";
import CategoriaPage from "../components/Lojinha/CategoriaPage/CategoriaPage";
import ProdutoPage from "../components/Lojinha/ProdutoPage/ProdutoPage";

const CustomDomainRouter = ({ lojaId, lojaData }) => {
  return (
    <Routes>
      <Route path="/" element={<Lojinha lojaId={lojaId} lojaData={lojaData} logoUrl={lojaData.logoUrl} />} />
      <Route path="/categoria/:categoria" element={<CategoriaPage lojaId={lojaId} lojaData={lojaData} />} />
      <Route path="/pacote/:produtoSlug" element={<ProdutoPage lojaId={lojaId} lojaData={lojaData} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default CustomDomainRouter;