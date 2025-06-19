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
    { title: 'Nome da Loja', description: 'Como sua loja será chamada?', icon: <FiShoppingBag size={24} /> },
    { title: 'Segmento', description: 'Qual o segmento do seu negócio?', icon: <FiTag size={24} /> },
    { title: 'Logo', description: 'Adicione uma imagem para sua loja', icon: <FiImage size={24} /> },
    { title: 'Plano', description: 'Escolha o plano ideal para você', icon: <FiDollarSign size={24} /> },
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
          setErrorMsg('Por favor, insira um nome para sua loja');
          return false;
        }
        if (nomeLoja.length < 3) {
          setErrorMsg('O nome da loja deve ter pelo menos 3 caracteres');
          return false;
        }
        break;
      case 1:
        if (!segmento.trim()) {
          setErrorMsg('Por favor, insira o segmento da sua loja');
          return false;
        }
        break;
      case 2:
        // Logo is optional
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

      const lojaData = {
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
        configs: {
          corPrimaria: '#4a6bff',
          corSecundaria: '#2541b2',
          tema: 'claro'
        },
      };

      let usuarioDataUpdate = {};
      if (plano === 'free') {
        usuarioDataUpdate = {
          plano: 'free',
          planoAtual: 'free',
          planoAtivo: true,
          emTeste: false,
          testeGratuito: false,
          inicioTeste: null,
          fimTeste: null,
          expiracaoPlano: null,
          dataInicioPlano: inicioTimestamp,
          hasUsedTrial: false,
          pagamentoConfirmado: false,
          descontoAplicado: false,
          storeCreated: true,
          ultimoLogin: inicioTimestamp,
          updatedAt: inicioTimestamp,
        };
      } else {
        usuarioDataUpdate = {
          plano: plano,
          planoAtual: plano,
          planoAtivo: false,
          emTeste: true,
          testeGratuito: true,
          inicioTeste: inicioTimestamp,
          fimTeste: fimTesteISO,
          expiracaoPlano: fimTesteISO,
          dataInicioPlano: null,
          hasUsedTrial: true,
          pagamentoConfirmado: false,
          descontoAplicado: false,
          storeCreated: true,
          ultimoLogin: inicioTimestamp,
          updatedAt: inicioTimestamp,
        };
      }

      const batch = writeBatch(db);
      const lojaRef = doc(db, 'lojas', user.uid);
      const userRef = doc(db, 'usuarios', user.uid);

      batch.set(lojaRef, lojaData);
      batch.set(userRef, usuarioDataUpdate, { merge: true });

      // Criação de produto com variantes vazias
      const produtoRef = doc(collection(db, "lojas", user.uid, "produtos"));
      await setDoc(produtoRef, {
        name: "Produto de exemplo",
        price: "49.99",
        anchorPrice: "59.99",
        stock: "55",
        images: [
          "https://res.cloudinary.com/doeiv6m4h/image/upload/v1748384587/ojfxb53zx1dv65r9hxj0.webp" 
        ],
        category: "Camisa",
        description: "Este é um produto de exemplo que você pode editar ou deletar",
        variants: {
          default: "", // Valor padrão vazio
          name: "",   // Nome da variante vazio
          options: []  // Opções vazias
        },
        createdAt: inicioTimestamp,
        updatedAt: inicioTimestamp,
        slug: "produto-exemplo",
        ativo: true,
        prioridade: false,
        priceConditions: [
          {
            quantity: "10",
            pricePerUnit: "45.99"
          },
          {
            quantity: "20",
            pricePerUnit: "40.99"
          }
        ],
        isPlaceholder: true
      });

      await batch.commit();

      if (jsConfetti) {
        jsConfetti.addConfetti({
          emojis: ['🛍️', '💰', '🛒', '💳', '✨', '🎉'],
          emojiSize: 50,
          confettiNumber: 100,
        });
      }

      setShowSuccess(true);
      if (onStoreCreated) onStoreCreated();
    } catch (err) {
      console.error('Erro ao criar loja:', err);
      setErrorMsg(`Erro ao criar loja: ${err.message}. Tente novamente.`);
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
              <label className="form-label-custom">Nome da Loja*</label>
              <input
                value={nomeLoja}
                onChange={(e) => setNomeLoja(e.target.value)}
                placeholder="Ex: Loja da Maria"
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
              <label className="form-label-custom">Segmento*</label>
              <input
                value={segmento}
                onChange={(e) => setSegmento(e.target.value)}
                placeholder="Ex: Roupas, Calçados, Eletrônicos"
                className="form-control-custom"
                required
                maxLength={30}
              />
              <small className="form-text-custom">
                Escolha o segmento que melhor descreve seu negócio
              </small>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="step-content-inner">
            <div className="form-group mb-4">
              <label className="form-label-custom">Logo (Opcional)</label>
              <div className="file-upload-wrapper">
                <label className="file-upload-label">
                  <FiUpload className="me-2" />
                  {uploadProgress > 0 && loading ? 'Enviando...' : logoUrl ? 'Alterar Imagem' : 'Selecionar Imagem'}
                  <input
                    type="file" 
                    onChange={handleFileUpload} 
                    className="file-upload-input" 
                    accept="image/*"
                    disabled={loading}
                  />
                </label>
              </div>
              {loading && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress mt-3" style={{ textAlign: 'center' }}>
                  <div style={{ width: `${uploadProgress}%`, background: 'var(--gradient)', height: 8, borderRadius: 4, marginBottom: 4 }} />
                  <span style={{ fontSize: 14 }}>{uploadProgress}%</span>
                </div>
              )}
              {logoUrl && (
                <div className="image-preview-wrapper mt-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="image-preview-container" style={{ maxWidth: 140, maxHeight: 140, width: '100%', height: '100%' }}>
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="image-preview"
                      style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                    />
                  </div>
                </div>
              )}
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
            <h5 className="confirmation-title">Confira os dados da sua loja</h5>
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
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`progress-step ${currentStep >= index ? 'active' : ''} ${currentStep === index ? 'current' : ''}`}
              >
                <div className="step-icon">
                  {currentStep > index ? <FiCheck /> : step.icon}
                </div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  {currentStep === index && (
                    <div className="step-description">{step.description}</div>
                  )}
                </div>
              </div>
            ))}
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
          {currentStep < steps.length - 1 ? (
            <button 
              onClick={nextStep} 
              disabled={loading || (currentStep === 2 && uploadProgress > 0 && uploadProgress < 100)}
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
            <button 
              onClick={handleCreateStore} 
              disabled={loading}
              className="btn btn-success btn-create"
            >
              {loading ? 'Criando Loja...' : 'Criar Minha Loja!'}
              {loading && <span className="spinner-border spinner-border-sm ms-2"></span>}
            </button>
          )}
        </div>
      </div>
      {/* Success Overlay */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-content">
            <FiCheck size={80} className="success-icon" />
            <h2>Loja Criada com Sucesso!</h2>
            <p>Você será redirecionado para o painel em {countdown} segundos...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateStore;