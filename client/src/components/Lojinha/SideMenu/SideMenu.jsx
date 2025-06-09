import React from "react";
import "./SideMenu.css";

const SideMenu = ({ open, menuItems, onClose, onSelect }) => {
  return (
    <>
      {/* Overlay para fechar o menu ao clicar fora */}
      <div className="sidemenu-overlay" onClick={onClose}></div>
      
      <div className={`sidemenu-container ${open ? 'open' : ''}`}>
        <div className="sidemenu-header">
          <button 
            className="sidemenu-close-btn" 
            onClick={onClose}
            aria-label="Fechar menu"
          >
            &times;
          </button>
          <h2 className="sidemenu-title">Menu</h2>
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