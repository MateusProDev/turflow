import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Verifica o status do plano de um usuário e atualiza se necessário
 * @param {string} uid - ID do usuário
 * @returns {Promise<Object|null>} - Retorna os dados atualizados do usuário ou null se não houver mudanças
 */
export const verificarPlanoUsuario = async (uid) => {
  try {
    const userRef = doc(db, 'usuarios', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error(`Usuário ${uid} não encontrado`);
      return null;
    }
    
    const userData = userSnap.data();
    let atualizacoes = null;
    const agora = new Date();
    
    // Validar campos opcionais
    const expiracaoPlano = userData?.expiracaoPlano;
    const emTeste = userData?.emTeste;
    const planoAtivo = userData?.planoAtivo;
    const plano = userData?.plano;

    // Verificar se o usuário está em período de teste
    if (emTeste && expiracaoPlano) {
      const expiracao = new Date(expiracaoPlano);
      if (agora > expiracao) {
        atualizacoes = {
          plano: 'free',
          planoAtual: 'free',
          expiracaoPlano: null,
          dataInicioPlano: null,
          emTeste: false,
          testeGratuito: true,
          planoAtivo: false,
          pagamentoConfirmado: false,
          atualizadoEm: serverTimestamp()
        };
      }
    }
    
    // Verificar planos pagos ativos (não em teste)
    else if (!emTeste && planoAtivo && expiracaoPlano) {
      const expiracao = new Date(expiracaoPlano);
      if (agora > expiracao) {
        atualizacoes = {
          plano: 'free',
          planoAtual: 'free',
          expiracaoPlano: null,
          dataInicioPlano: null,
          planoAtivo: false,
          pagamentoConfirmado: false,
          atualizadoEm: serverTimestamp()
        };
      }
    }

    // Atualizações de segurança para campos opcionais
    if (atualizacoes) {
      await updateDoc(userRef, atualizacoes);
      console.log(`Usuário ${uid} atualizado para plano ${atualizacoes.plano}`);
      return { ...userData, ...atualizacoes };
    }
    
    return null;

  } catch (err) {
    console.error('Erro ao verificar plano:', err);
    throw new Error(`Falha ao verificar plano do usuário ${uid}: ${err.message}`);
  }
};

/**
 * Verifica se um usuário pode iniciar um teste gratuito
 * @param {Object} userData - Dados do usuário
 * @returns {boolean} - Retorna true se o usuário pode iniciar um teste
 */
export const podeIniciarTeste = (userData) => {
  // Verifica campos opcionais com operador optional chaining
  return (
    !(userData?.testeGratuito) &&
    !(
      userData?.planoAtivo &&
      userData?.plano !== 'free'
    )
  );
};

/**
 * Inicia um período de teste para um usuário
 * @param {string} uid - ID do usuário
 * @param {string} plano - Nome do plano ('plus' ou 'premium')
 * @returns {Promise<Object>} - Retorna os dados atualizados do usuário
 */
export const iniciarTeste = async (uid, plano) => {
  if (!['plus', 'premium'].includes(plano)) {
    throw new Error(`Plano '${plano}' inválido para teste gratuito`);
  }
  
  const userRef = doc(db, 'usuarios', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    throw new Error(`Usuário ${uid} não encontrado`);
  }
  
  const userData = userSnap.data();
  
  if (!podeIniciarTeste(userData)) {
    throw new Error(`Usuário ${uid} não pode iniciar teste`);
  }
  
  // Usar serverTimestamp para datas críticas
  const inicioTeste = serverTimestamp();
  const expiracaoDate = new Date();
  expiracaoDate.setDate(expiracaoDate.getDate() + 7);

  const atualizacoes = {
    plano: plano,
    planoAtual: plano,
    dataInicioPlano: inicioTeste,
    expiracaoPlano: expiracaoDate.toISOString(),
    emTeste: true,
    testeGratuito: true,
    inicioTeste: inicioTeste,
    fimTeste: expiracaoDate.toISOString(),
    planoAtivo: false,
    pagamentoConfirmado: false,
    atualizadoEm: serverTimestamp()
  };
  
  await updateDoc(userRef, atualizacoes);
  
  return {
    ...userData,
    ...atualizacoes
  };
};