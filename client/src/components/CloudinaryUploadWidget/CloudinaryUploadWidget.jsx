import React from "react";

// Função utilitária para validar imagem (exemplo simples)
const validateImage = async (file) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("O arquivo precisa ser uma imagem.");
  }
  // Outras validações podem ser adicionadas aqui
};

// Função para upload no Cloudinary
const uploadImageToCloudinary = async (file) => {
  await validateImage(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "qc7tkpck"); // Seu upload_preset
  formData.append("cloud_name", "doeiv6m4h");   // Seu cloud_name

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/doeiv6m4h/image/upload",
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
const CloudinaryUploadWidget = ({ onUpload, children, disabled }) => {
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      onUpload(imageUrl);
    } catch (error) {
      console.error(error.message);
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
      />
      {children ? children : <span style={{ color: "#4a6bff", textDecoration: "underline" }}>Enviar imagem</span>}
    </label>
  );
};

export default CloudinaryUploadWidget;