import React from "react";
import { ShoppingBag, Menu } from '@mui/icons-material';
import "./NavBar.css";

const NavBar = ({
  logoUrl,
  nomeLoja,
  exibirLogo = true,
  onMenuClick,
}) => {
  console.log("NavBar - exibirLogo:", exibirLogo, "logoUrl:", logoUrl, "nomeLoja:", nomeLoja);

  return (
    <div className="lojinha-navbar">
      {/* Parte Esquerda: Logo ou Nome da Loja */}
      <div className="lojinha-navbar-left">
        {exibirLogo ? (
          logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo da Loja"
              className="lojinha-navbar-logo"
              style={{
                maxHeight: '60px',
                maxWidth: '200px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div className="lojinha-navbar-no-logo">Sem logo</div>
          )
        ) : (
          <div className="lojinha-navbar-title">{nomeLoja || "Minha Loja"}</div>
        )}
      </div>

      {/* Parte Direita: Botões de Carrinho e Menu */}
      <div className="lojinha-navbar-right">
        {/* Botão do Menu */}
        <button
          className="lojinha-navbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Menu"
        >
          <Menu sx={{ fontSize: 32 }} />
        </button>
      </div>
    </div>
  );
};

export default NavBar;