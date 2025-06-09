import React, { useState, useEffect } from 'react';
import { FaGoogle, FaLock } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './AuthForm.css';

const AuthForm = ({ initialMode = 'login', onLoginSuccess }) => {
  const location = useLocation();
  const { selectedPlan = 'free' } = location.state || {};
  const [isRegistering, setIsRegistering] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    setIsRegistering(initialMode === 'signup');
    const lockedUntil = localStorage.getItem('authLockUntil');
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      setIsLocked(true);
      const timeRemaining = new Date(lockedUntil) - new Date();
      const unlockTimer = setTimeout(() => {
        setIsLocked(false);
        localStorage.removeItem('authLockUntil');
        setLoginAttempts(0);
      }, timeRemaining);
      return () => clearTimeout(unlockTimer);
    }
  }, [initialMode]);

  const criarUsuarioNoFirestore = async (user) => {
    const userRef = doc(db, 'usuarios', user.uid);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) {
      await setDoc(userRef, {
        email: user.email,
        nome: user.displayName || '',
        storeCreated: false,
        plano: selectedPlan,
        planoAtual: selectedPlan,
        criadoEm: serverTimestamp(),
        atualizadaEm: serverTimestamp(),
        descontoAplicado: false,
        pagamentoConfirmado: false,
        planoAtivo: false,
        ultimoLogin: serverTimestamp()
      });
      navigate('/criar-loja', { state: { selectedPlan } });
    } else {
      await setDoc(userRef, {
        ultimoLogin: serverTimestamp(),
        atualizadaEm: serverTimestamp()
      }, { merge: true });
      if (onLoginSuccess) onLoginSuccess();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (resetPasswordMode) {
      handleResetPassword();
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        if (loginAttempts >= 5) {
          const lockUntil = new Date(new Date().getTime() + 15 * 60000);
          localStorage.setItem('authLockUntil', lockUntil.toISOString());
          setIsLocked(true);
          setError('Muitas tentativas de login. Tente novamente em 15 minutos ou use a recuperação de senha.');
          setLoading(false);
          return;
        }
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        setLoginAttempts(0);
        localStorage.removeItem('authLockUntil');
      }
      await criarUsuarioNoFirestore(userCredential.user);
    } catch (err) {
      if (!isRegistering) setLoginAttempts(prev => prev + 1);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está cadastrado. Tente fazer login.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas de login. Tente recuperar sua senha.');
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const handleLoginWithGoogle = async () => {
    setLoadingProvider(true);
    setError('');
    setSuccessMessage('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await criarUsuarioNoFirestore(result.user);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelado. Tente novamente.');
      } else {
        setError('Erro ao fazer login com Google. Tente novamente.');
      }
      setLoadingProvider(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Digite seu email para recuperar a senha.');
      return;
    }
    setLoadingReset(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Email de recuperação enviado. Verifique sua caixa de entrada.');
      setResetPasswordMode(false);
      setLoginAttempts(0);
      localStorage.removeItem('authLockUntil');
      setIsLocked(false);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('Não existe conta com este email.');
      } else {
        setError('Erro ao enviar email de recuperação. Tente novamente.');
      }
    } finally {
      setLoadingReset(false);
    }
  };

  const toggleAuthMode = (value) => {
    const isSignup = value === 1;
    setIsRegistering(isSignup);
    setResetPasswordMode(false);
    setError('');
    setSuccessMessage('');
    navigate(isSignup ? '/signup' : '/login', { state: { selectedPlan }, replace: true });
  };

  return (
    <div className="auth-container mt-5">
      <div className="auth-card">
        <div className="auth-header text-center">
          <h2 className="mb-4">
            {resetPasswordMode 
              ? 'Recuperar Senha' 
              : isRegistering 
                ? 'Criar Conta' 
                : 'Entrar'
            }
          </h2>
          {!resetPasswordMode && (
            <div className="auth-toggle mb-4">
              <button
                type="button"
                className={`toggle-btn ${!isRegistering ? 'active' : ''}`}
                onClick={() => toggleAuthMode(0)}
              >
                Entrar
              </button>
              <button
                type="button"
                className={`toggle-btn ${isRegistering ? 'active' : ''}`}
                onClick={() => toggleAuthMode(1)}
              >
                Criar Conta
              </button>
            </div>
          )}
          {error && <div className="alert alert-danger">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {isLocked && (
            <div className="alert alert-warning d-flex align-items-center">
              <FaLock size={20} style={{ marginRight: 8 }} />
              <span>
                Conta temporariamente bloqueada devido a muitas tentativas de login.
                Use a recuperação de senha ou tente novamente mais tarde.
              </span>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="mb-3">
            <label>Email</label>
            <input
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          <div className="mb-3">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="auth-input"
            />
          </div>
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            Entrar
          </button>
        </form>
        {!resetPasswordMode && !isRegistering && (
            <div className="text-center mt-2">
              <button 
                type="button"
                className="forgot-password-link"
                onClick={() => setResetPasswordMode(true)}
              >
                Esqueceu sua senha?
              </button>
            </div>
          )}
          {resetPasswordMode && (
            <div className="text-center mt-2">
              <button 
                type="button"
                className="back-to-login-link"
                onClick={() => setResetPasswordMode(false)}
              >
                Voltar para o login
              </button>
            </div>
          )}
        {!resetPasswordMode && (
          <div className="auth-separator">
            <span>ou</span>
          </div>
        )}
        {!resetPasswordMode && (
          <button
            type="button"
            onClick={handleLoginWithGoogle}
            disabled={loadingProvider || isLocked}
            className="google-button w-100"
          >
            <FaGoogle className="me-2" />
            {loadingProvider ? 'Carregando...' : 'Entrar com Google'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthForm;