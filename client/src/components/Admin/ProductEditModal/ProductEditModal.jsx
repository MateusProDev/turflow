// ProductEditModal.js
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  Typography,
  Chip,
  IconButton,
  Grid,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import CloudinaryUploadWidget from "../../CloudinaryUploadWidget/CloudinaryUploadWidget";
import { collection, addDoc, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { getAuth } from "firebase/auth";
import "./ProductEditModal.css";
import { useUserPlan } from "../../../context/UserPlanContext";
import { MAX_IMAGES, PRODUCT_LIMITS } from '../../../utils/planLimits';

const ProductEditModal = ({
  open,
  onClose,
  onSave,
  initialProduct = {},
  categories = [],
  onCreateCategory,
  lojaId,
  currentProductCount = 0,
}) => {
  const auth = getAuth();
  const resolvedLojaId = lojaId || auth.currentUser?.uid;

  const { userPlan, loading: planLoading } = useUserPlan();

  const [saveLoading, setSaveLoading] = useState(false);
  const safeProduct = initialProduct || {};

  // Função para converter a estrutura legada de variantes
  const convertLegacyVariants = (legacyVariants) => {
    if (!legacyVariants) return [];
    
    // Se for a estrutura antiga (mapa com options)
    if (legacyVariants.options && Array.isArray(legacyVariants.options)) {
      return [{
        name: legacyVariants.name || "Tamanho",
        options: legacyVariants.options,
        required: legacyVariants.required !== false
      }];
    }
    
    // Se for um array já no formato novo
    if (Array.isArray(legacyVariants) && legacyVariants.every(v => v.name && v.options)) {
      return legacyVariants;
    }
    
    return [];
  };

  const [product, setProduct] = useState({
    name: safeProduct.name || "",
    price: safeProduct.price || "",
    anchorPrice: safeProduct.anchorPrice || "",
    stock: safeProduct.stock || "",
    description: safeProduct.description || "",
    images: safeProduct.images || [],
    category: safeProduct.category || "",
    variants: convertLegacyVariants(safeProduct.variants),
    ativo: safeProduct.ativo !== false,
    prioridade: safeProduct.prioridade || false,
    priceConditions: safeProduct.priceConditions || [],
  });

  const [variantInput, setVariantInput] = useState("");
  const [variantOptions, setVariantOptions] = useState("");
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryImage, setNewCategoryImage] = useState("");

  const maxImages = MAX_IMAGES[userPlan] || MAX_IMAGES['free'] || 1;
  const maxProducts = PRODUCT_LIMITS[userPlan] || PRODUCT_LIMITS['free'] || 30;

  // Efeito para monitorar mudanças no plano e ajustar imagens se necessário
  useEffect(() => {
    if (product.images.length > maxImages) {
      setProduct((prev) => ({
        ...prev,
        images: prev.images.slice(0, maxImages),
      }));
      alert(`Seu plano foi alterado. O número de imagens foi reduzido para ${maxImages} conforme o limite do plano ${userPlan.toUpperCase()}.`);
    }
  }, [maxImages, userPlan]);

  // Efeito para resetar o produto quando o modal abrir/fechar ou o plano mudar
  useEffect(() => {
    if (open) {
      const safeProduct = initialProduct || {};
      const productImages = safeProduct.images || [];
      const limitedImages = productImages.slice(0, maxImages);
      
      setProduct({
        name: safeProduct.name || "",
        price: safeProduct.price || "",
        anchorPrice: safeProduct.anchorPrice || "",
        stock: safeProduct.stock || "",
        description: safeProduct.description || "",
        images: limitedImages,
        category: safeProduct.category || "",
        variants: convertLegacyVariants(safeProduct.variants),
        ativo: safeProduct.ativo !== false,
        prioridade: safeProduct.prioridade || false,
        priceConditions: safeProduct.priceConditions || [],
      });
      
      if (productImages.length > maxImages && productImages.length > 0) {
        setTimeout(() => {
          alert(`Algumas imagens foram removidas para adequar ao limite do plano ${userPlan.toUpperCase()} (${maxImages} imagens por produto).`);
        }, 500);
      }
    }
  }, [open, initialProduct, maxImages, userPlan]);

  const handleImageUpload = (url) => {
    if (product.images.length < maxImages) {
      setProduct((prev) => ({ ...prev, images: [...prev.images, url] }));
    } else {
      alert(`Você atingiu o limite máximo de ${maxImages} imagens para o seu plano ${userPlan.toUpperCase()}.`);
    }
  };

  const handleRemoveImage = (idx) => {
    setProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleAddVariant = () => {
    if (variantInput.trim() && variantOptions.trim()) {
      const optionsArray = variantOptions.split(',').map(opt => opt.trim()).filter(opt => opt);
      
      if (optionsArray.length === 0) {
        alert("Adicione pelo menos uma opção para a variante");
        return;
      }

      const newVariant = {
        name: variantInput.trim(),
        options: optionsArray,
        required: true
      };

      setProduct(prev => ({
        ...prev,
        variants: editingVariantIndex !== null
          ? prev.variants.map((v, i) => i === editingVariantIndex ? newVariant : v)
          : [...prev.variants, newVariant]
      }));

      setVariantInput("");
      setVariantOptions("");
      setEditingVariantIndex(null);
    }
  };

  const handleEditVariant = (index) => {
    const variant = product.variants[index];
    setVariantInput(variant.name);
    setVariantOptions(variant.options.join(', '));
    setEditingVariantIndex(index);
  };

  const handleRemoveVariant = (index) => {
    setProduct(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleVariantRequiredChange = (index, checked) => {
    setProduct(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => 
        i === index ? { ...v, required: checked } : v
      )
    }));
  };

  // Gerenciamento de Condições de Preço
  const handleAddPriceCondition = () => {
    setProduct((prev) => ({
      ...prev,
      priceConditions: [
        ...prev.priceConditions,
        { quantity: "", pricePerUnit: "" },
      ],
    }));
  };

  const handleRemovePriceCondition = (index) => {
    setProduct((prev) => ({
      ...prev,
      priceConditions: prev.priceConditions.filter((_, i) => i !== index),
    }));
  };

  const handlePriceConditionChange = (index, field, value) => {
    setProduct((prev) => ({
      ...prev,
      priceConditions: prev.priceConditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      ),
    }));
  };

  const generateSlug = (name) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-");

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      if (!product.name || !product.price) {
        alert("Nome e preço são obrigatórios!");
        return;
      }
      if (product.images.length === 0) {
        alert("Adicione pelo menos uma imagem do produto.");
        return;
      }

      // Verificar limite de produtos apenas para novos produtos
      if (!initialProduct?.id && currentProductCount >= maxProducts) {
        alert(`Você atingiu o limite máximo de ${maxProducts} produtos para o plano ${userPlan.toUpperCase()}.`);
        return;
      }

      // Verificar limite de imagens
      if (product.images.length > maxImages) {
        alert(`Você pode ter no máximo ${maxImages} imagens por produto no plano ${userPlan.toUpperCase()}.`);
        return;
      }

      const productSlug = generateSlug(product.name);
      const productData = {
        ...product,
        slug: productSlug,
        updatedAt: new Date().toISOString(),
      };

      if (initialProduct?.id) {
        // Atualizar produto existente
        await updateDoc(doc(db, `lojas/${resolvedLojaId}/produtos/${initialProduct.id}`), productData);
      } else {
        // Criar novo produto
        productData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, `lojas/${resolvedLojaId}/produtos`), productData);
        productData.id = docRef.id;
      }

      onSave(productData);
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      alert("Erro ao salvar produto: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    setCreatingCategory(true);
    try {
      await updateDoc(doc(db, "lojas", resolvedLojaId), {
        categorias: arrayUnion(trimmed),
      });
      if (newCategoryImage) {
        await updateDoc(doc(db, "lojas", resolvedLojaId), {
          imgcategorias: arrayUnion({ nome: trimmed, imagem: newCategoryImage }),
        });
      }
      setProduct((prev) => ({ ...prev, category: trimmed }));
      setNewCategory("");
      setNewCategoryImage("");
      if (onCreateCategory) onCreateCategory(trimmed);
    } catch (err) {
      alert("Erro ao criar categoria: " + err.message);
    }
    setCreatingCategory(false);
  };

  const getPlanDescription = (plan) => {
    switch (plan) {
      case 'free':
        return '30 produtos, 1 imagem por produto';
      case 'plus':
        return '300 produtos, 3 imagens por produto';
      case 'premium':
        return 'Produtos ilimitados, 5 imagens por produto';
      default:
        return '30 produtos, 1 imagem por produto';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialProduct && initialProduct.id ? "Editar Produto" : "Adicionar Produto"}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1, display: 'block' }}>
          Plano {userPlan.toUpperCase()} - {getPlanDescription(userPlan)}
          {planLoading && <CircularProgress size={12} sx={{ ml: 1 }} />}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Nome"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Preço"
            type="number"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
            fullWidth
            required
            inputProps={{ step: "0.01", min: "0" }}
          />
          <TextField
            label="Preço de Ancoragem (opcional)"
            type="number"
            value={product.anchorPrice}
            onChange={(e) => setProduct({ ...product, anchorPrice: e.target.value })}
            fullWidth
            inputProps={{ step: "0.01", min: "0" }}
          />
          <TextField
            label="Estoque"
            type="number"
            value={product.stock}
            onChange={(e) => setProduct({ ...product, stock: e.target.value })}
            fullWidth
            inputProps={{ min: "0" }}
          />
          <TextField
            label="Descrição"
            value={product.description}
            onChange={(e) => setProduct({ ...product, description: e.target.value })}
            fullWidth
            multiline
            minRows={2}
          />
          <Box>
            <TextField
              select
              label="Categoria"
              value={product.category || ""}
              onChange={(e) => setProduct({ ...product, category: e.target.value })}
              fullWidth
              sx={{ mb: 1 }}
            >
              <MenuItem value="">
                <em>Selecione uma categoria</em>
              </MenuItem>
              {categories.map((cat, idx) => (
                <MenuItem key={idx} value={typeof cat === "string" ? cat : cat.nome}>
                  {typeof cat === "string" ? cat : cat.nome}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Seção de Variantes */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Variantes (ex: Tamanho, Cor)
            </Typography>
            
            {product.variants.map((variant, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">{variant.name}</Typography>
                  <Box>
                    <IconButton onClick={() => handleEditVariant(index)} size="small">
                      <AddAPhotoIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleRemoveVariant(index)} size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 1 }}>
                  {variant.options.map((option, i) => (
                    <Chip key={i} label={option} sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={variant.required}
                      onChange={(e) => handleVariantRequiredChange(index, e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Obrigatório"
                />
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {editingVariantIndex !== null ? "Editar Variante" : "Adicionar Nova Variante"}
            </Typography>
            
            <Box display="flex" gap={1} alignItems="center" sx={{ mb: 1 }}>
              <TextField
                label="Nome da Variante (ex: Tamanho)"
                value={variantInput}
                onChange={(e) => setVariantInput(e.target.value)}
                size="small"
                fullWidth
              />
            </Box>
            
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                label="Opções (separadas por vírgula)"
                value={variantOptions}
                onChange={(e) => setVariantOptions(e.target.value)}
                size="small"
                fullWidth
              />
              <IconButton onClick={handleAddVariant} color="primary">
                <AddIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Seção de Imagens */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Imagens do produto ({product.images.length}/{maxImages})
            </Typography>
            <CloudinaryUploadWidget
              onUpload={handleImageUpload}
              disabled={product.images.length >= maxImages}
            />
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {product.images.map((img, idx) => (
                <Grid item key={idx}>
                  <Box position="relative" display="inline-block">
                    <img
                      src={img}
                      alt={`Produto ${idx + 1}`}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: "1px solid #eee",
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(idx)}
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: "#fff",
                        p: "2px",
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Typography variant="caption" color="text.secondary">
              Plano {userPlan.toUpperCase()}: {
                userPlan === "free" ? "1 imagem por produto" :
                userPlan === "plus" ? "até 3 imagens por produto" :
                userPlan === "premium" ? "até 5 imagens por produto" :
                "1 imagem por produto"
              }
            </Typography>
          </Box>

          {/* Seção de Condições de Preço */}
          <Box>
            <Typography variant="subtitle2">Condições de Preço</Typography>
            {product.priceConditions.map((condition, index) => (
              <Box key={index} display="flex" gap={1} alignItems="center" sx={{ mb: 1 }}>
                <TextField
                  label="Quantidade Mínima"
                  type="number"
                  value={condition.quantity}
                  onChange={(e) => handlePriceConditionChange(index, "quantity", e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Preço por Unidade"
                  type="number"
                  value={condition.pricePerUnit}
                  onChange={(e) => handlePriceConditionChange(index, "pricePerUnit", e.target.value)}
                  size="small"
                  fullWidth
                />
                <IconButton onClick={() => handleRemovePriceCondition(index)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<AddIcon />} onClick={handleAddPriceCondition} variant="outlined" size="small">
              Adicionar Condição
            </Button>
          </Box>

          {/* Seção de Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2">Status</Typography>
              <Switch
                checked={product.ativo}
                onChange={(e) => setProduct({ ...product, ativo: e.target.checked })}
                color="primary"
              />
              <Typography variant="caption" display="block">
                {product.ativo ? "Ativo" : "Inativo"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Prioridade</Typography>
              <Switch
                checked={product.prioridade}
                onChange={(e) => setProduct({ ...product, prioridade: e.target.checked })}
                color="secondary"
              />
              <Typography variant="caption" display="block">
                {product.prioridade ? "Prioritário" : "Normal"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saveLoading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saveLoading}
        >
          {saveLoading ? <CircularProgress size={24} /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductEditModal;