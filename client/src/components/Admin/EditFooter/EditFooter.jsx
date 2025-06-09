import React, { useState, useEffect } from "react";
import {
  Instagram,
  Facebook,
  Twitter,
  YouTube,
  LocationOn,
  Save,
  Add,
  Delete
} from "@mui/icons-material";
import "./EditFooter.css";

const EditFooter = ({ 
  nomeLoja = "Sua Loja",
  footerData = {},
  onSave,
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    descricao: "",
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
    extras: []
  });

  // Inicializar formulário com dados existentes
  useEffect(() => {
    setFormData({
      descricao: footerData.descricao || "",
      instagram: footerData.instagram || footerData.social?.instagram || "",
      facebook: footerData.facebook || footerData.social?.facebook || "",
      twitter: footerData.twitter || footerData.social?.twitter || "",
      youtube: footerData.youtube || footerData.social?.youtube || "",
      extras: footerData.extras || []
    });
  }, [footerData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExtraAdd = () => {
    setFormData(prev => ({
      ...prev,
      extras: [...prev.extras, { label: "", url: "" }]
    }));
  };

  const handleExtraChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.map((extra, i) => 
        i === index ? { ...extra, [field]: value } : extra
      )
    }));
  };

  const handleExtraRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    // Filtrar campos vazios e extras vazios
    const cleanedData = {
      ...formData,
      extras: formData.extras.filter(extra => extra.label.trim() && extra.url.trim())
    };
    
    if (onSave) {
      onSave(cleanedData);
    }
  };

  return (
    <div className="edit-footer">
      <div className="edit-footer-header">
        <h2>Editar Footer - {nomeLoja}</h2>
        <div className="edit-footer-actions">
          <button 
            className="btn-save"
            onClick={handleSave}
          >
            <Save /> Salvar
          </button>
          {onCancel && (
            <button 
              className="btn-cancel"
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="edit-footer-content">
        {/* Informações da Loja */}
        <div className="edit-section">
          <h3>Informações da Loja</h3>
          
          <div className="form-group">
            <label>Nome da Loja</label>
            <input 
              type="text" 
              value={nomeLoja}
              disabled
              className="input-disabled"
              placeholder="Nome será puxado dinamicamente"
            />
            <small>O nome da loja é definido nas configurações gerais</small>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição da sua loja (opcional)"
              rows="3"
            />
          </div>
        </div>

        {/* Redes Sociais */}
        <div className="edit-section">
          <h3>Redes Sociais</h3>
          
          <div className="form-group">
            <label>
              <Instagram className="social-icon" />
              Instagram
            </label>
            <input
              type="url"
              value={formData.instagram}
              onChange={(e) => handleInputChange('instagram', e.target.value)}
              placeholder="https://instagram.com/suaconta (opcional)"
            />
          </div>

          <div className="form-group">
            <label>
              <Facebook className="social-icon" />
              Facebook
            </label>
            <input
              type="url"
              value={formData.facebook}
              onChange={(e) => handleInputChange('facebook', e.target.value)}
              placeholder="https://facebook.com/suapagina (opcional)"
            />
          </div>

          <div className="form-group">
            <label>
              <Twitter className="social-icon" />
              Twitter
            </label>
            <input
              type="url"
              value={formData.twitter}
              onChange={(e) => handleInputChange('twitter', e.target.value)}
              placeholder="https://twitter.com/suaconta (opcional)"
            />
          </div>

          <div className="form-group">
            <label>
              <YouTube className="social-icon" />
              YouTube
            </label>
            <input
              type="url"
              value={formData.youtube}
              onChange={(e) => handleInputChange('youtube', e.target.value)}
              placeholder="https://youtube.com/@seucanal (opcional)"
            />
          </div>
        </div>

        {/* Links Extras */}
        <div className="edit-section">
          <div className="section-header">
            <h3>Links Extras</h3>
            <button 
              className="btn-add"
              onClick={handleExtraAdd}
            >
              <Add /> Adicionar Link
            </button>
          </div>

          {formData.extras.map((extra, index) => (
            <div key={index} className="extra-link">
              <div className="form-group">
                <label>Nome do Link</label>
                <input
                  type="text"
                  value={extra.label}
                  onChange={(e) => handleExtraChange(index, 'label', e.target.value)}
                  placeholder="Ex: Blog, Carreiras"
                />
              </div>
              <div className="form-group">
                <label>URL</label>
                <input
                  type="text"
                  value={extra.url}
                  onChange={(e) => handleExtraChange(index, 'url', e.target.value)}
                  placeholder="Ex: /blog, /carreiras"
                />
              </div>
              <button 
                className="btn-remove"
                onClick={() => handleExtraRemove(index)}
              >
                <Delete />
              </button>
            </div>
          ))}

          {formData.extras.length === 0 && (
            <p className="no-extras">
              Nenhum link extra adicionado. Clique em "Adicionar Link" para criar um.
            </p>
          )}
        </div>

        {/* Preview */}
        <div className="edit-section">
          <h3>Preview</h3>
          <div className="footer-preview">
            <div className="preview-container">
              <div className="preview-col">
                <h4>{nomeLoja}</h4>
                {formData.descricao && <p>{formData.descricao}</p>}
              </div>
              <div className="preview-col">
                <h4>Links Rápidos</h4>
                <ul>
                  {formData.extras.map((extra, index) => (
                    extra.label && <li key={index}>{extra.label}</li>
                  ))}
                </ul>
              </div>
              
              <div className="preview-col">
                <h4>Redes Sociais</h4>
                <div className="preview-social">
                  {formData.instagram && <Instagram className="preview-icon" />}
                  {formData.facebook && <Facebook className="preview-icon" />}
                  {formData.twitter && <Twitter className="preview-icon" />}
                  {formData.youtube && <YouTube className="preview-icon" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditFooter;