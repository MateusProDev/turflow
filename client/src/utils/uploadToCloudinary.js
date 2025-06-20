export async function uploadToCloudinary(file) {
  const uploadPreset = process.env.REACT_APP_UPLOAD_PRESET;
  const cloudName = process.env.REACT_APP_CLOUD_NAME;
  if (!uploadPreset || !cloudName) throw new Error("Configuração Cloudinary ausente.");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Erro ao enviar imagem");
  const data = await response.json();
  return data.secure_url;
}
