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

  useEffect(() => {
    if (!window.MercadoPago) {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => {
        window.mpInstance = new window.MercadoPago(process.env.REACT_APP_MERCADO_PAGO_PUBLIC_KEY, { locale: 'pt-BR' });
      };
      document.body.appendChild(script);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError('Você precisa estar logado para fazer o pagamento.');
      return;
    }

    if (!window.mpInstance) {
      setError('Erro ao carregar o Mercado Pago. Tente novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/mercadopago`, {
        userId: currentUser.uid,
        amount: 39.90,
        description: "Upgrade para Plano Plus"
      });

      const preference = response.data.preference;

      if (!preference || !preference.id) {
        setError("Falha ao gerar a preferência de pagamento.");
        return;
      }

      window.mpInstance.checkout({
        preference: {
          id: preference.id,
        },
        render: {
          container: '.checkout-container',
          label: 'Pagar agora',
        },
        autoOpen: true,
      });

      setPaymentStatus('Aguardando pagamento...');
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