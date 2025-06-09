import React from "react";
import styles from "./Footer.module.css";
import {
  Instagram,
  Facebook,
  Twitter,
  YouTube
} from "@mui/icons-material";

const Footer = ({
  nomeLoja = "Sua Loja",
  footerData = {},
  showSocial = true,
  showExtras = true
}) => {
  const anoAtual = new Date().getFullYear();

  const data = {
    nomeLoja,
    descricao: footerData.descricao || "",
    instagram: footerData.instagram || footerData.social?.instagram || "",
    facebook: footerData.facebook || footerData.social?.facebook || "",
    twitter: footerData.twitter || footerData.social?.twitter || "",
    youtube: footerData.youtube || footerData.social?.youtube || "",
    extras: Array.isArray(footerData.extras) ? footerData.extras : []
  };

  const hasSocialMedia = data.instagram || data.facebook || data.twitter || data.youtube;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Coluna da loja */}
        <div className={styles.col}>
          <h2 className={styles.brand}>{data.nomeLoja}</h2>
          {data.descricao && (
            <p className={styles.description}>{data.descricao}</p>
          )}
        </div>

        {/* Links rápidos */}
        {showExtras && (data.extras.length > 0) && (
          <div className={styles.col}>
            <h3>Links Rápidos</h3>
            <ul className={styles.links}>
              {data.extras.map((link, index) => (
                <li key={index}>
                  <a href={link.url}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Redes sociais */}
        {showSocial && hasSocialMedia && (
          <div className={styles.col}>
            <h3>Redes Sociais</h3>
            <div className={styles.social}>
              {data.instagram && (
                <a
                  href={data.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className={styles.socialLink}
                >
                  <Instagram className={styles.icon} />
                </a>
              )}
              {data.facebook && (
                <a
                  href={data.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className={styles.socialLink}
                >
                  <Facebook className={styles.icon} />
                </a>
              )}
              {data.twitter && (
                <a
                  href={data.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className={styles.socialLink}
                >
                  <Twitter className={styles.icon} />
                </a>
              )}
              {data.youtube && (
                <a
                  href={data.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className={styles.socialLink}
                >
                  <YouTube className={styles.icon} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.bottom}>
        <p>&copy; {anoAtual} {data.nomeLoja} — Todos os direitos reservados.</p>
        <div className={styles.legal}>
          <a href="/termos">Termos</a>
          <a href="/privacidade">Privacidade</a>
          <a href="/cookies">Cookies</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
