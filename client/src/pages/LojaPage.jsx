import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';  // Aponte para o arquivo de configuração do Firebase
import { doc, getDoc } from 'firebase/firestore';
import Spinner from '../components/Spinner';

const LojaPage = () => {
  const { slug } = useParams(); // Obtém o slug da URL
  const [loja, setLoja] = useState(null);

  useEffect(() => {
    // Busca os dados da loja no Firestore
    const lojaRef = doc(db, 'lojas', slug);
    getDoc(lojaRef).then((docSnap) => {
      if (docSnap.exists()) {
        setLoja(docSnap.data());  // Armazena os dados da loja no estado
      } else {
        console.log("Loja não encontrada");
      }
    }); 
  }, [slug]); // Atualiza quando o `slug` mudar

  if (!loja) {
    return <Spinner />; // Exibe um carregamento até os dados serem obtidos
  }

  return (
    <div>
      <h1>{loja.nome}</h1>
      <img src={loja.logoUrl} alt={loja.nome} />
      <p>{loja.segmento}</p>
      <p>Plano: {loja.plano}</p>
      {/* Outros dados da loja */}
    </div>
  );
};

export default LojaPage;
