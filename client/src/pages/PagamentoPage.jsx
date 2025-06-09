import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';

const PagamentoPage = () => {
  const [preferenceId, setPreferenceId] = useState(null);

  useEffect(() => {
    // Criação da preferência de pagamento no servidor (Backend)
    const fetchPaymentPreference = async () => {
      try {
        const response = await fetch('/api/create-preference', { method: 'POST' });
        const data = await response.json();
        setPreferenceId(data.preferenceId);  // ID da preferência de pagamento
      } catch (error) {
        console.error('Erro ao criar preferência de pagamento:', error);
      }
    };
    
    fetchPaymentPreference();
  }, []);

  const handlePayment = () => {
    // Implementar lógica de integração com Mercado Pago aqui
    if (preferenceId) {
      // Redirecionar para o checkout do Mercado Pago
      window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
    }
  };

  return (
    <div>
      <h2>Escolha seu Plano</h2>
      <Button onClick={handlePayment}>Pagar com Mercado Pago</Button>
    </div>
  );
};

export default PagamentoPage;
