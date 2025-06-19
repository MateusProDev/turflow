import React from "react";

// Função utilitária para validar imagem (exemplo simples)
const validateImage = async (file) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("O arquivo precisa ser uma imagem.");
  }
  // Outras validações podem ser adicionadas aqui
};

// Função para upload no Cloudinary
const uploadImageToCloudinary = async (file, cloudName, uploadPreset) => {
  await validateImage(file);

  if (!cloudName || !uploadPreset) {
    throw new Error("Configuração do Cloudinary ausente.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao fazer upload da imagem.");
  }

  const data = await response.json();
  return data.secure_url; // URL da imagem hospedada
};

// Agora aceita children para customização do botão
const CloudinaryUploadWidget = ({ onUpload, children, disabled, cloudName, uploadPreset }) => {
  // Permite usar variáveis de ambiente como fallback
  const resolvedCloudName = cloudName || process.env.REACT_APP_CLOUD_NAME;
  const resolvedUploadPreset = uploadPreset || process.env.REACT_APP_UPLOAD_PRESET;
  const inputRef = React.useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imageUrl = await uploadImageToCloudinary(file, resolvedCloudName, resolvedUploadPreset);
      onUpload(imageUrl);
    } catch (error) {
      console.error(error.message);
    }
  };

  // Função para abrir o seletor de arquivos programaticamente
  const openFileDialog = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.click();
    }
  };

  return (
    <label style={{ cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}>
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleUpload}
        disabled={disabled}
        ref={inputRef}
      />
      {typeof children === 'function' ? children({ openFileDialog }) : (children ? children : <span style={{ color: "#4a6bff", textDecoration: "underline" }}>Enviar imagem</span>)}
    </label>
  );
};

export default CloudinaryUploadWidget;