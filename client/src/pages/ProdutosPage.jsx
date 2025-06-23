import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import ProductSection from "../components/Lojinha/ProductSection/ProductSection";
import { useAuth } from "../utils/useAuth"; // Importação


const ProdutosPage = ({ lojaId }) => {
  const { user, loading } = useAuth(); // Uso do hook
  const [categorias, setCategorias] = useState([]);
  const [produtosPorCategoria, setProdutosPorCategoria] = useState({});

  useEffect(() => {
    if (!lojaId) return;
    const fetchAll = async () => {
      const lojaRef = doc(db, "lojas", lojaId);
      const lojaSnap = await getDoc(lojaRef);
      const categoriasArr = lojaSnap.exists() ? (lojaSnap.data().categorias || []) : [];
      setCategorias(categoriasArr);

      const produtosSnap = await getDocs(collection(db, `lojas/${lojaId}/produtos`));
      const produtos = produtosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const agrupados = {};
      produtos.forEach(prod => {
        const cat = prod.category || "Sem Categoria";
        if (!agrupados[cat]) agrupados[cat] = [];
        agrupados[cat].push(prod);
      });
      setProdutosPorCategoria(agrupados);
    };
    fetchAll();
  }, [lojaId]);

  if (loading) return <div>Carregando...</div>;
  if (!user) return <div>Você não está autenticado.</div>;
 
  return (
    <div>
      <h2>Todos os Produtos</h2>
      {categorias.map(cat => (
        <ProductSection
          key={cat}
          title={cat}
          products={produtosPorCategoria[cat] || []}
          onAddToCart={() => {}}
        />
      ))}
      {produtosPorCategoria["Sem Categoria"] && (
        <ProductSection
          title="Sem Categoria"
          products={produtosPorCategoria["Sem Categoria"]}
          onAddToCart={() => {}}
        />
      )}
    </div>
  );
};

export default ProdutosPage;