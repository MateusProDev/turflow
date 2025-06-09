import React, { useState, useEffect } from 'react'; // Adicione esta linha
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';
import { Spinner, Alert } from 'react-bootstrap';

const CheckoutRedirect = ({ currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const planName = params.get("plan");
  const amount = params.get("amount");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createPreference = async () => {
      if (!currentUser) {
        setError("Usuário não autenticado");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/create-preference`, {
          userId: currentUser.uid,
          planName,
          amount,
        });

        const preferenceId = response.data.preferenceId;
        if (preferenceId) {
          window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
        } else {
          setError("Preferência inválida.");
        }
      } catch (err) {
        console.error('Erro ao redirecionar para o checkout:', err);
        setError('Erro ao processar pagamento. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    createPreference();
  }, [planName, amount, currentUser, navigate]);

  if (error) {
    return (
      <div className="container text-center mt-5">
        <Alert variant="danger">{error}</Alert>
        <button 
          className="btn btn-primary mt-3"
          onClick={() => navigate('/upgrade')}
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="text-center mt-5">
      <h4>Redirecionando para o pagamento do plano {planName}...</h4>
      <Spinner animation="border" className="mt-3" />
    </div>
  );
};

export default CheckoutRedirect;