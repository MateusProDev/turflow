import React, { useEffect, useState } from "react";
import { Button, TextField, Box, Avatar, Switch, FormControlLabel } from "@mui/material";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import CloudinaryUploadWidget from "../../CloudinaryUploadWidget/CloudinaryUploadWidget";

const EditHeader = ({
  headerTitle,
  setHeaderTitle,
  logoUrl,
  setLogoUrl,
  exibirLogo: exibirLogoProp = true,
  setExibirLogo,
  onSave,
  currentUser,
  onUpdate, // Nova prop para callback
}) => {
  const [localExibirLogo, setLocalExibirLogo] = useState(exibirLogoProp);
  const [uploading, setUploading] = useState(false);

  // Sincroniza com a prop sempre que mudar
  useEffect(() => {
    setLocalExibirLogo(exibirLogoProp);
  }, [exibirLogoProp]);

  const handleLogoUpload = async (url) => {
    setUploading(true);
    setLogoUrl(url);
    setUploading(false);
  };

  const handleToggleExibirLogo = (checked) => {
    setLocalExibirLogo(checked);
    // Atualiza o estado do componente pai imediatamente
    if (setExibirLogo) {
      setExibirLogo(checked);
    }
  };

  const handleSave = async () => {
    try {
      // Atualiza no Firestore
      await updateDoc(doc(db, "lojas", currentUser.uid), {
        nome: headerTitle,
        headerTitle: headerTitle, // Salva nos dois campos para compatibilidade
        logoUrl,
        exibirLogo: localExibirLogo,
      });

      // Chama o callback de update para sincronizar estados do Dashboard
      if (onUpdate) {
        onUpdate(headerTitle, logoUrl, localExibirLogo);
      }

      // Chama o callback original se existir
      if (onSave) {
        onSave();
      }

      alert("Cabeçalho atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar cabeçalho:", error);
      alert("Erro ao salvar alterações!");
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <h2>Editar Cabeçalho</h2>
      
      <TextField
        label="Nome da Loja"
        value={headerTitle}
        onChange={(e) => setHeaderTitle(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
        placeholder="Digite o nome da sua loja"
      />

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={localExibirLogo}
              onChange={(e) => handleToggleExibirLogo(e.target.checked)}
              color="primary"
            />
          }
          label={localExibirLogo ? "Mostrar Logo" : "Mostrar Nome da Loja"}
        />
      </Box>

      {localExibirLogo && (
        <Box sx={{ mb: 3 }}>
          <h3>Logo da Loja</h3>
          
          {logoUrl && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Avatar
                src={logoUrl}
                alt="Logo da Loja"
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                variant="rounded"
              />
            </Box>
          )}
          
          <CloudinaryUploadWidget onUpload={handleLogoUpload}>
            <Button 
              variant="outlined" 
              fullWidth
              sx={{ mb: 2 }}
              disabled={uploading}
            >
              {uploading ? "Enviando..." : logoUrl ? "Alterar Logo" : "Adicionar Logo"}
            </Button>
          </CloudinaryUploadWidget>

          {uploading && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <span style={{ color: '#27ae60', fontWeight: 500 }}>Enviando logo...</span>
            </Box>
          )}

          {logoUrl && (
            <TextField
              label="URL do Logo (opcional - edição manual)"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              size="small"
            />
          )}
        </Box>
      )}

      {!localExibirLogo && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <p><strong>Preview:</strong> {headerTitle || "Nome da Loja"}</p>
        </Box>
      )}

      <Button 
        variant="contained" 
        onClick={handleSave}
        fullWidth
        size="large"
        sx={{ mt: 2 }}
        disabled={uploading}
      >
        Salvar Alterações
      </Button>
    </Box>
  );
};

export default EditHeader;