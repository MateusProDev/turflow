import React, { useState, useEffect } from 'react';
import { Button, Form, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';  // Caminho corrigido
import { useNavigate } from 'react-router-dom';

const CheckoutTransparent = ({ currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError('Você precisa estar logado para fazer o pagamento.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/create-preference`, {
        userId: currentUser.uid,
        planName: "plus",
        amount: 39.90,
      });

      const { preferenceId, init_point } = response.data;

      if (init_point) {
        window.location.href = init_point;
        return;
      } else if (preferenceId) {
        window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
        return;
      } else {
        setError("Falha ao gerar a preferência de pagamento.");
        return;
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao processar o pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <h1 className="mb-4">Upgrade da Conta</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Plano Plus</h5>
            <p className="card-text">R$39,90/mês</p>
            <ul className="list-unstyled mb-3">
              <li>✔ 7 dias grátis</li>
              <li>✔ Gerenciamento de estoque</li>
              <li>✔ Relatórios de vendas</li>
            </ul>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                'Escolher Plano Plus'
              )}
            </Button>
          </div>
        </div>
      </Form>

      <div className="checkout-container mt-4"></div>

      {paymentStatus && <Alert variant="info mt-3">{paymentStatus}</Alert>}

      <div className="mt-3">
        <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  );
};

export default CheckoutTransparent;