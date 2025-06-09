// ManageStock.js
import React, { useState, useMemo } from "react";
import {
  Button,
  Grid,
  Dialog,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Tooltip,
  Chip,
  Box,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Switch,
  CircularProgress,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ProductEditModal from "../Admin/ProductEditModal/ProductEditModal";
import CategoriasManager from "../CategoriasManager/CategoriasManager";
import { useCategorias } from "../../context/CategoriasContext";
import { useUserPlan } from "../../context/UserPlanContext"; // Mudança aqui - usando Context
import { db } from "../../firebaseConfig";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { MAX_IMAGES, PRODUCT_LIMITS } from '../../utils/planLimits';
import "./ManageStock.css";

const PAGE_SIZE = 8;

const ManageStock = ({ products, setProducts, lojaId }) => {
  const { categorias } = useCategorias();
  const { userPlan, loading: planLoading } = useUserPlan(); // Usando o Context em vez do hook
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categoriasModalOpen, setCategoriasModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState(null);
  
  // Filtros avançados
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [estoqueFiltro, setEstoqueFiltro] = useState("");
  const [ativoFiltro, setAtivoFiltro] = useState("");
  const [prioridadeFiltro, setPrioridadeFiltro] = useState("");
  
  // Paginação
  const [page, setPage] = useState(1);
  
  const maxProducts = PRODUCT_LIMITS[userPlan] || PRODUCT_LIMITS['free'] || 30;

  const handleRemove = async (product) => {
    if (!window.confirm(`Tem certeza que deseja remover "${product.name}"?`)) return;
    setRemovingId(product.id);
    try {
      await deleteDoc(doc(db, `lojas/${lojaId}/produtos/${product.id}`));
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError("Erro ao remover produto: " + err.message);
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggleAtivo = async (product) => {
    try {
      await updateDoc(doc(db, `lojas/${lojaId}/produtos/${product.id}`), {
        ativo: !product.ativo,
        updatedAt: new Date().toISOString(),
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, ativo: !p.ativo } : p
        )
      );
    } catch (err) {
      setError("Erro ao atualizar status: " + err.message);
    }
  };

  const handleTogglePrioridade = async (product) => {
    try {
      await updateDoc(doc(db, `lojas/${lojaId}/produtos/${product.id}`), {
        prioridade: !product.prioridade,
        updatedAt: new Date().toISOString(),
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, prioridade: !p.prioridade } : p
        )
      );
    } catch (err) {
      setError("Erro ao atualizar prioridade: " + err.message);
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    if (categoriaFiltro) {
      result = result.filter((p) => (p.categorias || []).includes(categoriaFiltro));
    }
    if (estoqueFiltro === "baixo") {
      result = result.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 2);
    }
    if (estoqueFiltro === "esgotado") {
      result = result.filter((p) => Number(p.stock) === 0);
    }
    if (ativoFiltro === "ativo") {
      result = result.filter((p) => p.ativo !== false);
    }
    if (ativoFiltro === "inativo") {
      result = result.filter((p) => p.ativo === false);
    }
    if (prioridadeFiltro === "prioridade") {
      result = result.filter((p) => p.prioridade === true);
    }
    return result;
  }, [products, search, categoriaFiltro, estoqueFiltro, ativoFiltro, prioridadeFiltro]);

  const pageCount = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleAdd = () => {
    if (products.length >= maxProducts) {
      alert(
        `Você atingiu o limite máximo de ${maxProducts} produtos para o plano ${userPlan.toUpperCase()}.`
      );
      return;
    }
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  React.useEffect(() => {
    setPage(1);
  }, [search, categoriaFiltro, estoqueFiltro, ativoFiltro, prioridadeFiltro]);

  // Mostrar loading se o plano ainda está carregando
  if (planLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando informações do plano...</Typography>
      </Box>
    );
  }

  return (
    <Box className="manage-stock-container">
      <Box className="manage-stock-header">
        <Typography variant="h4" className="manage-stock-title">
          Gerenciar Estoque
          <Chip 
            label={`Plano ${userPlan.toUpperCase()}`} 
            size="small" 
            sx={{ ml: 1, mb: 0.5 }} 
            color="primary"
          />
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAdd}
          sx={{ fontWeight: 600 }}
        >
          + Adicionar Produto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box className="manage-stock-searchbar">
        <input
          type="text"
          placeholder="Pesquisar produto por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="manage-stock-search"
        />
        <Button
          variant="outlined"
          onClick={() => setCategoriasModalOpen(true)}
          sx={{ ml: 2 }}
        >
          Gerenciar Categorias
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Categoria</InputLabel>
          <Select
            value={categoriaFiltro}
            label="Categoria"
            onChange={(e) => setCategoriaFiltro(e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            {categorias.map((cat, idx) => (
              <MenuItem key={idx} value={typeof cat === "string" ? cat : cat.nome}>
                {typeof cat === "string" ? cat : cat.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Estoque</InputLabel>
          <Select
            value={estoqueFiltro}
            label="Estoque"
            onChange={(e) => setEstoqueFiltro(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="baixo">Baixo (≤2)</MenuItem>
            <MenuItem value="esgotado">Esgotado</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={ativoFiltro}
            label="Status"
            onChange={(e) => setAtivoFiltro(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="ativo">Ativo</MenuItem>
            <MenuItem value="inativo">Inativo</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Prioridade</InputLabel>
          <Select
            value={prioridadeFiltro}
            label="Prioridade"
            onChange={(e) => setPrioridadeFiltro(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="prioridade">Prioritário</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {products.length}/{maxProducts} produtos ({filteredProducts.length} filtrados)
      </Typography>

      <Grid container spacing={3} className="manage-stock-grid">
        {paginatedProducts.length === 0 ? (
          <Grid item xs={12}>
            <Typography align="center" color="textSecondary" sx={{ mt: 6 }}>
              Nenhum produto encontrado.
            </Typography>
          </Grid>
        ) : (
          paginatedProducts.map((product) => {
            const estoqueBaixo = Number(product.stock) <= 2;
            const esgotado = Number(product.stock) === 0;
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card className={`manage-stock-card${esgotado ? " esgotado" : ""}`}>
                  <Box sx={{ position: "relative" }}>
                    <CardMedia
                      component="img"
                      height="160"
                      image={product.images?.[0] || "/placeholder-product.jpg"}
                      alt={product.name}
                      className="manage-stock-card-img"
                    />
                    {esgotado && (
                      <Chip
                        label="ESGOTADO"
                        color="error"
                        size="small"
                        className="manage-stock-chip"
                        sx={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          fontWeight: 700,
                          fontSize: 13,
                          zIndex: 2,
                        }}
                      />
                    )}
                    {product.prioridade && (
                      <Chip
                        label="PRIORIDADE"
                        color="secondary"
                        size="small"
                        className="manage-stock-chip"
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          fontWeight: 700,
                          fontSize: 13,
                          zIndex: 2,
                        }}
                      />
                    )}
                  </Box>
                  <CardContent>
                    <Typography gutterBottom variant="h6" className="manage-stock-card-title">
                      {product.name}
                    </Typography>
                    <Typography className="lojinha-product-price" sx={{ fontWeight: 700 }}>
                      R$ {Number(product.price).toFixed(2)}
                      {product.anchorPrice && (
                        <Typography 
                          component="span" 
                          sx={{ 
                            textDecoration: 'line-through', 
                            color: 'text.secondary',
                            ml: 1,
                            fontSize: '0.9rem'
                          }}
                        >
                          R$ {Number(product.anchorPrice).toFixed(2)}
                        </Typography>
                      )}
                    </Typography>
                    <Box
                      className={estoqueBaixo ? "estoque-baixo" : "lojinha-product-stock"}
                      sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
                    >
                      Estoque: {Number(product.stock) ?? 0}
                      {estoqueBaixo && (
                        <Tooltip title="Estoque baixo!">
                          <WarningAmberRoundedIcon color="warning" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                    {product.categorias && product.categorias.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {product.categorias.map((cat, idx) => (
                          <Chip
                            key={idx}
                            label={cat}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions className="manage-stock-card-actions">
                    <Tooltip title="Editar">
                      <IconButton color="primary" onClick={() => handleEdit(product)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remover">
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => handleRemove(product)}
                          disabled={removingId === product.id}
                        >
                          {removingId === product.id ? (
                            <CircularProgress size={24} />
                          ) : (
                            <DeleteIcon />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={product.ativo ? "Desativar" : "Ativar"}>
                      <Switch
                        checked={product.ativo}
                        onChange={() => handleToggleAtivo(product)}
                        color="primary"
                        size="small"
                      />
                    </Tooltip>
                    <Tooltip title={product.prioridade ? "Remover prioridade" : "Definir como prioridade"}>
                      <span>
                        <IconButton
                          onClick={() => handleTogglePrioridade(product)}
                          color={product.prioridade ? "secondary" : "default"}
                          size="small"
                        >
                          {product.prioridade ? <StarIcon /> : <StarBorderIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {pageCount > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            size="small"
            sx={{ "& .MuiPaginationItem-root": { fontSize: 14 } }}
          />
        </Box>
      )}

      <ProductEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(newProduct) => {
          if (editingProduct) {
            setProducts(products.map(p => 
              p.id === editingProduct.id ? newProduct : p
            ));
          } else {
            setProducts([...products, newProduct]);
          }
          setModalOpen(false);
        }}
        initialProduct={editingProduct}
        categories={categorias}
        lojaId={lojaId}
        currentProductCount={products.length}
      />

      <Dialog 
        open={categoriasModalOpen} 
        onClose={() => setCategoriasModalOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <CategoriasManager lojaId={lojaId} />
      </Dialog>
    </Box>
  );
};

export default ManageStock;