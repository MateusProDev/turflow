import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { db } from "../firebaseConfig";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

const CategoriasContext = createContext();

export const useCategorias = () => useContext(CategoriasContext);
 
export const CategoriasProvider = ({ lojaId, children }) => {
  const [categoriasData, setCategoriasData] = useState({
    categorias: [],
    imgCategorias: []
  });

  // Busca e escuta categorias e imagens em tempo real
  useEffect(() => {
    if (!lojaId) return;
    
    const unsub = onSnapshot(doc(db, "lojas", lojaId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCategoriasData({
          categorias: data.categorias || [],
          imgCategorias: data.imgcategorias || []
        });
      }
    });
    
    return () => unsub();
  }, [lojaId]);

  const addCategoria = useCallback(async (categoria, imagem) => {
    if (!lojaId) return;
    
    const updateData = {
      categorias: arrayUnion(categoria)
    };
    
    if (imagem) {
      updateData.imgcategorias = arrayUnion({
        nome: categoria.nome || categoria,
        imagem: imagem
      });
    }
    
    await updateDoc(doc(db, "lojas", lojaId), updateData);
  }, [lojaId]);

  const removeCategoria = useCallback(async (categoria) => {
    if (!lojaId) return;
    
    const nomeCategoria = typeof categoria === 'string' ? categoria : categoria.nome;
    
    await updateDoc(doc(db, "lojas", lojaId), {
      categorias: arrayRemove(categoria),
      imgcategorias: arrayRemove({ nome: nomeCategoria })
    });
  }, [lojaId]);

  const updateImagemCategoria = useCallback(async (categoria, novaImagem) => {
    if (!lojaId) return;
    
    const nomeCategoria = typeof categoria === 'string' ? categoria : categoria.nome;
    
    // Primeiro remove a imagem existente (se houver)
    await updateDoc(doc(db, "lojas", lojaId), {
      imgcategorias: arrayRemove({ nome: nomeCategoria })
    });
    
    // Depois adiciona a nova imagem (se fornecida)
    if (novaImagem) {
      await updateDoc(doc(db, "lojas", lojaId), {
        imgcategorias: arrayUnion({
          nome: nomeCategoria,
          imagem: novaImagem
        })
      });
    }
  }, [lojaId]);

  return (
    <CategoriasContext.Provider value={{
      categorias: categoriasData.categorias,
      imgCategorias: categoriasData.imgCategorias,
      addCategoria,
      removeCategoria,
      updateImagemCategoria
    }}>
      {children}
    </CategoriasContext.Provider>
  );
};