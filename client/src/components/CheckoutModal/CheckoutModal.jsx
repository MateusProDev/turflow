import React, { useState, useEffect } from 'react';
import './CheckoutModal.css';
import { Close } from '@mui/icons-material';

const CheckoutModal = ({
  isOpen,
  onClose,
  onSubmit,
  cartItems,
  cartTotal,
  whatsappNumber
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    deliveryOption: 'retirada',
    paymentMethod: 'pix',
    observation: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (value) => 'R$ ' + Number(value).toFixed(2).replace('.', ',');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpa erros quando o usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Formatação do CEP
    if (name === 'cep') {
      const formattedCep = value.replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 9);
      setFormData(prev => ({ ...prev, cep: formattedCep }));
    }
    
    // Formatação do telefone
    if (name === 'phone') {
      const formattedPhone = value.replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
      setFormData(prev => ({ ...prev, phone: formattedPhone }));
    }
  };

  useEffect(() => {
    const currentCep = formData.cep.replace(/\D/g, '');
    if (currentCep.length === 8) {
      fetch('https://viacep.com.br/ws/' + currentCep + '/json/')
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              street: data.logradouro || '',
              neighborhood: data.bairro || '',
              city: data.localidade || '',
              state: data.uf || '',
            }));
          }
        })
        .catch(console.error);
    }
  }, [formData.cep]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido';
    }
    
    if (formData.deliveryOption !== 'retirada') {
      if (!formData.cep.trim()) {
        newErrors.cep = 'CEP é obrigatório';
      } else if (formData.cep.replace(/\D/g, '').length !== 8) {
        newErrors.cep = 'CEP inválido';
      }
      
      if (!formData.street.trim()) newErrors.street = 'Rua é obrigatória';
      if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
      if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
      if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
      if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!whatsappNumber) {
      alert('Desculpe, o checkout via WhatsApp não está disponível no momento.');
      setIsSubmitting(false);
      return;
    }
    
    if (validateForm()) {
      onSubmit(formData);
    } else {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="checkout-overlay" onClick={onClose}></div>
      <div className="checkout-modal">
        <div className="checkout-modal-header">
          <h3>Finalizar Pedido</h3>
          <button onClick={onClose} className="checkout-modal-close-btn">
            <Close />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="checkout-modal-body">
          <h4>Seus Dados</h4>
          <div className="form-row">
            <div className={'form-group ' + (errors.name ? 'invalid' : '')}>
              <label htmlFor="name">Nome Completo*</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
              />
              {errors.name && <span className="error-message show">{errors.name}</span>}
            </div>
            <div className={'form-group ' + (errors.phone ? 'invalid' : '')}>
              <label htmlFor="phone">Telefone/WhatsApp*</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="(XX) XXXXX-XXXX" 
              />
              {errors.phone && <span className="error-message show">{errors.phone}</span>}
            </div>
          </div>

          <h4>Opção de Entrega*</h4>
          <div className="form-group radio-group">
            <label>
              <input 
                type="radio" 
                name="deliveryOption" 
                value="retirada" 
                checked={formData.deliveryOption === 'retirada'} 
                onChange={handleChange} 
              /> Retirada no Local
            </label>
            <label>
              <input 
                type="radio" 
                name="deliveryOption" 
                value="uber" 
                checked={formData.deliveryOption === 'uber'} 
                onChange={handleChange} 
              /> Entrega (Ex: Uber, Motoboy)
            </label>
            <label>
              <input 
                type="radio" 
                name="deliveryOption" 
                value="correios" 
                checked={formData.deliveryOption === 'correios'} 
                onChange={handleChange} 
              /> Envio via Correios
            </label>
          </div>

          {formData.deliveryOption !== 'retirada' && (
            <>
              <h4>Endereço de Entrega*</h4>
              <div className="form-row">
                <div className={'form-group fg-cep ' + (errors.cep ? 'invalid' : '')}>
                  <label htmlFor="cep">CEP*</label>
                  <input 
                    type="text" 
                    id="cep" 
                    name="cep" 
                    value={formData.cep} 
                    onChange={handleChange} 
                    placeholder="00000-000" 
                    maxLength="9" 
                  />
                  {errors.cep && <span className="error-message show">{errors.cep}</span>}
                </div>
                <div className={'form-group fg-street ' + (errors.street ? 'invalid' : '')}>
                  <label htmlFor="street">Rua/Avenida*</label>
                  <input 
                    type="text" 
                    id="street" 
                    name="street" 
                    value={formData.street} 
                    onChange={handleChange} 
                  />
                  {errors.street && <span className="error-message show">{errors.street}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className={'form-group fg-number ' + (errors.number ? 'invalid' : '')}>
                  <label htmlFor="number">Número*</label>
                  <input 
                    type="text" 
                    id="number" 
                    name="number" 
                    value={formData.number} 
                    onChange={handleChange} 
                  />
                  {errors.number && <span className="error-message show">{errors.number}</span>}
                </div>
                <div className="form-group fg-complement">
                  <label htmlFor="complement">Complemento</label>
                  <input 
                    type="text" 
                    id="complement" 
                    name="complement" 
                    value={formData.complement} 
                    onChange={handleChange} 
                    placeholder="Ap, Bloco, Casa..." 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className={'form-group ' + (errors.neighborhood ? 'invalid' : '')}>
                  <label htmlFor="neighborhood">Bairro*</label>
                  <input 
                    type="text" 
                    id="neighborhood" 
                    name="neighborhood" 
                    value={formData.neighborhood} 
                    onChange={handleChange} 
                  />
                  {errors.neighborhood && <span className="error-message show">{errors.neighborhood}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className={'form-group fg-city ' + (errors.city ? 'invalid' : '')}>
                  <label htmlFor="city">Cidade*</label>
                  <input 
                    type="text" 
                    id="city" 
                    name="city" 
                    value={formData.city} 
                    onChange={handleChange} 
                  />
                  {errors.city && <span className="error-message show">{errors.city}</span>}
                </div>
                <div className={'form-group fg-state ' + (errors.state ? 'invalid' : '')}>
                  <label htmlFor="state">Estado (UF)*</label>
                  <input 
                    type="text" 
                    id="state" 
                    name="state" 
                    value={formData.state} 
                    onChange={handleChange} 
                    maxLength="2" 
                  />
                  {errors.state && <span className="error-message show">{errors.state}</span>}
                </div>
              </div>
            </>
          )}

          <h4>Forma de Pagamento*</h4>
          <div className="form-group">
            <select 
              name="paymentMethod" 
              value={formData.paymentMethod} 
              onChange={handleChange} 
              required
            >
              <option value="pix">PIX</option>
              <option value="credito">Cartão de Crédito (a combinar)</option>
              <option value="debito">Cartão de Débito (a combinar)</option>
              <option value="dinheiro">Dinheiro (para retirada/entrega local)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="observation">Observações</label>
            <textarea 
              id="observation" 
              name="observation" 
              value={formData.observation} 
              onChange={handleChange} 
              rows="3" 
              placeholder="Alguma preferência ou detalhe adicional?"
            ></textarea>
          </div>

          <div className="checkout-modal-summary">
            <h5>Resumo do Pedido</h5>
            <ul>
              {cartItems.map(item => (
                <li key={item.id}>
                  {item.qtd}x {item.name}
                  {item.variants && Object.keys(item.variants).length > 0 && (
                    <span> ({Object.entries(item.variants).map(([name, value]) => name + ': ' + value).join(', ')})</span>
                  )}
                  - {formatCurrency(item.price * item.qtd)}
                </li>
              ))}
            </ul>
            <p className="summary-total">Total: <strong>{formatCurrency(cartTotal)}</strong></p>
          </div>

          <div className="checkout-modal-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-confirm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Confirmar Pedido e Enviar'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CheckoutModal;