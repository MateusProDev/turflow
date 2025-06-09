import React, { useReducer, useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Fade,
  Zoom,
  Slide
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  ArrowRightAlt as ArrowRightIcon,
  EmojiEvents as TrophyIcon,
  Info as InfoIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
// CORRECTED IMPORT: Added writeBatch
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, writeBatch } from "firebase/firestore"; 
import Countdown from "react-countdown";
import styles from "./PlanoUpgrade.module.css";

// --- Configuration --- 
// Assuming db is correctly configured and imported from your firebaseConfig file
import { db } from "../../firebaseConfig"; // <<--- MAKE SURE THIS PATH IS CORRECT
import { getAuth } from "firebase/auth"; // <<--- Import getAuth

// --- Plan Definitions (Keep as is) ---
const MAX_IMAGES = {
  free: 1,
  plus: 3,
  premium: 5,
};

const PRODUCT_LIMITS = {
  free: 30,
  plus: 300,
  premium: Infinity, 
};

const planos = {
  monthly: [
    {
      id: "free_monthly",
      nome: "Free",
      preco: 0,
      label: "Grátis",
      recursos: [
        `Até ${PRODUCT_LIMITS.free} produtos`,
        `${MAX_IMAGES.free} imagem por produto`,
        "Gerenciamento de estoque básico",
        "Integração com WhatsApp",
        "Relatórios Básicos",
        "Suporte por e-mail",
        "Certificado SSL incluído"
      ],
      popular: false,
      premium: false,
    },
    {
      id: "plus_monthly",
      nome: "Plus",
      preco: 39.9,
      label: "R$ 39,90/mês",
      recursos: [
        `Até ${PRODUCT_LIMITS.plus} produtos`,
        `Até ${MAX_IMAGES.plus} imagens por produto`,
        "Registro de vendas completo",
        "Gerenciamento de estoque avançado",
        "Integração com WhatsApp e redes sociais",
        "Vários meios de pagamento",
        "Relatórios completos e analytics",
        "Suporte Humanitário (9h-18h)",
        "Certificado SSL premium"
      ],
      popular: true, 
      premium: false,
    },
    {
      id: "premium_monthly",
      nome: "Premium",
      preco: 99.9,
      label: "R$ 99,90/mês",
      recursos: [
        "Tudo do Plus +",
        "Produtos ilimitados", 
        `Até ${MAX_IMAGES.premium} imagens por produto`,
        "Relatórios Avançados com insights",
        "Suporte prioritário 24/7",
        "Consultoria mensal gratuita",
        "Backup diário automático",
        "Integração com marketplaces"
      ],
      popular: false,
      premium: true,
    }
  ],
  annual: [
    {
      id: "free_annual",
      nome: "Free",
      preco: 0,
      label: "Grátis",
      recursos: [
        `Até ${PRODUCT_LIMITS.free} produtos`,
        `${MAX_IMAGES.free} imagem por produto`,
        "Gerenciamento de estoque básico",
        "Integração com WhatsApp",
        "Relatórios Básicos",
        "Suporte por e-mail",
        "Certificado SSL incluído"
      ],
      popular: false,
      premium: false,
    },
    {
      id: "plus_annual",
      nome: "Plus",
      preco: 39.9 * 12 * 0.9, 
      label: "R$ 39,90/mês",
      monthlyEquivalent: "R$ 35,91/mês",
      annualLabel: "R$ 430,92/ano", 
      recursos: [
        `Até ${PRODUCT_LIMITS.plus} produtos`,
        `Até ${MAX_IMAGES.plus} imagens por produto`,
        "Registro de vendas completo",
        "Gerenciamento de estoque avançado",
        "Integração com WhatsApp e redes sociais",
        "Vários meios de pagamento",
        "Relatórios completos e analytics",
        "Suporte Humanitário (9h-18h)",
        "Certificado SSL premium",
        "Economize 10% + 2 meses grátis"
      ],
      popular: true, 
      premium: false,
    },
    {
      id: "premium_annual",
      nome: "Premium",
      preco: 99.9 * 12 * 0.9, 
      label: "R$ 99,90/mês",
      monthlyEquivalent: "R$ 89,91/mês",
      annualLabel: "R$ 1.078,92/ano",
      recursos: [
        "Tudo do Plus +",
        "Produtos ilimitados",
        `Até ${MAX_IMAGES.premium} imagens por produto`,
        "Relatórios Avançados com insights",
        "Suporte prioritário 24/7",
        "Consultoria mensal gratuita",
        "Backup diário automático",
        "Integração com marketplaces",
        "Economize 10% + 3 meses grátis",
        "Domínio personalizado grátis"
      ],
      popular: false,
      premium: true,
    }
  ]
};

