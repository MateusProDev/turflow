import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig'; // Ajuste o caminho conforme necessário
import { setDoc, doc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import JSConfetti from 'js-confetti';
import { FiArrowLeft, FiArrowRight, FiCheck, FiUpload, FiShoppingBag, FiTag, FiImage, FiDollarSign } from 'react-icons/fi';
import './CreateStore.css'; // Certifique-se que o CSS está correto

const CreateStore = ({ onStoreCreated }) => {
  const steps = [
    { title: 'Nome da Agência', description: 'Como sua agência será chamada?', icon: <FiShoppingBag size={24} /> },
    { title: 'Segmento de Turismo', description: 'Qual o segmento principal da sua agência?', icon: <FiTag size={24} /> },
    { title: 'Logo', description: 'Adicione o logo da sua agência', icon: <FiImage size={24} /> },
    { title: 'Plano', description: 'Escolha o plano ideal para sua agência', icon: <FiDollarSign size={24} /> },
    { title: 'Confirmação', description: 'Revise os dados e finalize', icon: <FiCheck size={24} /> }
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [nomeLoja, setNomeLoja] = useState('');
  const [segmento, setSegmento] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [plano, setPlano] = useState('free'); // Default to free
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [jsConfetti, setJsConfetti] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  useEffect(() => {
    setJsConfetti(new JSConfetti());
    if (location.state?.selectedPlan) {
      setPlano(location.state.selectedPlan);
    }
  }, [location.state]);

  useEffect(() => {
    if (showSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showSuccess && countdown === 0) {
      navigate('/dashboard');
    }
  }, [showSuccess, countdown, navigate]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadPreset = process.env.REACT_APP_UPLOAD_PRESET;
    const cloudName = process.env.REACT_APP_CLOUD_NAME;
    if (!uploadPreset || !cloudName) {
      setErrorMsg('Configuração de upload de imagem ausente.');
      console.error('Cloudinary upload preset or cloud name is missing.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    setLoading(true);
    setUploadProgress(0);
    setErrorMsg('');

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,  {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.secure_url);
        setUploadProgress(100);
      } else {
        const errorData = await response.json();
        throw new Error(`Erro no upload: ${errorData.error?.message || response.statusText}`);
      }
    } catch (err) {
      console.error('Erro no upload da imagem:', err);
      setErrorMsg(`Erro ao enviar imagem: ${err.message}. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = () => {
    setErrorMsg('');
    switch (currentStep) {
      case 0:
        if (!nomeLoja.trim()) {
          setErrorMsg('Por favor, insira o nome da sua agência');
          return false;
        }
        if (nomeLoja.length < 3) {
          setErrorMsg('O nome da agência deve ter pelo menos 3 caracteres');
          return false;
        }
        break;
      case 1:
        if (!segmento.trim()) {
          setErrorMsg('Por favor, insira o segmento da sua agência');
          return false;
        }
        break;
      case 2:
        // Logo é opcional, mas pode ser obrigatório se quiser
        break;
      case 3:
        if (!plano) {
          setErrorMsg('Por favor, selecione um plano');
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setErrorMsg('');
  };

  const handleCreateStore = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const agora = new Date();
      const inicioTimestamp = serverTimestamp();
      let fimTesteDate = null;

      if (plano !== 'free') {
        fimTesteDate = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      const fimTesteISO = fimTesteDate ? fimTesteDate.toISOString() : null;

      const slug = nomeLoja.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');

      const footerData = {
        descricao: "",
        endereco: "",
        social: {
          instagram: "",
          facebook: "",
          twitter: "",
          youtube: ""
        },
        extras: []
      };

      const agenciaData = {
        nome: nomeLoja,
        segmento,
        logoUrl: logoUrl || null,
        plano,
        donoUid: user.uid,
        status: 'ativa',
        slug,
        criadaEm: inicioTimestamp,
        atualizadaEm: inicioTimestamp,
        categorias: [],
        footer: footerData,
        tipo: 'agencia_turismo',
        configs: {
          corPrimaria: '#4a6bff',
          corSecundaria: '#2541b2',
          tema: 'claro'
        },
        // --- CAMPOS PARA DOMÍNIO CUSTOMIZADO ---
        customDomain: "",
        domainVerified: false,
        domainDNSRecords: [],
        vercelDomainStatus: {},
        // --- FIM CAMPOS DOMÍNIO ---
      };

      let usuarioDataUpdate;

      if (plano === 'free') {
        usuarioDataUpdate = {
          plano: 'free',
          planoAtivo: true,
          testeGratuito: false,
          emTeste: false,
          hasUsedTrial: false,
          inicioTeste: null,
          fimTeste: null,
          expiracaoPlano: null,
          dataInicioPlano: inicioTimestamp,
          pagamentoConfirmado: false,
          descontoAplicado: false,
          storeCreated: true,
          ultimoLogin: inicioTimestamp,
          updatedAt: inicioTimestamp,
        };
      } else {
        usuarioDataUpdate = {
          plano,
          planoAtivo: true,
          testeGratuito: true,
          emTeste: true,
          hasUsedTrial: false,
          inicioTeste: inicioTimestamp,
          fimTeste: fimTesteISO,
          expiracaoPlano: null,
          dataInicioPlano: inicioTimestamp,
          pagamentoConfirmado: false,
          descontoAplicado: false,
          storeCreated: true,
          ultimoLogin: inicioTimestamp,
          updatedAt: inicioTimestamp,
        };
      }

      const batch = writeBatch(db);
      const agenciaRef = doc(db, 'lojas', user.uid);
      const userRef = doc(db, 'usuarios', user.uid);

      batch.set(agenciaRef, agenciaData);
      batch.set(userRef, usuarioDataUpdate, { merge: true });

      await batch.commit();

      if (onStoreCreated) onStoreCreated();
      if (jsConfetti) {
        jsConfetti.addConfetti({
          emojis: ['🧳', '✈️', '🏝️', '🌎', '🎉'],
          emojiSize: 50,
          confettiNumber: 100,
        });
      }

      setShowSuccess(true);
    } catch (err) {
      setErrorMsg(`Erro ao criar agência: ${err.message}. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content-inner">
            <div className="form-group mb-4">
              <label className="form-label-custom">Nome da Agência*</label>
              <input
                value={nomeLoja}
                onChange={(e) => setNomeLoja(e.target.value)}
                placeholder="Ex: TurFlow Viagens, MundoTur, Roteiros Incríveis"
                className="form-control-custom"
                required
                maxLength={50}
              />
              <small className="form-text-custom">
                Este será o nome que seus clientes verão (máx. 50 caracteres)
              </small>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="step-content-inner">
            <div className="form-group mb-4">
              <label className="form-label-custom">Segmento de Turismo*</label>
              <input
                value={segmento}
                onChange={(e) => setSegmento(e.target.value)}
                placeholder="Ex: Ecoturismo, Viagens Corporativas, Pacotes Nacionais, Cruzeiros, etc."
                className="form-control-custom"
                required
                maxLength={30}
              />
              <small className="form-text-custom">
                Escolha o segmento que melhor descreve sua agência
              </small>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="step-content-inner">
            <div className="form-group mb-4">
              <label className="form-label-custom">Logo da Agência (Opcional)</label>
              <div className="file-upload-wrapper">
                <label className="file-upload-label">
                  <FiUpload className="me-2" />
                  {uploadProgress > 0 && loading ? 'Enviando...' : logoUrl ? 'Alterar Logo' : 'Selecionar Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const uploadPreset = process.env.REACT_APP_UPLOAD_PRESET;
                      const cloudName = process.env.REACT_APP_CLOUD_NAME;
                      if (!uploadPreset || !cloudName) {
                        setErrorMsg('Configuração de upload de imagem ausente.');
                        return;
                      }
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('upload_preset', uploadPreset);
                      setLoading(true);
                      setUploadProgress(0);
                      setErrorMsg('');
                      try {
                        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                          method: 'POST',
                          body: formData,
                        });
                        if (response.ok) {
                          const data = await response.json();
                          setLogoUrl(data.secure_url);
                          setUploadProgress(100);
                        } else {
                          const errorData = await response.json();
                          throw new Error(`Erro no upload: ${errorData.error?.message || response.statusText}`);
                        }
                      } catch (err) {
                        setErrorMsg(`Erro ao enviar imagem: ${err.message}. Tente novamente.`);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  />
                </label>
                {uploadProgress > 0 && (
                  <div className="upload-progress">
                    <div style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                {logoUrl && (
                  <div className="image-preview-wrapper">
                    <div className="image-preview-container">
                      <img src={logoUrl} alt="Logo preview" className="image-preview" />
                    </div>
                  </div>
                )}
              </div>
              <small className="form-text-custom">Formatos aceitos: JPG, PNG, SVG. Tamanho recomendado: 300x300px.</small>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="step-content-inner">
            <div className="form-group mb-4">
              <label className="form-label-custom">Plano*</label>
              <div className="plan-options">
                <div 
                  className={`plan-option ${plano === 'free' ? 'selected' : ''}`}
                  onClick={() => setPlano('free')}
                  tabIndex={0}
                  role="button"
                  aria-pressed={plano === 'free'}
                >
                  <h5>Free</h5>
                  <div className="price">R$0/mês</div>
                  <ul className="plan-features">
                    <li>Até 30 produtos</li>
                    <li>1 imagem por produto</li>
                  </ul>
                  <div className="plan-badge">Básico</div>
                </div>
                <div 
                  className={`plan-option ${plano === 'plus' ? 'selected' : ''}`}
                  onClick={() => setPlano('plus')}
                  tabIndex={0}
                  role="button"
                  aria-pressed={plano === 'plus'}
                >
                  <h5>Plus</h5>
                  <div className="price">R$39,90/mês</div>
                  <ul className="plan-features">
                    <li>Até 300 produtos</li>
                    <li>3 imagens por produto</li>
                    <li>7 dias grátis</li>
                  </ul>
                  <div className="plan-badge popular">Popular</div>
                </div>
                <div 
                  className={`plan-option ${plano === 'premium' ? 'selected' : ''}`}
                  onClick={() => setPlano('premium')}
                  tabIndex={0}
                  role="button"
                  aria-pressed={plano === 'premium'}
                >
                  <h5>Premium</h5>
                  <div className="price">R$99,90/mês</div>
                  <ul className="plan-features">
                    <li>Produtos ilimitados</li>
                    <li>5 imagens por produto</li>
                    <li>7 dias grátis</li>
                  </ul>
                  <div className="plan-badge">Premium</div>
                </div>
              </div>
              <small className="form-text-custom mt-3">
                Você pode alterar seu plano a qualquer momento no painel.
              </small>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="step-content-inner confirmation-step">
            <h5 className="confirmation-title">Confira os dados da sua agência</h5>
            <div className="confirmation-card">
              <div className="confirmation-body">
                <div className="row">
                  <div className="col col-6">
                    <div className="confirmation-item">
                      <span className="confirmation-label">Nome:</span>
                      <span className="confirmation-value">{nomeLoja}</span>
                    </div>
                    <div className="confirmation-item">
                      <span className="confirmation-label">Segmento:</span>
                      <span className="confirmation-value">{segmento}</span>
                    </div>
                    <div className="confirmation-item">
                      <span className="confirmation-label">Plano:</span>
                      <span className="confirmation-value">
                        {plano === 'free' ? 'Free' : 
                         plano === 'plus' ? 'Plus' : 'Premium'}
                         {plano !== 'free' && ' (+ 7 dias grátis)'}
                      </span>
                    </div>
                  </div>
                  <div className="col col-6">
                    <div className="confirmation-image-wrapper">
                      <span className="confirmation-label">Logo:</span>
                      {logoUrl ? (
                        <div className="confirmation-image-container">
                          <img
                            src={logoUrl}
                            alt="Logo preview"
                            className="confirmation-image"
                          />
                        </div>
                      ) : (
                        <div className="text-muted">Nenhum logo</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="create-store-wrapper">
      <div className="create-store-container">
        {/* Progress Steps */}
        <div className="progress-steps-wrapper">
          <div className="progress-steps">
            {steps.map((step, index) => {
              // Em mobile, só mostra o passo atual
              const isCurrent = currentStep === index;
              return (
                <div 
                  key={index}
                  className={`progress-step ${currentStep >= index ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                  style={window.innerWidth <= 700 && !isCurrent ? { display: 'none' } : {}}
                >
                  <div className="step-icon">
                    {currentStep > index ? <FiCheck /> : step.icon}
                  </div>
                  {isCurrent && (
                    <div className="step-info">
                      <div className="step-title">{step.title}</div>
                      <div className="step-description">{step.description}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="progress-bar-main">
            <div
              className="progress-bar-inner"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
        {/* Step Content */}
        <div className="step-content-wrapper">
          {errorMsg && <div className="alert alert-danger error-message">{errorMsg}</div>}
          {renderStepContent()}
        </div>
        {/* Navigation Buttons */}
        <div className="navigation-buttons">
          <button 
            onClick={prevStep} 
            disabled={currentStep === 0 || loading}
            className="btn btn-secondary btn-prev"
          >
            <FiArrowLeft className="me-1" /> Voltar
          </button>
          {/* Corrigir lógica do botão avançar para o passo do plano */}
          {(currentStep < steps.length - 1 && (currentStep !== 3 || plano)) ? (
            <button 
              onClick={nextStep} 
              disabled={loading || (currentStep === 2 && uploadProgress > 0 && uploadProgress < 100) || (currentStep === 3 && !plano)}
              className="btn btn-primary btn-next"
            >
              {currentStep === 2 && loading && uploadProgress < 100 ? (
                <>
                  Enviando Logo...
                  <span className="spinner-border spinner-border-sm ms-2"></span>
                </>
              ) : (
                <>
                  Avançar <FiArrowRight className="ms-1" />
                </>
              )}
            </button>
          ) : (
            currentStep === steps.length - 1 && (
              <button 
                onClick={handleCreateStore} 
                disabled={loading}
                className="btn btn-success btn-create"
              >
                {loading ? 'Criando Loja...' : 'Criar Minha Loja!'}
                {loading && <span className="spinner-border spinner-border-sm ms-2"></span>}
              </button>
            )
          )}
        </div>
      </div>
      {/* Success Overlay */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-content">
            <div className="success-anim-wrapper">
              <FiCheck size={80} className="success-icon" />
              <div className="confetti-anim" id="confetti-anim" />
            </div>
            <h2 className="success-title">Parabéns! Sua agência foi criada 🎉</h2>
            <p className="success-message">Agora você faz parte do TurFlow.<br />Prepare-se para encantar seus clientes!</p>
            <div className="success-countdown">
              <span className="countdown-label">Redirecionando em</span>
              <span className="countdown-number">{countdown}</span>
              <span className="countdown-label">segundos...</span>
            </div>
            <button
              className="btn btn-primary btn-success-view"
              onClick={() => navigate('/dashboard')}
              style={{ marginTop: 18 }}
            >
              Ver minha agência agora
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateStore;