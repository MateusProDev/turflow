import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Switch, FormControlLabel } from "@mui/material";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Ajuste o caminho

const PaymentsSettings = ({ currentUser, storeData: initialStoreData, onUpdate }) => {
  const [publicKey, setPublicKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [enableMp, setEnableMp] = useState(false);
  const [enableWpp, setEnableWpp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Carrega os dados da loja quando o componente monta ou os dados iniciais mudam
  useEffect(() => {
    if (initialStoreData) {
      setPublicKey(initialStoreData.mpPublicKey || '');
      setAccessToken(initialStoreData.mpAccessToken || '');
      setEnableMp(initialStoreData.enableMpCheckout || false);
      setEnableWpp(initialStoreData.enableWhatsappCheckout ?? true);
    } else if (currentUser) {
        // Fallback: Se os dados não vierem por prop, tenta buscar
        const fetchStoreData = async () => {
            const storeRef = doc(db, "lojas", currentUser.uid);
            const docSnap = await getDoc(storeRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setPublicKey(data.mpPublicKey || '');
                setAccessToken(data.mpAccessToken || '');
                setEnableMp(data.enableMpCheckout || false);
                setEnableWpp(data.enableWhatsappCheckout ?? true);
            }
        };
        fetchStoreData();
    }
  }, [currentUser, initialStoreData]);

  const handleSavePayments = async () => {
    if (!currentUser) {
      setError("Usuário não encontrado. Faça login novamente.");
      return;
    }
    if (!accessToken && enableMp) {
        setError("Para habilitar o checkout Mercado Pago, o Access Token é obrigatório.");
        return;
    }


    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const storeRef = doc(db, "lojas", currentUser.uid);
      const dataToUpdate = {
        mpPublicKey: publicKey,
        mpAccessToken: accessToken,
        enableMpCheckout: enableMp,
        enableWhatsappCheckout: enableWpp,
      };

      await updateDoc(storeRef, dataToUpdate);

      setSuccess("Configurações de pagamento salvas com sucesso!");
      // Se houver uma função onUpdate, chame-a para atualizar o estado no Dashboard
      if (onUpdate) {
          onUpdate(dataToUpdate);
      }

    } catch (err) {
      console.error("Erro ao salvar configurações de pagamento:", err);
      setError("Erro ao salvar. Verifique suas chaves e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Configurações de Pagamento (Mercado Pago) 💳</h2>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Configure suas credenciais do Mercado Pago para receber pagamentos diretamente dos seus clientes via cartão de crédito ou Pix.
        Você pode encontrar suas credenciais <a href="https://www.mercadopago.com.br/developers/panel/credentials" target="_blank" rel="noopener noreferrer">aqui</a> (vá para "Credenciais de Produção").
      </Typography>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {success && <Typography color="success" sx={{ mb: 2 }}>{success}</Typography>}

      <TextField
        label="Public Key (Chave Pública)"
        fullWidth
        value={publicKey}
        onChange={(e) => setPublicKey(e.target.value)}
        sx={{ mb: 2 }}
        placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        helperText="Necessária se você planeja usar Checkout Bricks (formulário na loja). Opcional para redirecionamento."
      />
      <TextField
        label="Access Token (Chave Secreta)"
        fullWidth
        type="password" // Para não exibir a chave diretamente
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
        sx={{ mb: 2 }}
        placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx"
        helperText="ESSENCIAL para processar pagamentos. Mantenha esta chave segura!"
      />

      <Box sx={{ mb: 2 }}>
          <FormControlLabel
              control={
                  <Switch
                      checked={enableMp}
                      onChange={(e) => setEnableMp(e.target.checked)}
                      name="enableMp"
                      color="primary"
                  />
              }
              label="Habilitar Checkout via Mercado Pago (Cartão/Pix)"
          />
           <FormControlLabel
              control={
                  <Switch
                      checked={enableWpp}
                      onChange={(e) => setEnableWpp(e.target.checked)}
                      name="enableWpp"
                      color="primary"
                  />
              }
              label="Habilitar Checkout via WhatsApp"
              sx={{ ml: 2 }}
          />
      </Box>

      <Button
        variant="contained"
        onClick={handleSavePayments}
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </div>
  );
};

export default PaymentsSettings;