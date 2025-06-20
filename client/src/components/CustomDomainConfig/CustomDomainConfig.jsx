import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Link,
  Chip,
} from '@mui/material';
import { Dns as DnsIcon } from '@mui/icons-material';
import axios from 'axios';

// A API_BASE_URL será pasada como prop ou importada dun ficheiro de configuración
// const API_BASE_URL = 'https://storesync.onrender.com'; // Exemplo

const CustomDomainConfig = ({
  currentUser,
  storeData,
  userPlan,
  onSaveChanges, // Función para gardar o customDomain no Firestore
  apiBaseUrl, // URL do backend
  onUpgradePlanClick, // Función para navegar á páxina de upgrade
}) => {
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [domainConfigInstructions, setDomainConfigInstructions] = useState(null);
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainError, setDomainError] = useState(null);
  const [domainSuccess, setDomainSuccess] = useState(null);
  const [forceLoading, setForceLoading] = useState(false);

  useEffect(() => {
    if (storeData?.customDomain) {
      setCustomDomainInput(storeData.customDomain);
    }
    // Se hai instrucións de DNS gardadas no storeData, poderían cargarse aquí.
    // Ex: if (storeData?.domainDNSRecords) setDomainConfigInstructions(storeData.domainDNSRecords);
  }, [storeData?.customDomain]);

  const handleSetupCustomDomain = async () => {
    if (!customDomainInput.trim()) {
      setDomainError("Por favor, insira um domínio válido.");
      return;
    }
    if (!currentUser?.uid) {
      setDomainError("Usuário não autenticado.");
      return;
    }
    if (!apiBaseUrl) {
        setDomainError("A URL da API não está configurada. Contacte o suporte.");
        return;
    }

    setDomainLoading(true);
    setDomainError(null);
    setDomainSuccess(null);
    setDomainConfigInstructions(null);

    try {
      // Chama backend que já salva no Firestore e adiciona na Vercel
      const response = await axios.post(`${apiBaseUrl}/api/loja/custom-domain`, {
        lojaId: currentUser.uid,
        domain: customDomainInput.trim(),
      });

      if (response.data && response.data.dnsInstructions) {
        // Atualiza Firestore no client (opcional)
        await onSaveChanges("Domínio Personalizado", {
           customDomain: customDomainInput.trim(),
           domainVerified: false,
        }, `Domínio ${customDomainInput.trim()} enviado para configuración! Siga as instruções de DNS.`);

        setDomainConfigInstructions(response.data.dnsInstructions);
        setDomainSuccess(
          `Domínio ${customDomainInput.trim()} adicionado. Siga as instruções de DNS abaixo.`
        );
      } else {
        throw new Error(response.data.message || "Não foi possível obter as instruções de DNS da API.");
      }
    } catch (err) {
      console.error("Erro ao configurar domínio personalizado:", err);
      const errorMessage = err.response?.data?.message || err.message || "Erro desconhecido ao configurar domínio.";
      setDomainError(errorMessage);
      if (errorMessage.includes("already exists") || errorMessage.includes("already in use")) {
        setDomainError(`O domínio "${customDomainInput.trim()}" já está em uso ou configurado. Se é seu, verifique as configurações de DNS. Se o problema persistir, contate o suporte.`);
      }
      if (err.response?.data?.dnsInstructions) {
        setDomainConfigInstructions(err.response.data.dnsInstructions);
      }
    } finally {
      setDomainLoading(false);
    }
  };

  const handleForceVercelDomain = async () => {
    if (!currentUser?.uid) {
      setDomainError("Usuário não autenticado.");
      return;
    }
    if (!apiBaseUrl) {
      setDomainError("A URL da API não está configurada. Contacte o suporte.");
      return;
    }
    setForceLoading(true);
    setDomainError(null);
    setDomainSuccess(null);
    setDomainConfigInstructions(null);

    try {
      const response = await axios.post(`${apiBaseUrl}/api/loja/forcar-vercel-domain`, {
        lojaId: currentUser.uid,
      });
      if (response.data && response.data.dnsInstructions) {
        setDomainConfigInstructions(response.data.dnsInstructions);
        setDomainSuccess(
          `Domínio forçado e enviado para a Vercel. Siga as instruções de DNS abaixo.`
        );
      } else {
        throw new Error(response.data.message || "Não foi possível obter as instruções de DNS da API.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Erro desconhecido ao forçar domínio.";
      setDomainError(errorMessage);
    } finally {
      setForceLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configurar Domínio Personalizado
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Use o seu propio dominio (ex: www.sualoja.com.br) para a súa tenda.
        Este recurso está dispoñible para plans Plus e Premium.
      </Typography>

      {userPlan === "free" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Este recurso non está dispoñible no seu plano actual. Considere facer um{' '}
          <Link component="button" variant="body2" onClick={onUpgradePlanClick}>
            upgrade
          </Link>
          .
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          label="O seu Dominio Personalizado"
          fullWidth
          value={customDomainInput}
          onChange={(e) => setCustomDomainInput(e.target.value)}
          placeholder="Ex: www.minhatenda.com.br ou tenda.meusite.com"
          sx={{ mb: 2 }}
          disabled={userPlan === "free" || domainLoading}
          helperText={
            storeData?.customDomain
              ? `Dominio actual configurado: ${storeData.customDomain}${storeData.domainVerified ? ' (Verificado)' : ' (Pendente de DNS)'}`
              : "Insira o dominio que vostede rexistrou."
          }
        />
        <Button
          variant="contained"
          onClick={handleSetupCustomDomain}
          disabled={userPlan === "free" || domainLoading || !customDomainInput.trim()}
          startIcon={domainLoading ? <CircularProgress size={20} color="inherit" /> : <DnsIcon />}
        >
          {domainLoading ? "Configurando..." : (storeData?.customDomain === customDomainInput.trim() ? "Verificar/Actualizar DNS" : "Configurar Dominio")}
        </Button>
        {/* --- Botão de Forçar integração com Vercel --- */}
        {storeData?.customDomain && (
          <Button
            variant="outlined"
            color="secondary"
            sx={{ ml: 2, mt: 1 }}
            onClick={handleForceVercelDomain}
            disabled={forceLoading}
          >
            {forceLoading ? <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> : null}
            Forçar integração com Vercel
          </Button>
        )}
        {domainError && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setDomainError(null)}>{domainError}</Alert>}
        {domainSuccess && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setDomainSuccess(null)}>{domainSuccess}</Alert>}
      </Paper>

      {domainConfigInstructions && Array.isArray(domainConfigInstructions) && (
        <Paper sx={{ p: 2, mt: 2, backgroundColor: 'grey.100', borderLeft: '4px solid', borderColor: 'warning.main' }}>
          <Typography variant="h6" gutterBottom sx={{color: 'warning.dark'}}>
            Próximos Pasos: Configure o seu DNS
          </Typography>
          <Typography paragraph>
            Para que o seu dominio <strong>{customDomainInput}</strong> apunte á súa tenda, precisa engadir os seguintes rexistros no panel de control do seu provedor de dominio (ex: Registro.br, GoDaddy, etc.):
          </Typography>
          {domainConfigInstructions.map((instr, index) => (
            <Box key={index} sx={{ mb: 2, p: 1.5, border: '1px dashed', borderColor: 'grey.400', borderRadius: 1, backgroundColor: 'white' }}>
              <Typography><strong>Tipo:</strong> <Chip label={instr.type} size="small" sx={{fontWeight: 'bold'}} /></Typography>
              <Typography><strong>Nome/Host:</strong> <code>{instr.name || "@ (para dominio raíz)"}</code></Typography>
              <Typography sx={{wordBreak: 'break-all'}}><strong>Valor/Destino:</strong> <code>{instr.value}</code></Typography>
              {instr.ttl && <Typography><strong>TTL:</strong> {instr.ttl} (ou o valor predeterminado do seu provedor)</Typography>}
            </Box>
          ))}
          <Typography paragraph sx={{ mt: 2, fontSize: '0.9rem' }}>
            Despois de gardar estas configuracións no seu provedor de dominio, pode levar dende uns minutos ata varias horas para que as modificacións se propaguen por toda a internet. A Vercel (nosa plataforma de hospedaxe) tentará verificar o seu dominio automaticamente.
          </Typography>
          <Typography variant="caption" display="block">
            <strong>Importante:</strong> Se está a usar o dominio raíz (ex: suatenda.com.br) e a Vercel fornece enderezos IP (Rexistros A), asegúrese de eliminar calquera outro rexistro A ou CNAME conflitante para o dominio raíz. Se é un subdominio (ex: www.sualoja.com.br) cun CNAME, elimine CNAMEs ou rexistros A conflitantes para ese subdominio.
          </Typography>
        </Paper>
      )}
      {storeData?.customDomain && !domainConfigInstructions && !domainLoading && (
        <Alert severity="info" sx={{mt:2}}>
            O seu dominio <strong>{storeData.customDomain}</strong> está rexistrado na plataforma.
            {storeData.domainVerified === false && " Agardando a configuración ou verificación do DNS."}
            {storeData.domainVerified === true && " O dominio parece estar verificado e activo!"}
            Se non funciona, verifique as configuracións de DNS no seu provedor de dominio ou prema en "Verificar/Actualizar DNS" para ver as instrucións de novo.
        </Alert>
      )}
    </Box>
  );
};

export default CustomDomainConfig;