// --- Reducer and Initial State (for local UI state like dialogs, errors) ---
const initialState = {
  dialogOpen: false,
  selectedPlan: null,
  updatingPlan: false, // For button loading state
  error: null, // Local errors (e.g., failed update)
  success: null,
  planType: "monthly" 
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_ERROR":
      return { ...state, error: action.payload, success: null };
    case "SET_SUCCESS":
      return { ...state, success: action.payload, error: null };
    case "SET_UPDATING_PLAN":
      return { ...state, updatingPlan: action.payload };
    case "OPEN_DIALOG":
      return { ...state, dialogOpen: true, selectedPlan: action.payload };
    case "CLOSE_DIALOG":
      return { ...state, dialogOpen: false, selectedPlan: null };
    case "CLEAR_MESSAGES":
      return { ...state, error: null, success: null };
    case "SET_PLAN_TYPE":
      return { ...state, planType: action.payload };
    default:
      return state;
  }
};

// --- PriceDisplay Component (Keep as is) ---
const PriceDisplay = ({ plan, planType }) => {
  if (planType === "annual" && plan.preco > 0) {
    return (
      <Box className={styles.priceDisplayContainerAnnual}>
        <Typography variant="h4" className={styles.cardPriceAnnualLabel}>
          {plan.annualLabel}
        </Typography>
        <Typography variant="subtitle2" className={styles.equivalentPrice}>
          Equivalente a {plan.monthlyEquivalent}
        </Typography>
      </Box>
    );
  }
  return (
    <Box className={styles.priceDisplayContainerMonthly}>
      <Typography variant="h4" className={styles.cardPriceMonthlyLabel}>
        {plan.label}
      </Typography>
    </Box>
  );
};

// --- Main PlanoUpgrade Component (Adapted Logic) ---
const PlanoUpgrade = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const auth = getAuth();
  
  // --- Local State for User Data (Fetched Directly) ---
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [userId, setUserId] = useState(null);

  // --- Fetch User Data Directly using onSnapshot --- 
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
        setLoading(true);
        setFetchError(null);

        const userRef = doc(db, "usuarios", user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              // Ensure plan field exists, default to free
              if (!data.plano) {
                data.plano = "free";
              }
              setUserData(data);
              console.log("User data updated via snapshot:", data.plano);
            } else {
              console.error("User document does not exist for UID:", user.uid);
              setFetchError("Dados do usuário não encontrados.");
              setUserData(null); // Clear stale data
            }
            setLoading(false);
          }, 
          (error) => {
            console.error("Error fetching user data snapshot:", error);
            setFetchError("Erro ao carregar dados do plano. Tente recarregar.");
            setLoading(false);
            setUserData(null);
          }
        );
        
        // Cleanup snapshot listener on user change or unmount
        return () => unsubscribeSnapshot();

      } else {
        // User logged out
        setUserId(null);
        setUserData(null);
        setLoading(false);
        setFetchError("Usuário não autenticado.");
        // Optional: navigate to login
        // navigate("/login"); 
      }
    });

    // Cleanup auth listener on unmount
    return () => unsubscribeAuth();
  }, [auth]); // Dependency on auth instance

  // --- Helper Functions to Interpret User Data --- 
  const isTrialActive = useCallback(() => {
    if (!userData?.fimTeste || !userData?.emTeste) return false;
    return new Date() < new Date(userData.fimTeste);
  }, [userData]);

  const isTrialExpired = useCallback(() => {
    if (!userData?.fimTeste || !userData?.hasUsedTrial) return false;
    return new Date() > new Date(userData.fimTeste);
  }, [userData]);

  const userHasUsedTrial = userData?.hasUsedTrial || false;
  const currentPlanName = userData?.plano || "free"; // Get plan directly from fetched data

  // --- Event Handlers (Dialog, Plan Type) --- 
  const handlePlanTypeChange = (event, newPlanType) => {
    if (newPlanType !== null) {
      dispatch({ type: "SET_PLAN_TYPE", payload: newPlanType });
    }
  };

  const handleOpenDialog = (plano) => {
    if (userHasUsedTrial) {
      dispatch({ type: "SET_ERROR", payload: "Você já utilizou seu teste gratuito." });
      return;
    }
    dispatch({ type: "OPEN_DIALOG", payload: plano });
  };

  const handleCloseDialog = () => {
    dispatch({ type: "CLOSE_DIALOG" });
  };

  // --- Async Functions (Update Firebase) --- 
  const iniciarTeste = async (plano) => {
    if (!userId) {
      dispatch({ type: "SET_ERROR", payload: "Usuário não autenticado." });
      return;
    }
    if (plano.preco === 0) {
      dispatch({ type: "SET_ERROR", payload: "O plano Free não tem teste." });
      return;
    }
    if (userHasUsedTrial) {
      dispatch({ type: "SET_ERROR", payload: "Você já usou seu teste gratuito." });
      return;
    }

    dispatch({ type: "SET_UPDATING_PLAN", payload: true });
    dispatch({ type: "CLEAR_MESSAGES" });
    try {
      const now = new Date();
      const fim = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nowISO = now.toISOString();
      const fimISO = fim.toISOString();

      const userRef = doc(db, "usuarios", userId);
      const lojaRef = doc(db, "lojas", userId);

      const updateData = {
        plano: plano.nome.toLowerCase(),
        // planoAtual: plano.nome.toLowerCase(), // Removed
        planoAtivo: false,
        emTeste: true,
        testeGratuito: true,
        hasUsedTrial: true,
        inicioTeste: nowISO,
        fimTeste: fimISO,
        expiracaoPlano: fimISO,
        updatedAt: serverTimestamp(),
      };

      // Use batch for atomicity (optional but good practice)
      const batch = writeBatch(db);
      batch.set(userRef, updateData, { merge: true });
      batch.set(lojaRef, { 
        plano: plano.nome.toLowerCase(), 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      await batch.commit();

      // No need to manually update local state, onSnapshot will handle it
      dispatch({ type: "SET_SUCCESS", payload: `Teste gratuito de 7 dias do plano ${plano.nome} iniciado!` });
      dispatch({ type: "CLOSE_DIALOG" });
    } catch (err) {
      console.error("Erro ao iniciar teste:", err);
      dispatch({ type: "SET_ERROR", payload: "Não foi possível iniciar o teste. Tente novamente." });
    } finally {
      dispatch({ type: "SET_UPDATING_PLAN", payload: false });
    }
  };

  const comprarPlano = async (plano, duration) => {
    if (!userId) {
      dispatch({ type: "SET_ERROR", payload: "Usuário não autenticado." });
      return;
    }
    if (plano.preco === 0) {
      await handleUpgradeToFree();
      return;
    }

    const trialIsCurrentlyActive = isTrialActive();
    
    // Aplicar 5% de desconto para mensal ou 10% para anual durante o teste
    const desconto = trialIsCurrentlyActive && !userData?.descontoAplicado 
      ? (duration === "annual" ? 0.9 : 0.95) 
      : 1;

    let precoFinal = duration === "annual"
      ? planos.annual.find((p) => p.nome === plano.nome)?.preco
      : plano.preco * desconto;

    if (precoFinal === undefined || isNaN(precoFinal)) {
      dispatch({ type: "SET_ERROR", payload: "Erro ao calcular o preço final." });
      return;
    }

    try {
      navigate(
        `/checkout?plan=${encodeURIComponent(
          plano.nome.toLowerCase()
        )}&amount=${precoFinal.toFixed(2)}&userId=${userId}&duration=${duration}`
      );
    } catch (err) {
      console.error("Erro ao navegar para checkout:", err);
      dispatch({ type: "SET_ERROR", payload: "Erro ao processar sua solicitação." });
    }
  };

  const handleUpgradeToFree = async () => {
    if (!userId) {
      dispatch({ type: "SET_ERROR", payload: "Usuário não autenticado." });
      return;
    }
    dispatch({ type: "SET_UPDATING_PLAN", payload: true });
    dispatch({ type: "CLEAR_MESSAGES" });
    try {
      const userRef = doc(db, "usuarios", userId);
      const lojaRef = doc(db, "lojas", userId);

      const updateData = {
        plano: "free",
        // planoAtual: "free", // Removed
        planoAtivo: true,
        emTeste: false,
        testeGratuito: false,
        inicioTeste: null,
        fimTeste: null,
        expiracaoPlano: null,
        dataInicioPlano: serverTimestamp(),
        // hasUsedTrial: userData?.hasUsedTrial || false, // Keep history
        updatedAt: serverTimestamp(),
      };

      const batch = writeBatch(db);
      batch.set(userRef, updateData, { merge: true });
      batch.set(lojaRef, { 
        plano: "free", 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      await batch.commit();

      // onSnapshot will update the UI
      dispatch({ type: "SET_SUCCESS", payload: "Plano alterado para Free com sucesso!" });
    } catch (err) {
      console.error("Erro ao alterar para plano free:", err);
      dispatch({ type: "SET_ERROR", payload: "Não foi possível alterar para o plano Free." });
    } finally {
      dispatch({ type: "SET_UPDATING_PLAN", payload: false });
    }
  };

  // --- Get Local UI State --- 
  const { 
    error, 
    success,
    dialogOpen, 
    selectedPlan, 
    updatingPlan,
    planType
  } = state;

  // --- Loading State --- 
  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress size={50} className={styles.loadingSpinner} />
        <Typography variant="body1" className={styles.loadingText}>
          Carregando informações do plano...
        </Typography>
      </Box>
    );
  }

  // --- Error State (Fetch Error) --- 
  if (fetchError) {
    return (
      <Box className={styles.errorContainer}>
        <Alert severity="error" className={styles.errorAlert}>
          {fetchError}
        </Alert>
        {/* Optional: Add a retry button */} 
      </Box>
    );
  }
  
  // --- Data Not Loaded Yet (Should be brief) ---
  if (!userData) {
     return (
      <Box className={styles.loadingContainer}>
        <CircularProgress size={50} className={styles.loadingSpinner} />
        <Typography variant="body1" className={styles.loadingText}>
          Aguardando dados do usuário...
        </Typography>
      </Box>
    ); 
  }

  // --- Main Render (Using local userData state) ---
  const trialIsCurrentlyActive = isTrialActive();
  const trialHasExpired = isTrialExpired();

  return (
    <Box className={styles.planoUpgradeContainer}>
      <Slide direction="down" in={true} mountOnEnter unmountOnExit timeout={500}>
        <Box className={styles.contentWrapper}>
          
          {/* Local UI Alerts (Success/Error from actions) */} 
          {success && (
            <Alert 
              severity="success" 
              className={styles.alertSuccess}
              onClose={() => dispatch({ type: "CLEAR_MESSAGES" })}
            >
              {success}
            </Alert>
          )}
          {error && (
            <Alert 
              severity="error" 
              className={styles.alertError}
              onClose={() => dispatch({ type: "CLEAR_MESSAGES" })}
            >
              {error}
            </Alert>
          )}

          {/* Title & Status - Use currentPlanName from local state */} 
          <Typography variant="h4" className={styles.mainTitle} gutterBottom>
            Escolha o Plano Ideal para Você
          </Typography>
          <Typography variant="body1" className={styles.planStatusText} sx={{ mb: 3, textAlign: 'center' }}>
            Seu plano atual: <strong className={styles.planStatusHighlight}>{currentPlanName.toUpperCase()}</strong>
            {trialIsCurrentlyActive && (
              <span className={styles.trialStatusInfo}> (em teste gratuito)</span>
            )}
            {trialHasExpired && userHasUsedTrial && (
              <span className={styles.trialExpiredInfo}> (teste expirado)</span>
            )}
          </Typography>

          {/* Trial Countdown - Show only if trial is ACTUALLY active */} 
          {trialIsCurrentlyActive && userData?.fimTeste && (
            <Box className={styles.trialCountdownSection}>
              <Typography variant="body1" className={styles.trialCountdownTitle}>
                ⏰ Seu teste gratuito termina em:
              </Typography>
              <Countdown
                date={new Date(userData.fimTeste)}
                renderer={({ days, hours, minutes, seconds, completed }) => {
                  if (completed) {
                    return (
                      <Typography className={styles.trialExpiredMessage}>
                        Teste Expirado!
                      </Typography>
                    );
                  }
                  return (
                    <Box className={styles.countdownTimerWrapper}>
                      {[days, hours, minutes, seconds].map((value, index) => (
                        <Zoom key={index} in={true} style={{ transitionDelay: `${index * 150}ms` }}>
                          <Box className={styles.countdownSegment}>
                            <Typography className={styles.countdownValue}>{value}</Typography>
                            <Typography className={styles.countdownLabel}>
                              {["Dias", "Horas", "Minutos", "Segundos"][index]}
                            </Typography>
                          </Box>
                        </Zoom>
                      ))}
                    </Box>
                  );
                }}
              />
            </Box>
          )}

          {/* Trial Expired Alert - Show only if trial was used AND expired */} 
          {trialHasExpired && userHasUsedTrial && (
            <Alert severity="warning" className={styles.trialExpiredAlert}>
              Seu teste gratuito expirou. Para continuar aproveitando todos os recursos, por favor, escolha um plano pago.
            </Alert>
          )}

          {/* Monthly/Annual Toggle */} 
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <ToggleButtonGroup
              value={planType}
              exclusive
              onChange={handlePlanTypeChange}
              aria-label="Tipo de plano"
              className={styles.planToggleGroup}
            >
              <ToggleButton 
                value="monthly" 
                aria-label="Mensal"
                className={`${styles.planToggleButton} ${planType === 'monthly' ? styles.planToggleButtonSelected : ''}`}
              >
                Pagamento Mensal
              </ToggleButton>
              <ToggleButton 
                value="annual" 
                aria-label="Anual"
                className={`${styles.planToggleButton} ${planType === 'annual' ? styles.planToggleButtonSelected : ''}`}
              >
                Pagamento Anual (Economize!)
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Annual Discount Info Box */} 
          {planType === 'annual' && (
            <Fade in={planType === 'annual'} timeout={500}>
              <Box className={styles.annualDiscountBox}>
                <Typography variant="body1" className={styles.annualDiscountText}>
                  <TrophyIcon className={styles.annualDiscountIcon} />
                  Ótima escolha! Economize 10% e ganhe meses extras com o plano anual!
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Plans Grid - Adjusted Logic using local userData */} 
          <Grid container spacing={4} className={styles.planGrid} justifyContent="center">
            {planos[planType].map((plano) => {
              const isCurrentPlan = currentPlanName === plano.nome.toLowerCase();
              const canStartTrialForThisPlan = 
                !isCurrentPlan &&
                plano.preco > 0 &&
                !userHasUsedTrial;
              const showDiscountButton = 
                !isCurrentPlan &&
                plano.preco > 0 &&
                trialIsCurrentlyActive &&
                !userData?.descontoAplicado;
              
              let cardClasses = [styles.planCard];
              if (plano.popular) cardClasses.push(styles.planCardPopular);
              if (plano.premium) cardClasses.push(styles.planCardPremium);
              if (isCurrentPlan) cardClasses.push(styles.planCardCurrent);

              return (
                <Grid item xs={12} sm={6} md={4} key={plano.id}>
                  <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={500 + planos[planType].findIndex(p => p.id === plano.id) * 100}>
                    <Card
                      className={cardClasses.join(' ')}
                      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                      {plano.popular && (
                        <Box className={styles.popularBadge}>
                          <StarIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                          Mais Popular
                        </Box>
                      )}

                      <CardContent 
                        className={styles.cardContent}
                        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                      >
                        <Typography variant="h5" className={styles.cardTitle}>
                          {plano.nome}
                        </Typography>
                        
                        <PriceDisplay plan={plano} planType={planType} />

                        <Box sx={{ my: 2, textAlign: 'left', flexGrow: 1 }}>
                          <ul className={styles.featureList}>
                            {plano.recursos.map((item, idx) => (
                              <li key={idx} className={styles.featureItem}>
                                <CheckCircleIcon className={styles.featureIcon} />
                                <Typography variant="body2" className={styles.featureText}>{item}</Typography>
                              </li>
                            ))}
                          </ul>
                        </Box>

                        {isCurrentPlan && (
                          <Chip
                            label={trialIsCurrentlyActive ? "Em Teste Gratuito" : "Seu Plano Atual"}
                            color={trialIsCurrentlyActive ? "warning" : "success"}
                            icon={trialIsCurrentlyActive ? <InfoIcon /> : <CheckCircleIcon />}
                            size="small"
                            className={styles.currentPlanChip}
                            sx={{ mb: 2, fontWeight: 600, alignSelf: 'center' }}
                          />
                        )}

                        <Box sx={{ mt: 'auto' }} className={styles.buttonGroup}>
                          {isCurrentPlan ? (
                            <Button
                              variant="contained"
                              fullWidth
                              disabled
                              className={`${styles.actionButton} ${styles.buttonDisabled}`}
                            >
                              {trialIsCurrentlyActive ? "Teste Ativo" : "Plano Ativo"}
                            </Button>
                          ) : canStartTrialForThisPlan ? (
                            <Tooltip title="Inicie um teste gratuito de 7 dias sem compromisso">
                              <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => handleOpenDialog(plano)}
                                className={`${styles.actionButton} ${styles.buttonTrial}`}
                                disabled={updatingPlan}
                                endIcon={updatingPlan ? <CircularProgress size={20} className={styles.buttonSpinner} /> : <ArrowRightIcon className={styles.buttonIcon} />}
                              >
                                {updatingPlan ? "Processando..." : "Iniciar 7 dias grátis"}
                              </Button>
                            </Tooltip>
                          ) : showDiscountButton ? (
                            <Tooltip title={`Aproveite ${planType === 'annual' ? '10%' : '5%'} de desconto ao assinar durante o teste!`}>
                              <Button
                                variant="contained"
                                fullWidth
                                onClick={() => comprarPlano(plano, planType)}
                                className={`${styles.actionButton} ${styles.buttonDiscount}`}
                                disabled={updatingPlan}
                                endIcon={updatingPlan ? <CircularProgress size={20} className={styles.buttonSpinner} /> : <ArrowRightIcon className={styles.buttonIcon} />}
                              >
                                {updatingPlan ? "Processando..." : `Pagar com ${planType === 'annual' ? '10%' : '5%'} OFF (${planType === 'monthly' ? 'Mensal' : 'Anual'})`}
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip
                              title={
                                plano.preco === 0 
                                  ? "Mudar para o plano gratuito"
                                  : `Assinar plano ${plano.nome} (${planType === 'monthly' ? 'Mensal' : 'Anual'})`
                              }
                            >
                              <Button
                                variant="contained"
                                fullWidth
                                onClick={() => comprarPlano(plano, planType)}
                                className={`${styles.actionButton} ${plano.preco === 0 ? styles.buttonSecondary : styles.buttonPrimary}`}
                                disabled={updatingPlan}
                                endIcon={updatingPlan ? <CircularProgress size={20} className={styles.buttonSpinner} /> : <ArrowRightIcon className={styles.buttonIcon} />}
                              >
                                {updatingPlan ? "Processando..." : 
                                plano.preco === 0 ? "Mudar para Gratuito" : 
                                `Assinar ${planType === 'monthly' ? 'Mensal' : 'Anual'}`}
                              </Button>
                            </Tooltip>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Slide>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Slide>

      {/* Trial Confirmation Dialog */} 
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="trial-dialog-title"
        className={styles.dialogRoot}
        PaperProps={{ className: styles.dialogPaper }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="trial-dialog-title" className={styles.dialogTitleSection}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StarIcon color="primary" className={styles.dialogTitleIcon} />
            <span className={styles.dialogTitleText}>Confirmar Início do Teste Gratuito</span>
          </Box>
        </DialogTitle>
        <DialogContent className={styles.dialogContentSection}>
          <Typography variant="body1" paragraph className={styles.dialogContentText}>
            Você está prestes a iniciar um teste gratuito de 7 dias do plano{" "}
            <strong>{selectedPlan?.nome}</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph className={styles.dialogContentSubtext}>
            Aproveite o acesso completo aos recursos premium durante este período!
          </Typography>
          <Box className={styles.dialogInfoBox}>
            <Typography variant="body2" className={styles.dialogInfoText}>
              <span className={styles.dialogInfoIcon}>⚠️</span>
              Atenção: Esta é sua única chance de testar gratuitamente.
            </Typography>
            <ul className={styles.dialogInfoList}>
              <li className={styles.dialogInfoListItem}>
                <Typography variant="body2">Após 7 dias, escolha assinar ou retorne ao plano Free.</Typography>
              </li>
            </ul>
          </Box>
        </DialogContent>
        <DialogActions className={styles.dialogActionsSection}>
          <Button
            onClick={handleCloseDialog}
            className={`${styles.actionButton} ${styles.dialogButtonCancel}`}
            disabled={updatingPlan}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => iniciarTeste(selectedPlan)}
            className={`${styles.actionButton} ${styles.dialogButtonConfirm}`}
            disabled={updatingPlan}
            endIcon={updatingPlan ? <CircularProgress size={20} className={styles.buttonSpinner} /> : <ArrowRightIcon className={styles.buttonIcon} />}
          >
            {updatingPlan ? "Confirmando..." : "Confirmar Teste"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlanoUpgrade;