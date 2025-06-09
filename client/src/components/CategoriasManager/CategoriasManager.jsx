import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { Button, TextField, List, ListItem, IconButton, Typography, Tooltip, Box, Snackbar, Alert, CircularProgress } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import { useAuth } from "../../utils/useAuth";
import CloudinaryUploadWidget from "../CloudinaryUploadWidget/CloudinaryUploadWidget";

const CategoriasManager = ({ lojaId, onCategoriasChange }) => {
  const { user, loading } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [imgCategorias, setImgCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [imgCategoria, setImgCategoria] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (!lojaId) return;
    
    const unsubscribe = onSnapshot(doc(db, "lojas", lojaId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Normalizar categorias para garantir formato consistente
        const cats = Array.isArray(data.categorias) 
          ? data.categorias.map(cat => 
              typeof cat === 'string' ? { id: `cat_${cat}`, nome: cat } : cat
            )
          : [];
        
        setCategorias(cats);
        setImgCategorias(data.imgcategorias || []);
        
        if (onCategoriasChange) onCategoriasChange(cats);
      }
    });
    
    return () => unsubscribe();
  }, [lojaId, onCategoriasChange]);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Carregando...</Typography>
    </Box>
  );

  if (!user) return (
    <Box textAlign="center" py={4}>
      <Typography color="error">Você não está autenticado.</Typography>
    </Box>
  );

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const getImagemCategoria = (categoria) => {
    const nomeCategoria = typeof categoria === 'string' ? categoria : categoria.nome;
    const imgCat = imgCategorias.find(img => img.nome === nomeCategoria);
    return imgCat?.imagem || null;
  };

  const validarCategoria = (categoria) => {
    const trimmed = categoria.trim();
    if (!trimmed) {
      showSnackbar("Nome da categoria não pode estar vazio", "error");
      return false;
    }
    if (trimmed.length < 2) {
      showSnackbar("Nome da categoria deve ter pelo menos 2 caracteres", "error");
      return false;
    }
    if (trimmed.length > 50) {
      showSnackbar("Nome da categoria não pode ter mais de 50 caracteres", "error");
      return false;
    }
    if (categorias.some(cat => 
      (typeof cat === 'string' ? cat : cat.nome).toLowerCase() === trimmed.toLowerCase()
    )) {
      showSnackbar("Esta categoria já existe!", "error");
      return false;
    }
    return true;
  };

  const handleAddCategoria = async () => {
    if (!lojaId || loadingState) return;
    if (!validarCategoria(novaCategoria)) return;
    
    setLoadingState(true);
    try {
      const lojaRef = doc(db, "lojas", lojaId);
      const novaCategoriaObj = {
        id: `cat_${Date.now()}`,
        nome: novaCategoria.trim()
      };
      
      await updateDoc(lojaRef, {
        categorias: [...categorias, novaCategoriaObj],
        imgcategorias: imgCategoria 
          ? [...imgCategorias, { nome: novaCategoriaObj.nome, imagem: imgCategoria }]
          : imgCategorias
      });
      
      showSnackbar(`Categoria "${novaCategoriaObj.nome}" adicionada!`);
      setNovaCategoria("");
      setImgCategoria("");
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      showSnackbar("Erro ao adicionar categoria: " + error.message, "error");
    } finally {
      setLoadingState(false);
    }
  };

  const handleRemoveCategoria = async (categoriaRemover) => {
    if (!lojaId || loadingState) return;
    
    const nomeCategoria = typeof categoriaRemover === 'string' 
      ? categoriaRemover 
      : categoriaRemover.nome;
    
    if (!window.confirm(`Tem certeza que deseja remover a categoria "${nomeCategoria}"?
Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    setLoadingState(true);
    try {
      const lojaRef = doc(db, "lojas", lojaId);
      const novasCategorias = categorias.filter(cat => 
        (typeof cat === 'string' ? cat : cat.nome) !== nomeCategoria
      );
      const novasImgCategorias = imgCategorias.filter(img => img.nome !== nomeCategoria);
      
      await updateDoc(lojaRef, {
        categorias: novasCategorias,
        imgcategorias: novasImgCategorias
      });
      
      showSnackbar(`Categoria "${nomeCategoria}" removida com sucesso!`);
    } catch (error) {
      console.error("Erro ao remover categoria:", error);
      showSnackbar("Erro ao remover categoria: " + error.message, "error");
    } finally {
      setLoadingState(false);
    }
  };

  const handleUpdateImagemCategoria = async (categoria, novaImagem) => {
    if (!lojaId || loadingState) return;
    
    const nomeCategoria = typeof categoria === 'string' ? categoria : categoria.nome;
    
    setLoadingState(true);
    try {
      const lojaRef = doc(db, "lojas", lojaId);
      const novasImgCategorias = imgCategorias.filter(img => img.nome !== nomeCategoria);
      
      if (novaImagem) {
        novasImgCategorias.push({
          nome: nomeCategoria,
          imagem: novaImagem
        });
      }
      
      await updateDoc(lojaRef, {
        imgcategorias: novasImgCategorias
      });
      
      showSnackbar(`Imagem da categoria "${nomeCategoria}" ${novaImagem ? 'atualizada' : 'removida'} com sucesso!`);
    } catch (error) {
      console.error("Erro ao atualizar imagem:", error);
      showSnackbar("Erro ao atualizar imagem: " + error.message, "error");
    } finally {
      setLoadingState(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loadingState && novaCategoria.trim()) {
      handleAddCategoria();
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#1976d2" }}>
        Gerenciar Categorias
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Adicione e organize as categorias dos seus produtos. Cada categoria pode ter uma imagem representativa.
      </Typography>
      
      <Box 
        sx={{ 
          display: "flex", 
          gap: 2, 
          mb: 3, 
          p: 2,
          backgroundColor: "#f8f9fa",
          borderRadius: 2,
          border: "1px solid #e0e0e0"
        }}
      >
        <TextField
          label="Nova categoria"
          value={novaCategoria}
          onChange={(e) => setNovaCategoria(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          disabled={loadingState}
          fullWidth
          helperText="Digite o nome da categoria (2-50 caracteres)"
          error={novaCategoria.length > 50}
        />
        
        <Tooltip title={imgCategoria ? "Imagem selecionada - clique para alterar" : "Adicionar imagem da categoria"}>
          <Box>
            <CloudinaryUploadWidget
              onUpload={setImgCategoria}
              buttonText={
                imgCategoria ? (
                  <img
                    src={imgCategoria}
                    alt="Prévia"
                    style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: "8px", 
                      objectFit: "cover",
                      border: "2px solid #1976d2"
                    }}
                  />
                ) : (
                  <AddAPhotoIcon style={{ fontSize: 28, color: "#1976d2" }} />
                )
              }
              disabled={loadingState}
            />
          </Box>
        </Tooltip>
        
        <Button
          variant="contained"
          onClick={handleAddCategoria}
          disabled={!novaCategoria.trim() || loadingState || novaCategoria.length > 50}
          sx={{ minWidth: 120, whiteSpace: "nowrap" }}
          startIcon={loadingState && <CircularProgress size={16} />}
        >
          {loadingState ? "Adicionando..." : "Adicionar"}
        </Button>
      </Box>
      
      <List sx={{ backgroundColor: "#fff", borderRadius: 2, overflow: "hidden" }}>
        {categorias.map((cat, idx) => {
          const nomeCategoria = typeof cat === 'string' ? cat : cat.nome;
          const imagemAtual = getImagemCategoria(nomeCategoria);
          
          return (
            <ListItem
              key={typeof cat === 'string' ? cat : cat.id || idx}
              sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 2, 
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                backgroundColor: "#fff",
                transition: "all 0.2s ease",
                '&:hover': {
                  backgroundColor: "#f5f5f5",
                  transform: "translateY(-1px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }
              }}
            >
              <Box sx={{ width: 60, height: 60, flexShrink: 0, position: "relative" }}>
                {imagemAtual ? (
                  <img
                    src={imagemAtual}
                    alt={nomeCategoria}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      borderRadius: '12px',
                      border: "2px solid #e0e0e0"
                    }}
                  />
                ) : (
                  <Box sx={{ 
                    width: '100%', 
                    height: '100%', 
                    backgroundColor: '#f0f0f0', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#666',
                    border: "2px solid #e0e0e0",
                    fontWeight: 500
                  }}>
                    Sem<br/>imagem
                  </Box>
                )}
              </Box>
              
              <Typography sx={{ 
                flex: 1, 
                fontWeight: 500,
                fontSize: "1rem"
              }}>
                {nomeCategoria}
              </Typography>
              
              <Tooltip title="Alterar ou adicionar imagem">
                <Box>
                  <CloudinaryUploadWidget
                    onUpload={(novaImagem) => handleUpdateImagemCategoria(nomeCategoria, novaImagem)}
                    buttonText="Alterar Imagem"
                    disabled={loadingState}
                  />
                </Box>
              </Tooltip>
              
              <Tooltip title={`Remover categoria "${nomeCategoria}"`}>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveCategoria(cat)}
                  disabled={loadingState}
                  color="error"
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'rgba(244, 67, 54, 0.1)' 
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      
      {categorias.length === 0 && (
        <Box 
          sx={{ 
            textAlign: "center", 
            py: 6,
            backgroundColor: "#f8f9fa",
            borderRadius: 2,
            border: "2px dashed #ccc"
          }}
        >
          <Typography color="textSecondary" variant="h6" gutterBottom>
            Nenhuma categoria cadastrada
          </Typography>
          <Typography color="textSecondary" variant="body2">
            Adicione sua primeira categoria usando o formulário acima
          </Typography>
        </Box>
      )}
      
      {categorias.length > 0 && (
        <Box sx={{ 
          mt: 3, 
          p: 2, 
          backgroundColor: '#e8f5e8', 
          borderRadius: 2,
          border: "1px solid #4caf50"
        }}>
          <Typography variant="subtitle2" color="success.main" gutterBottom>
            📊 Resumo das Categorias
          </Typography>
          <Typography variant="body2" color="success.dark">
            Total: {categorias.length} categoria{categorias.length !== 1 ? 's' : ''} | 
            Com imagem: {imgCategorias.length} | 
            Sem imagem: {categorias.length - imgCategorias.length}
          </Typography>
        </Box>
      )}
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CategoriasManager;