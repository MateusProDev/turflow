// src/components/Admin/EditBanner/EditBanner.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardActions,
  Typography,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
} from "@mui/material";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import CloudinaryUploadWidget from "../../CloudinaryUploadWidget/CloudinaryUploadWidget";
import styles from "./EditBanner.module.css"; // Use CSS modules

const EditBanner = ({
  bannerImages,
  setBannerImages,
  newBannerImage,
  setNewBannerImage,
  onAddBanner,
  onRemoveBanner,
  currentUser,
  userPlan = "free",
}) => {
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [bannerFormData, setBannerFormData] = useState({
    alt: "",
    linkTo: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // Define banner limits based on user plan
  const getPlanBannerLimit = useCallback(() => {
    switch (userPlan) {
      case "premium":
        return 5;
      case "plus":
        return 3;
      case "free":
      default:
        return 1;
    }
  }, [userPlan]);

  const bannerLimit = getPlanBannerLimit();
  const remainingBanners = bannerLimit - bannerImages.length;

  // Carrega banners do Firestore como array
  useEffect(() => {
    const fetchBanners = async () => {
      if (!currentUser?.uid) {
        setUploadError("Usuário não autenticado");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const storeDoc = await getDoc(doc(db, "lojas", currentUser.uid));
        if (storeDoc.exists()) {
          const storeData = storeDoc.data();
          // Sempre trate como array
          let bannersArr = [];
          if (Array.isArray(storeData.bannerImages)) {
            bannersArr = storeData.bannerImages;
          } else if (
            storeData.bannerImages &&
            typeof storeData.bannerImages === "object"
          ) {
            bannersArr = Object.values(storeData.bannerImages).filter(
              (b) => b && b.url
            );
          }
          setBannerImages(bannersArr);
        }
      } catch (error) {
        setUploadError("Erro ao carregar os banners");
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [currentUser, setBannerImages]);

  // Salva banners como array no Firestore
  const saveBannerChanges = async (updatedBanners) => {
    try {
      await updateDoc(doc(db, "lojas", currentUser.uid), {
        bannerImages: updatedBanners,
      });
      setBannerImages(updatedBanners);
      return true;
    } catch (error) {
      setUploadError("Erro ao salvar as imagens do banner");
      return false;
    }
  };

  // Adiciona novo banner (apenas URL)
  const handleAddBanner = () => {
    if (!newBannerImage) return;
    if (bannerImages.length >= bannerLimit) {
      setUploadError(`Seu plano ${userPlan} permite apenas ${bannerLimit} banner(s)`);
      return;
    }
    const newBanner = { url: newBannerImage, alt: "", linkTo: "" };
    const updatedBanners = [...bannerImages, newBanner];
    saveBannerChanges(updatedBanners);
    setNewBannerImage("");
    setUploadError("");
  };

  // Remove banner pelo índice
  const handleRemoveBanner = (index) => {
    const updatedBanners = bannerImages.filter((_, i) => i !== index);
    saveBannerChanges(updatedBanners);
    setUploadError("");
  };

  // Validate form inputs
  const validateForm = () => {
    const errors = {};
    if (!bannerFormData.alt.trim()) {
      errors.alt = "O texto alternativo é obrigatório";
    }
    if (
      bannerFormData.linkTo &&
      !/^(\/|https?:\/\/)/.test(bannerFormData.linkTo)
    ) {
      errors.linkTo = "Insira um link válido (ex: /promocao ou https://...)";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle dialog save
  const handleDialogSave = async () => {
    if (!currentBanner || !validateForm()) return;

    const newBanner = {
      ...currentBanner,
      alt: bannerFormData.alt.trim(),
      linkTo: bannerFormData.linkTo.trim(),
    };

    const updatedBanners = [...bannerImages, newBanner];
    setBannerImages(updatedBanners);
    await saveBannerChanges(updatedBanners);
    setOpenDialog(false);
    setCurrentBanner(null);
    setFormErrors({});
    setUploadError("");
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBannerFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.editBannerContainer}>
      <Typography variant="h4" gutterBottom>
        Editar Banner
      </Typography>

      <Box sx={{ mb: 3 }} className={styles.bannerLimitInfo}>
        <Typography variant="body1" gutterBottom>
          Seu plano <strong>{userPlan.toUpperCase()}</strong> permite até{" "}
          <strong>{bannerLimit}</strong> banner(s).{" "}
          {remainingBanners > 0 ? (
            <span>
              Você ainda pode adicionar <strong>{remainingBanners}</strong>{" "}
              banner(s).
            </span>
          ) : (
            <span>Você atingiu o limite de banners para seu plano.</span>
          )}
        </Typography>
      </Box>

      {uploadError && (
        <Alert severity="error" sx={{ mb: 2 }} className={styles.alertError}>
          {uploadError}
        </Alert>
      )}

      {loading ? (
        <Typography className={styles.loadingText}>Carregando banners...</Typography>
      ) : (
        <>
          {remainingBanners > 0 && (
            <Box sx={{ mb: 3 }} className={styles.uploadSection}>
              <Typography variant="h6" gutterBottom>
                Adicionar banner
              </Typography>
              <CloudinaryUploadWidget
                onUpload={(url) => setNewBannerImage(url)}
              >
                <Button
                  variant="contained"
                  color="primary"
                  component="span"
                  className={styles.uploadButton}
                >
                  {newBannerImage ? "Alterar Imagem" : "Enviar Imagem"}
                </Button>
              </CloudinaryUploadWidget>
              {newBannerImage && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={newBannerImage}
                    alt="Preview do banner"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                </Box>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddBanner}
                disabled={!newBannerImage}
                sx={{ mt: 2 }}
                className={styles.addButton}
              >
                Adicionar ao Banner
              </Button>
            </Box>
          )}

          {bannerImages.length > 0 ? (
            <Grid container spacing={2} className={styles.bannerGrid}>
              {bannerImages.map((banner, idx) => (
                <Grid item xs={12} sm={6} md={4} key={banner.url || idx}>
                  <Card className={styles.card}>
                    <CardMedia
                      component="img"
                      height="180"
                      image={banner.url}
                      alt={banner.alt || `Banner ${idx + 1}`}
                      className={styles.cardMedia}
                    />
                    <Box p={1} className={styles.cardContent}>
                      {banner.alt && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          className={styles.typographyBody2}
                        >
                          Texto alternativo: {banner.alt}
                        </Typography>
                      )}
                      {banner.linkTo && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          className={styles.typographyBody2}
                        >
                          Link: {banner.linkTo}
                        </Typography>
                      )}
                    </Box>
                    <CardActions className={styles.cardActions}>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleRemoveBanner(idx)}
                        aria-label={`Remover banner ${idx + 1}`}
                        className={styles.buttonError}
                      >
                        Remover
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" className={styles.alertInfo}>
              Você ainda não adicionou nenhum banner. Adicione imagens para exibir
              na página inicial da sua loja.
            </Alert>
          )}

          {userPlan === "free" && (
            <Alert severity="info" sx={{ mt: 3 }} className={styles.alertInfo}>
              Faça upgrade para o plano Plus e tenha direito a 3 banners, ou para o
              Premium e tenha direito a 5 banners!
            </Alert>
          )}

          {userPlan === "plus" && (
            <Alert severity="info" sx={{ mt: 3 }} className={styles.alertInfo}>
              Faça upgrade para o plano Premium e tenha direito a 5 banners!
            </Alert>
          )}
        </>
      )}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="banner-dialog-title"
        className={styles.dialog}
      >
        <DialogTitle id="banner-dialog-title" className={styles.dialogTitle}>
          Detalhes do Banner
        </DialogTitle>
        <DialogContent className={styles.dialogContent}>
          {currentBanner && (
            <>
              <Box sx={{ mb: 2, mt: 1 }}>
                <img
                  src={currentBanner.url}
                  alt="Preview do banner"
                  style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
                />
              </Box>
              <FormControl
                fullWidth
                sx={{ mb: 2 }}
                error={!!formErrors.alt}
                className={styles.formControl}
              >
                <InputLabel htmlFor="banner-alt" className={styles.inputLabel}>
                  Texto alternativo
                </InputLabel>
                <OutlinedInput
                  id="banner-alt"
                  name="alt"
                  value={bannerFormData.alt}
                  onChange={handleInputChange}
                  label="Texto alternativo"
                  aria-describedby="banner-alt-helper"
                  className={styles.outlinedInput}
                />
                <FormHelperText
                  id="banner-alt-helper"
                  className={styles.formHelperText}
                >
                  {formErrors.alt ||
                    "Descreva o conteúdo do banner (ajuda na acessibilidade)"}
                </FormHelperText>
              </FormControl>
              <FormControl
                fullWidth
                error={!!formErrors.linkTo}
                className={styles.formControl}
              >
                <InputLabel htmlFor="banner-link" className={styles.inputLabel}>
                  Link (opcional)
                </InputLabel>
                <OutlinedInput
                  id="banner-link"
                  name="linkTo"
                  value={bannerFormData.linkTo}
                  onChange={handleInputChange}
                  label="Link (opcional)"
                  placeholder="/promocao ou https://..."
                  aria-describedby="banner-link-helper"
                  className={styles.outlinedInput}
                />
                <FormHelperText
                  id="banner-link-helper"
                  className={styles.formHelperText}
                >
                  {formErrors.linkTo || ""}
                </FormHelperText>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button
            onClick={() => setOpenDialog(false)}
            className={styles.button}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDialogSave}
            disabled={!!formErrors.alt || !!formErrors.linkTo}
            className={styles.buttonPrimary}
          >
            Salvar Banner
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EditBanner;