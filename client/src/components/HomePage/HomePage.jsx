import React, { useState, useEffect } from 'react';
import { FaStore, FaShoppingCart, FaChartLine, FaLock, FaBars, FaWhatsapp, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWhatsappNotification, setShowWhatsappNotification] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = (plan = 'free') => {
    navigate('/signup', { 
      state: { 
        selectedPlan: plan 
      } 
    });
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleWhatsappNotification = () => {
    setShowWhatsappNotification(!showWhatsappNotification);
  };

  // Auto-rotate features every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <FaStore />,
      title: "Loja Personalizada",
      description: "Crie sua loja virtual em minutos com seu próprio domínio e identidade visual"
    },
    {
      icon: <FaShoppingCart />,
      title: "Gestão de Produtos",
      description: "Adicione, edite e organize seus produtos com facilidade"
    },
    {
      icon: <FaLock />,
      title: "Pagamentos Seguros",
      description: "Diversas opções de pagamento com segurança e confiabilidade"
    },
    {
      icon: <FaChartLine />,
      title: "Relatórios Avançados",
      description: "Acompanhe suas vendas e crescimento com dados em tempo real"
    }
  ];

  const plans = [
    {
      name: "Free",
      price: "R$0",
      period: "/mês",
      icon: <FaStore />,
      features: [
        "Até 30 produtos",
        "Certificado SSL",
        "Gerenciamento de estoque",
        "Suporte por email"
      ],
      ctaText: "Começar Gratuitamente",
      featured: false
    },
    {
      name: "Plus",
      price: "R$39,90",
      period: "/mês",
      icon: <FaShoppingCart />,
      features: [
        "Até 300 produtos",
        "Certificado SSL",
        "Gerenciamento de estoque",
        "Registro de vendas",
        "Relatórios completos",
        "Suporte prioritário",
        "7 dias grátis"
      ],
      ctaText: "Testar Grátis",
      featured: true
    },
    {
      name: "Premium",
      price: "R$99,90",
      period: "/mês",
      icon: <FaChartLine />,
      features: [
        "Produtos ilimitados",
        "Certificado SSL",
        "Gerenciamento de estoque",
        "Registro de vendas",
        "Relatórios avançados",
        "Suporte 24/7",
        "7 dias grátis",
        "Consultoria mensal"
      ],
      ctaText: "Testar Grátis",
      featured: false
    }
  ];

  const clients = [
    { name: "BenCommerce", logo: "/Ben.png" },
    { name: "BenCommerce", logo: "/Ben.png" },
    { name: "BenCommerce", logo: "/Ben.png" },
    { name: "BenCommerce", logo: "/Ben.png" },
    { name: "BenCommerce", logo: "/Ben.png" },
    { name: "BenCommerce", logo: "/Ben.png" },
    { name: "BenCommerce", logo: "/Ben.png" },
    { name: "BenCommerce", logo: "/Ben.png" }
  ];

  return (
    <div className="homepage-container">
      {/* Navbar */}
      <nav className="homepage-navbar">
        <div className="homepage-navbar-logo" onClick={() => navigate('/')}>BenCommerce</div>
        {/* Menu Desktop */}
        <ul className="homepage-nav-links">
          <li className="homepage-nav-link" onClick={() => navigate('/')}>Início</li>
          <li className="homepage-nav-link" onClick={() => navigate('/recursos')}>Recursos</li>
          <li className="homepage-nav-link" onClick={() => navigate('/planos')}>Planos</li>
          <li className="homepage-nav-link" onClick={() => navigate('/contato')}>Contato</li>
          <li className="homepage-nav-link" onClick={handleLoginClick}>Login</li>
          <li className="homepage-nav-button" onClick={() => handleSignupClick('free')}>Teste Grátis</li>
        </ul>
        {/* Botão do menu mobile */}
        <button className="homepage-mobile-menu-button toggle-button" onClick={toggleMobileMenu}>
          <FaBars className="homepage-mobile-menu-icon" />
        </button>
        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="homepage-mobile-menu">
            <ul className="homepage-mobile-menu-list">
              <li className="homepage-mobile-menu-item" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>Início</li>
              <li className="homepage-mobile-menu-item" onClick={() => { navigate('/recursos'); setMobileMenuOpen(false); }}>Recursos</li>
              <li className="homepage-mobile-menu-item" onClick={() => { navigate('/planos'); setMobileMenuOpen(false); }}>Planos</li>
              <li className="homepage-mobile-menu-item" onClick={() => { navigate('/contato'); setMobileMenuOpen(false); }}>Contato</li>
              <li className="homepage-mobile-menu-item" onClick={() => { handleLoginClick(); setMobileMenuOpen(false); }}>Login</li>
              <li className="homepage-mobile-menu-button teste-toggle" onClick={() => { handleSignupClick('free'); setMobileMenuOpen(false); }}>Teste Grátis</li>
            </ul>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="homepage-hero">
        <div className="homepage-hero-background">
          <div className="homepage-hero-overlay"></div>
          <div className="homepage-hero-blob homepage-hero-blob-1"></div>
          <div className="homepage-hero-blob homepage-hero-blob-2"></div>
          <div className="homepage-hero-blob homepage-hero-blob-3"></div>
        </div>
        
        <div className="homepage-hero-content">
          <h1 className="homepage-hero-title">Monte sua loja virtual em minutos</h1>
          <p className="homepage-hero-subtitle">A plataforma mais simples para você vender online. Sem complicação, sem mensalidade escondida.</p>
          <div className="homepage-hero-buttons">
            <button 
              onClick={() => handleSignupClick('plus')}
              className="homepage-hero-primary-button"
            >
              Comece Agora
            </button>
            <button 
              onClick={() => navigate('/demo')}
              className="homepage-hero-secondary-button"
            >
              Ver Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="homepage-features">
        <div className="homepage-features-container">
          <h2 className="homepage-features-title">Tudo que você precisa para vender online</h2>
          
          <div className="homepage-features-tabs">
            {features.map((feature, index) => (
              <button
                key={index}
                className={`homepage-features-tab ${activeFeature === index ? 'homepage-features-tab-active' : 'homepage-features-tab-inactive'}`}
                onClick={() => setActiveFeature(index)}
              >
                {feature.title}
              </button>
            ))}
          </div>
          
          <div className="homepage-feature-card">
            <div className="homepage-feature-content">
              <div className="homepage-feature-icon-container">
                <div className="homepage-feature-icon">
                  {features[activeFeature].icon}
                </div>
              </div>
              <div className="homepage-feature-text">
                <h3 className="homepage-feature-name">{features[activeFeature].title}</h3>
                <p className="homepage-feature-description">{features[activeFeature].description}</p>
                <button 
                  className="homepage-feature-button"
                  onClick={() => navigate('/recursos')}
                >
                  Saiba mais
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="homepage-clients">
        <div className="homepage-clients-container">
          <h2 className="homepage-clients-title">Clientes que confiam em nossa plataforma</h2>
          
          <div className="homepage-clients-row">
            <div className="homepage-clients-track">
              {[...clients, ...clients].map((client, index) => (
                <div key={index} className="homepage-client-slide">
                  <div className="homepage-client-card">
                    <div className="homepage-client-logo-container">
                      <img src={client.logo} alt={client.name} className="homepage-client-logo" />
                    </div>
                    <p className="homepage-client-name">{client.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="homepage-clients-row">
            <div className="homepage-clients-track homepage-clients-track-reverse">
              {[...clients.reverse(), ...clients].map((client, index) => (
                <div key={index} className="homepage-client-slide">
                  <div className="homepage-client-card">
                    <div className="homepage-client-logo-container">
                      <img src={client.logo} alt={client.name} className="homepage-client-logo" />
                    </div>
                    <p className="homepage-client-name">{client.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="homepage-plans">
        <div className="homepage-plans-container">
          <h2 className="homepage-plans-title">Planos que cabem no seu bolso</h2>
          <p className="homepage-plans-subtitle">Escolha o plano ideal para o seu negócio e comece a vender online hoje mesmo</p>
          
          <div className="homepage-plans-grid">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`homepage-plan-card ${plan.featured ? 'homepage-plan-card-featured' : ''}`}
              >
                {plan.featured && (
                  <div className="homepage-plan-badge">
                    Mais Popular
                  </div>
                )}
                
                <div className="homepage-plan-content">
                  <div className={`homepage-plan-icon-container ${plan.featured ? 'homepage-plan-icon-container-featured' : ''}`}>
                    <span className="homepage-plan-icon">{plan.icon}</span>
                  </div>
                  
                  <h3 className={`homepage-plan-name ${plan.featured ? 'homepage-plan-name-featured' : ''}`}>
                    {plan.name}
                  </h3>
                  
                  <div className="homepage-plan-price">
                    <span className={`homepage-plan-price-amount ${plan.featured ? 'homepage-plan-price-amount-featured' : ''}`}>
                      {plan.price}
                    </span>
                    <span className="homepage-plan-price-period">
                      {plan.period}
                    </span>
                  </div>
                  
                  <ul className="homepage-plan-features">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="homepage-plan-feature">
                        <FaCheck className="homepage-plan-feature-icon" />
                        <span className="homepage-plan-feature-text">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    className={`homepage-plan-button ${plan.featured ? 'homepage-plan-button-featured' : 'homepage-plan-button-regular'}`}
                    onClick={() => handleSignupClick(plan.name.toLowerCase())}
                  >
                    {plan.ctaText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="homepage-testimonials">
        <div className="homepage-testimonials-container">
          <h2 className="homepage-testimonials-title">O que nossos clientes dizem</h2>
          
          <div className="homepage-testimonial-card">
            <div className="homepage-testimonial-content">
              <div className="homepage-testimonial-avatar">
                <img src="/api/placeholder/80/80" alt="Cliente" />
              </div>
              <p className="homepage-testimonial-text">"Aumentei minhas vendas em 200% no primeiro mês usando a plataforma BenCommerce. O sistema é muito fácil de usar e o suporte é excelente!"</p>
              <div>
                <p className="homepage-testimonial-author">Maria Silva</p>
                <p className="homepage-testimonial-company">Boutique Elegance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="homepage-cta">
        <div className="homepage-cta-background">
          <div className="homepage-cta-blob homepage-cta-blob-1"></div>
          <div className="homepage-cta-blob homepage-cta-blob-2"></div>
        </div>
        
        <div className="homepage-cta-content">
          <h2 className="homepage-cta-title">Pronto para começar a vender?</h2>
          <p className="homepage-cta-text">
            Crie sua conta agora e tenha sua loja virtual funcionando em poucos minutos.
            Sem necessidade de cartão de crédito para começar.
          </p>
          <button 
            onClick={() => handleSignupClick('plus')}
            className="homepage-cta-button"
          >
            Criar Minha Loja Grátis
          </button>
          <p className="homepage-cta-subtext">Mais de 10.000 lojas já criadas em nossa plataforma</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="homepage-footer-container">
          <div className="homepage-footer-brand-section">
            <div className="homepage-footer-brand">BenCommerce</div>
            <p className="homepage-footer-description">
              Plataforma completa para criação de lojas virtuais. Simples, rápido e acessível.
            </p>
            <div className="homepage-footer-social">
              <a href="#!" className="homepage-footer-social-link">
                <span className="sr-only">Facebook</span>
                <svg className="homepage-footer-social-icon" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
              </a>
              <a href="#!" className="homepage-footer-social-link">
                <span className="sr-only">Instagram</span>
                <svg className="homepage-footer-social-icon" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#!" className="homepage-footer-social-link">
                <span className="sr-only">Twitter</span>
                <svg className="homepage-footer-social-icon" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
            </div>
          </div>
          
          <div className="homepage-footer-links-section">
            <h3 className="homepage-footer-title">Links Rápidos</h3>
            <ul className="homepage-footer-links">
              <li><a href="/sobre" className="homepage-footer-link">Sobre nós</a></li>
              <li><a href="/recursos" className="homepage-footer-link">Recursos</a></li>
              <li><a href="/planos" className="homepage-footer-link">Preços</a></li>
              <li><a href="/blog" className="homepage-footer-link">Blog</a></li>
              <li><a href="/carreiras" className="homepage-footer-link">Carreiras</a></li>
            </ul>
          </div>
          
          <div className="homepage-footer-support-section">
            <h3 className="homepage-footer-title">Suporte</h3>
            <ul className="homepage-footer-links">
              <li><a href="/ajuda" className="homepage-footer-link">Central de Ajuda</a></li>
              <li><a href="/tutorial" className="homepage-footer-link">Tutorial</a></li>
              <li><a href="/faq" className="homepage-footer-link">FAQ</a></li>
              <li><a href="/contato" className="homepage-footer-link">Contato</a></li>
              <li><a href="/status" className="homepage-footer-link">Status</a></li>
            </ul>
          </div>
          
          <div className="homepage-footer-contact-section">
            <h3 className="homepage-footer-title">Contato</h3>
            <ul className="homepage-footer-contact">
              <li className="homepage-footer-contact-item">
                <svg className="homepage-footer-contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span className="homepage-footer-contact-text">contato@BenCommerce.com.br</span>
              </li>
              <li className="homepage-footer-contact-item">
                <svg className="homepage-footer-contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                <span className="homepage-footer-contact-text">(11) 4002-8922</span>
              </li>
              <li className="homepage-footer-contact-item">
                <svg className="homepage-footer-contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="homepage-footer-contact-text">Av. Paulista, 1000<br />São Paulo, SP</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="homepage-footer-bottom">
          <p className="homepage-footer-copyright">© 2025 BenCommerce. Todos os direitos reservados.</p>
          <div className="homepage-footer-legal">
            <a href="/termos" className="homepage-footer-legal-link">Termos de Uso</a>
            <a href="/privacidade" className="homepage-footer-legal-link">Privacidade</a>
            <a href="/cookies" className="homepage-footer-legal-link">Cookies</a>
          </div>
        </div>
      </footer>

      {/* WhatsApp Button */}
      <div className="homepage-whatsapp-button">
        <button
          className="homepage-whatsapp-button-icon"
          onClick={toggleWhatsappNotification}
        >
          <FaWhatsapp className="homepage-whatsapp-icon" />
        </button>
        
        {/* WhatsApp Notification */}
        {showWhatsappNotification && (
          <div className="homepage-whatsapp-notification">
            <div className="homepage-whatsapp-notification-header">
              <div className="homepage-whatsapp-notification-title">
                <FaWhatsapp className="homepage-whatsapp-notification-title-icon" />
                <span>Atendimento</span>
              </div>
              <button 
                className="homepage-whatsapp-notification-close"
                onClick={toggleWhatsappNotification}
              >
                <svg className="homepage-whatsapp-notification-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <p className="homepage-whatsapp-notification-message">Olá! Como posso ajudar você hoje?</p>
            <button
              className="homepage-whatsapp-notification-button"
              onClick={() => window.open('https://wa.me/5585991470709', '_blank')}
            >
              Iniciar Conversa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;