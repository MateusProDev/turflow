import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust path as needed
import { getAuth } from "firebase/auth";

const UserPlanContext = createContext();

export const UserPlanProvider = ({ children }) => {
  const [userPlan, setUserPlan] = useState("free"); // The effective plan shown to user
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [trialData, setTrialData] = useState({
    testeGratuito: false, // Is the user *currently* in an active trial?
    fimTeste: null,       // When does the current or past trial end/ended?
    inicioTeste: null,    // When did the current or past trial start?
    planoAtivo: false,    // Is there an active *paid* subscription?
    hasUsedTrial: false,  // Did the user ever use a trial?
    planoEmTeste: null,   // Which plan is/was being trialed?
  });

  // Function to create a basic user document if it doesn't exist
  const createBasicUserDoc = useCallback(async (uid) => {
    try {
      const userRef = doc(db, "usuarios", uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const now = serverTimestamp();
        const basicData = {
          plano: "free", // Ensure 'plano' is the primary field
          // planoAtual: "free", // Removed planoAtual for simplicity
          planoAtivo: true, // Free plan is considered active by default
          testeGratuito: false,
          emTeste: false,
          hasUsedTrial: false,
          inicioTeste: null,
          fimTeste: null,
          expiracaoPlano: null,
          dataInicioPlano: null,
          pagamentoConfirmado: false,
          descontoAplicado: false,
          storeCreated: false,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userRef, basicData);
        console.log(`Documento básico criado para usuário ${uid}`);
        // Set initial state after creation
        setUserPlan("free");
        setTrialData({
          testeGratuito: false,
          fimTeste: null,
          inicioTeste: null,
          planoAtivo: true,
          hasUsedTrial: false,
          planoEmTeste: null,
        });
      }
    } catch (err) {
      console.error("Erro ao criar/verificar documento básico do usuário:", err);
      setError("Erro ao inicializar sua conta. Contate o suporte.");
    }
  }, []);

  // Function to update the corresponding loja document plan
  const updateLojaPlano = useCallback(async (uid, plano) => {
    try {
      const lojaRef = doc(db, "lojas", uid);
      // Use setDoc with merge to safely update or create if needed
      await setDoc(lojaRef, { 
          plano: plano, // Ensure loja also uses 'plano'
          updatedAt: serverTimestamp() 
      }, { merge: true });
      console.log(`Plano da loja ${uid} sincronizado para: ${plano}`);
    } catch (err) {
      console.warn("Aviso: Erro ao sincronizar plano na loja:", err);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeUser = () => {}; // Initialize with a no-op function

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      unsubscribeUser();

      if (user) {
        setUserId(user.uid);
        setLoading(true);
        setError(null);

        await createBasicUserDoc(user.uid);

        const userRef = doc(db, "usuarios", user.uid);
        unsubscribeUser = onSnapshot(
          userRef,
          (userSnap) => {
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const now = new Date();

              // --- Determine Trial Status --- 
              const fimTesteDate = userData.fimTeste ? new Date(userData.fimTeste) : null;
              const isCurrentlyInActiveTrial = 
                  userData.emTeste === true && 
                  fimTesteDate && 
                  fimTesteDate > now;
              const hasUsedTrialBefore = userData.hasUsedTrial === true;
              
              // --- STRICT PLAN DETERMINATION --- 
              // Use ONLY the 'plano' field. Default to 'free' if missing.
              const effectivePlan = userData.plano || "free";
              
              const hasActivePaidSubscription = 
                  userData.planoAtivo === true && 
                  !isCurrentlyInActiveTrial && 
                  effectivePlan !== 'free';

              // --- Set Context State --- 
              setUserPlan(effectivePlan); 

              setTrialData({
                testeGratuito: isCurrentlyInActiveTrial,
                fimTeste: userData.fimTeste || null,
                inicioTeste: userData.inicioTeste || null,
                planoAtivo: hasActivePaidSubscription,
                hasUsedTrial: hasUsedTrialBefore,
                planoEmTeste: isCurrentlyInActiveTrial ? effectivePlan : null, 
              });

              // Sync the effective plan name to the loja document
              updateLojaPlano(user.uid, effectivePlan); 

              console.log("Context Updated (Strict):", { 
                plan: effectivePlan, 
                trialActive: isCurrentlyInActiveTrial, 
                usedTrial: hasUsedTrialBefore 
              });

            } else {
              console.warn(`Documento do usuário ${user.uid} não encontrado.`);
              setUserPlan("free");
              setTrialData({
                testeGratuito: false, fimTeste: null, inicioTeste: null,
                planoAtivo: true, hasUsedTrial: false, planoEmTeste: null,
              });
              setError("Não foi possível carregar os dados do usuário.");
            }
            setLoading(false);
          },
          (err) => {
            console.error("Erro no listener do plano do usuário (onSnapshot):", err);
            setError("Não foi possível carregar as informações do plano. Tente recarregar.");
            setUserPlan("free");
            setTrialData({
              testeGratuito: false, fimTeste: null, inicioTeste: null,
              planoAtivo: true, hasUsedTrial: false, planoEmTeste: null,
            });
            setLoading(false);
          }
        );
      } else {
        // User logged out
        setUserId(null);
        setUserPlan("free");
        setTrialData({
          testeGratuito: false, fimTeste: null, inicioTeste: null,
          planoAtivo: true, hasUsedTrial: false, planoEmTeste: null,
        });
        setLoading(false);
        setError(null);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, [createBasicUserDoc, updateLojaPlano]);

  const value = React.useMemo(() => ({
    userPlan,
    loading,
    error,
    userId,
    trialData,
    isTrialActive: () => trialData.testeGratuito,
    isTrialExpired: () => {
      return trialData.hasUsedTrial && trialData.fimTeste && new Date() > new Date(trialData.fimTeste);
    },
  }), [userPlan, loading, error, userId, trialData]);

  return (
    <UserPlanContext.Provider value={value}>
      {children}
    </UserPlanContext.Provider>
  );
};

export const useUserPlan = () => {
  const context = useContext(UserPlanContext);
  if (context === undefined) {
    throw new Error("useUserPlan deve ser usado dentro de um UserPlanProvider");
  }
  return context;
};

