import React from "react";
import "./SideMenu.css";

const SideMenu = ({ open, menuItems, onClose, onSelect, user }) => {
  return (
    <>
      {/* Overlay para fechar o menu ao clicar fora */}
      <div className="sidemenu-overlay" onClick={onClose}></div>
      
      <div className={`sidemenu-container ${open ? 'open' : ''}`}>
        <div className="sidemenu-header">
          <h2 className="sidemenu-title">Menu</h2>
          <button 
            className="sidemenu-close-btn" 
            onClick={onClose}
            aria-label="Fechar menu"
          >
            &times;
          </button>
        </div>
        
        {/* Área do usuário */}
        <div className="sidemenu-user">
          <div className="sidemenu-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%'}} />
            ) : (
              <span>{user?.name ? user.name[0].toUpperCase() : <i className="fas fa-user" />}</span>
            )}
          </div>
          <div className="sidemenu-user-info">
            <span className="sidemenu-user-name">{user?.name || 'Visitante'}</span>
            <span className="sidemenu-user-email">{user?.email || 'Faça login para acessar mais recursos'}</span>
          </div>
        </div>
        
        <nav className="sidemenu-nav">
          <ul className="sidemenu-list">
            {menuItems.map((item, index) => (
              <li key={`menu-item-${index}`} className="sidemenu-item">
                <button 
                  className="sidemenu-link"
                  onClick={() => onSelect(item)}
                >
                  {item.icon && <span className="sidemenu-icon">{item.icon}</span>}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidemenu-footer">
          <p>© 2025 Minha Loja</p>
        </div>
      </div>
    </>
  );
};

export default SideMenu;