import React, { useState } from "react";
import {
  Add,
  Remove,
  Close,
  DeleteOutline,
  WhatsApp,
  CreditCard,
  InfoOutlined
} from '@mui/icons-material';
import CheckoutModal from '../../CheckoutModal/CheckoutModal';
import './Cart.css';

const Cart = ({
  items,
  onRemoveItemCompletely,
  onIncrement,
  onDecrement,
  open,
  onClose,
  whatsappNumber,
  onCheckoutTransparent,
  enableWhatsappCheckout,
  enableMpCheckout,
  cartTotal
}) => {
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const toggleItemExpansion = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const isValidWhatsappNumber = (number) => {
    if (!number) return false;
    const cleaned = ('' + number).replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  };

  const handleOpenWhatsappModal = () => {
    if (!isValidWhatsappNumber(whatsappNumber)) {
      alert("WhatsApp da loja não está configurado corretamente.");
      return;
    }
    
    if (items.length === 0) {
      alert("Seu carrinho está vazio. Adicione produtos antes de finalizar.");
      return;
    }

    setIsCheckoutModalOpen(true);
  };

  const handleSubmitToWhatsapp = (formData) => {
    if (!isValidWhatsappNumber(whatsappNumber)) {
      alert("Erro: WhatsApp da loja não configurado.");
      return;
    }

    let message = `*Pedido Confirmado - ${formData.name}*\n\n`;
    message += `*Telefone:* ${formData.phone}\n\n`;
    message += "*Itens do Pedido:*\n";
    
    items.forEach(item => {
      message += `➤ ${item.qtd}x ${item.name}`;
      if (item.variants && Object.keys(item.variants).length > 0) {
        message += ` (${Object.entries(item.variants)
          .map(([name, value]) => `${name}: ${value}`)
          .join(', ')})`;
      }
      message += ` - ${formatCurrency(item.price * item.qtd)}\n`;
      
      if (expandedItem === item.id) {
        if (item.description) message += `   Descrição: ${item.description}\n`;
        if (item.anchorPrice) message += `   Preço original: ${formatCurrency(item.anchorPrice)}\n`;
      }
    });
    
    message += `\n*Total:* ${formatCurrency(cartTotal)}\n\n`;
    
    if (formData.deliveryOption !== 'retirada') {
      message += "*Endereço de Entrega:*\n";
      message += `${formData.street}, ${formData.number}\n`;
      if (formData.complement) message += `Complemento: ${formData.complement}\n`;
      message += `${formData.neighborhood}\n`;
      message += `${formData.city}/${formData.state}\n`;
      message += `CEP: ${formData.cep}\n\n`;
    }
    
    message += `*Entrega:* ${formData.deliveryOption === 'retirada' ? 'Retirada' : 'Entrega'}\n`;
    message += `*Pagamento:* ${formData.paymentMethod}\n`;
    
    if (formData.observation) {
      message += `\n*Observações:*\n${formData.observation}\n`;
    }
    
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodedMsg}`, "_blank");
    setIsCheckoutModalOpen(false);
    onClose();
  };

  return (
    <>
      <div className={`cart-overlay-min${open ? " open" : ""}`} onClick={onClose}></div>
      
      <div className={`cart-modal-min${open ? " open" : ""}`}>
        <div className="cart-header-min">
          <h4>Meu Carrinho ({items.reduce((total, item) => total + item.qtd, 0)})</h4>
          <button className="cart-close-btn-min" onClick={onClose}>
            <Close />
          </button>
        </div>
        
        <div className="cart-body-min">
          {items.length === 0 ? (
            <div className="cart-empty-min">
              <p>Seu carrinho está vazio</p>
              <button className="btn-back-min" onClick={onClose}>
                Continuar Comprando
              </button>
            </div>
          ) : (
            <ul className="cart-items-list-min">
              {items.map((item, index) => (
                <li key={`${item.id}-${index}`} className="cart-item-min">
                  <div className="cart-item-image-container">
                    <img 
                      src={
                        (item.images && item.images[0]) ||
                        item.imageUrl ||
                        'https://placehold.co/100x100/eef1f5/777?text=Sem+Imagem'
                      }
                      alt={item.name}
                      className="cart-item-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/100x100/eef1f5/777?text=Sem+Imagem';
                      }}
                    />
                  </div>
                  
                  <div className="cart-item-content">
                    <div className="cart-item-main-info">
                      <span className="cart-item-name-min">{item.name}</span>
                      
                      <div className="cart-item-price-qty">
                        <span className="cart-item-price-min">
                          {formatCurrency(item.price)} {item.anchorPrice && (
                            <span className="original-price">
                              {formatCurrency(item.anchorPrice)}
                            </span>
                          )}
                        </span>
                        <span className="cart-item-qty-display">x {item.qtd}</span>
                      </div>
                      
                      {item.variants && Object.keys(item.variants).length > 0 && (
                        <div className="cart-item-variants-container">
                          {Object.entries(item.variants).map(([name, value]) => {
                            // Converte o valor em string, se for um objeto
                            const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
                            return (
                              <div key={name} className="cart-item-variant">
                                <span className="variant-name">{name}:</span>
                                <span className="variant-value">{displayValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="cart-item-controls-min">
                      <div className="cart-item-qty-min">
                        <button 
                          onClick={() => onDecrement(item.id, item.variants)}
                          disabled={item.qtd <= 1}
                        >
                          <Remove fontSize="small" />
                        </button>
                        <span>{item.qtd}</span>
                        <button 
                          onClick={() => onIncrement(item.id, item.variants)}
                          disabled={item.qtd >= (item.stock || 99)}
                        >
                          <Add fontSize="small" />
                        </button>
                      </div>
                      
                      <button
                        className="cart-item-remove-min"
                        onClick={() => onRemoveItemCompletely(item.id, item.variants)}
                      >
                        <DeleteOutline fontSize="small" />
                      </button>
                    </div>
                  </div>
                  
                  {(item.description || item.priceConditions) && (
                    <button 
                      className="cart-item-details-btn"
                      onClick={() => toggleItemExpansion(item.id)}
                    >
                      <InfoOutlined fontSize="small" />
                      {expandedItem === item.id ? 'Menos detalhes' : 'Mais detalhes'}
                    </button>
                  )}
                  
                  {expandedItem === item.id && (
                    <div className="cart-item-expanded">
                      {item.description && (
                        <div className="cart-item-description">
                          <h5>Descrição:</h5>
                          <p>{item.description}</p>
                        </div>
                      )}
                      
                      {item.priceConditions && item.priceConditions.length > 0 && (
                        <div className="cart-item-price-conditions">
                          <h5>Condições de preço:</h5>
                          <ul>
                            {item.priceConditions.map((condition, idx) => (
                              <li key={idx}>
                                A partir de {condition.quantity} unidades: {formatCurrency(condition.pricePerUnit)} cada
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="cart-item-subtotal">
                    Subtotal: {formatCurrency(item.price * item.qtd)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="cart-footer-min">
            <div className="cart-total-min">
              <span>Total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            
            <div className="cart-checkout-buttons-min">
              {enableWhatsappCheckout && (
                <button
                  className="btn-checkout-min btn-whatsapp-min"
                  onClick={handleOpenWhatsappModal}
                  disabled={!isValidWhatsappNumber(whatsappNumber)}
                >
                  <WhatsApp /> Finalizar via WhatsApp
                </button>
              )}
              
              {enableMpCheckout && (
                <button
                  className="btn-checkout-min btn-mp-min"
                  onClick={onCheckoutTransparent}
                >
                  <CreditCard /> Pagar com Mercado Pago
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onSubmit={handleSubmitToWhatsapp}
        cartItems={items}
        cartTotal={cartTotal}
        whatsappNumber={whatsappNumber}
      />
    </>
  );
};

export default Cart;