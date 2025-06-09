// src/pages/SuccessPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../utils/api';

const SuccessPage = () => {
  const location = useLocation();
  const [message, setMessage] = useState('Processando pagamento...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const params = new URLSearchParams(location.search);
      const userId = params.get('userId');
      const planName = params.get('plan');

      if (!userId || !planName) {
        setError('Parâmetros inválidos na URL.');
        return;
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/confirm-payment`, {
          userId,
          planName,
        });

        if (response.status === 200) {
          setMessage('Pagamento confirmado com sucesso! Seu plano foi atualizado.');
        } else {
          setError('Erro ao confirmar o pagamento.');
        }
      } catch (err) {
        console.error(err);
        setError('Erro ao processar a confirmação do pagamento.');
      }
    };

    confirmPayment();
  }, [location.search]);

  return (
    <div className="container py-5">
      <h1 className="mb-4">Confirmação de Pagamento</h1>
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="alert alert-success">{message}</div>
      )}
    </div>
  );
};

export default SuccessPage;
