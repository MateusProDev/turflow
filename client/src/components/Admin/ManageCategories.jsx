import React, { useState, useEffect } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Toolbar,
  AppBar,
  Typography,
  Box,
  CssBaseline,
  CircularProgress,
  Button,
  Grid,
  Card,
  TextField, // Removido daqui se não usado mais diretamente
  CardMedia,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  WhatsApp as WhatsAppIcon,
  Inventory as InventoryIcon,
  PointOfSale as PointOfSaleIcon,
  Assessment as AssessmentIcon,
  Home as HomeIcon,
  Upgrade as UpgradeIcon,
  Preview as PreviewIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import PlanoUpgrade from "../PlanoUpgrade/PlanoUpgrade";
import "./Dashboard.css";
import EditHeader from "../Admin/EditHeader/EditHeader";
import EditBanner from "../Admin/EditBanner/EditBanner";
import EditFooter from "../Admin/EditFooter/EditFooter";
import ManageStock from "../ManageStock/ManageStock";
import SalesReports from "../SalesReports/SalesReports";
import LojinhaPreview from "../LojinhaPreview/LojinhaPreview";
import DashboardHome from "./DashboardHome";
import PaymentsSettings from "../PaymentsSettings/PaymentsSettings"; // <-- 1. Importe o novo componente
import CustomDomainConfig from "../CustomDomainConfig/CustomDomainConfig"; // <-- Adicione esta linha
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";

const Dashboard = ({ user }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState("Home");
  const [userPlan, setUserPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [products, setProducts] = useState([]);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [headerTitle, setHeaderTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerImages, setBannerImages] = useState([]);
  const [newBannerImage, setNewBannerImage] = useState("");
  const [corPrimaria, setCorPrimaria] = useState("#4a6bff");
  const [exibirLogo, setExibirLogo] = useState(true);
  const [footerData, setFooterData] = useState({});
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentAuthUser = user || auth.currentUser;
        if (!currentAuthUser) {
          navigate("/login");
          return;
        }

        const unsubscribe = onSnapshot(doc(db, "usuarios", currentAuthUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserPlan(userData.plano || "free");
            setCurrentUser(currentAuthUser);

            getDoc(doc(db, "lojas", currentAuthUser.uid)).then((storeSnap) => {
              if (storeSnap.exists()) {
                const storeData = storeSnap.data();
                setStoreData({ ...storeData, id: storeSnap.id }); // <-- Garanta que storeData é setado
                setHeaderTitle(storeData.headerTitle || storeData.nome || "Minha Loja");
                setWhatsappNumber(storeData.whatsappNumber || "");
                setLogoUrl(storeData.logoUrl || "");
                setBannerImages(storeData.bannerImages || []);
                setCorPrimaria(storeData.configs?.corPrimaria || "#4a6bff");
                setExibirLogo(storeData.exibirLogo !== false);
                setFooterData(storeData.footer || {});

                getDocs(collection(db, `lojas/${currentAuthUser.uid}/produtos`)).then((productsSnapshot) => {
                  const productsList = productsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }));
                  setProducts(productsList);
                });
              } else {
                navigate("/criar-loja");
              }
            });
          }
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, navigate, auth]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const saveHeaderChanges = async () => {
    try {
      await updateDoc(doc(db, "lojas", currentUser.uid), {
        headerTitle,
        logoUrl, // Adicione se necessário
        exibirLogo, // Adicione se necessário
      });
      alert("Cabeçalho atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar cabeçalho:", error);
      alert("Erro ao salvar cabeçalho");
    }
  };

  const saveWhatsappChanges = async () => {
    try {
      await updateDoc(doc(db, "lojas", currentUser.uid), {
        whatsappNumber,
      });
      alert("WhatsApp atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar WhatsApp:", error);
      alert("Erro ao salvar WhatsApp");
    }
  };

  const saveFooterChanges = async (newFooterData) => {
    try {
      await updateDoc(doc(db, "lojas", currentUser.uid), {
        footer: newFooterData,
      });
      setFooterData(newFooterData);
      setStoreData(prev => ({
        ...prev,
        footer: newFooterData
      }));
      alert("Footer atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar footer:", error);
      alert("Erro ao salvar footer");
    }
  };

  const addBannerImage = async () => {
    if (!newBannerImage) return;
    try {
      const updatedBannerImages = [...bannerImages, newBannerImage];
      await updateDoc(doc(db, "lojas", currentUser.uid), {
        bannerImages: updatedBannerImages,
      });
      setBannerImages(updatedBannerImages);
      setNewBannerImage("");
      alert("Imagem adicionada ao banner!");
    } catch (error) {
      console.error("Erro ao adicionar imagem:", error);
      alert("Erro ao adicionar imagem");
    }
  };

  const removeBannerImage = async (index) => {
    try {
      const updatedBannerImages = bannerImages.filter((_, i) => i !== index);
      await updateDoc(doc(db, "lojas", currentUser.uid), {
        bannerImages: updatedBannerImages,
      });
      setBannerImages(updatedBannerImages);
      alert("Imagem removida do banner!");
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      alert("Erro ao remover imagem");
    }
  };

    const handleHeaderUpdate = (newHeaderTitle, newLogoUrl, newExibirLogo) => {
        setHeaderTitle(newHeaderTitle);
        setLogoUrl(newLogoUrl);
        setExibirLogo(newExibirLogo);
        setStoreData((prev) => ({
            ...prev,
            nome: newHeaderTitle, // ou headerTitle
            logoUrl: newLogoUrl,
            exibirLogo: newExibirLogo,
        }));
    };


  const menuItems = [
    { text: "Home", icon: <HomeIcon />, allowedPlans: ["free", "plus", "premium"] },
    { text: "Editar Cabeçalho", icon: <EditIcon />, allowedPlans: ["free", "plus", "premium"] },
    { text: "Editar Banner", icon: <ImageIcon />, allowedPlans: ["free", "plus", "premium"] },
    { text: "Editar Rodapé", icon: <EditIcon />, allowedPlans: ["free", "plus", "premium"] }, // Usando EditIcon
    { text: "Gerenciar Estoque", icon: <InventoryIcon />, allowedPlans: ["free", "plus", "premium"] },
    { text: "Registrar Venda", icon: <PointOfSaleIcon />, allowedPlans: ["plus", "premium"] },
    { text: "Relatórios de Vendas", icon: <AssessmentIcon />, allowedPlans: ["plus", "premium"] },
    { text: "Configurar WhatsApp", icon: <WhatsAppIcon />, allowedPlans: ["free", "plus", "premium"] },
    { text: "Pagamentos", icon: <PointOfSaleIcon />, allowedPlans: ["free", "plus", "premium"] }, // Adicionado ícone
    { text: "Visualizar Loja", icon: <PreviewIcon />, allowedPlans: ["plus", "premium"] },
    { text: "Upgrade de Plano", icon: <UpgradeIcon />, allowedPlans: ["free", "plus", "premium"] },
    { text: "Domínio Personalizado", icon: <HomeIcon />, allowedPlans: ["plus", "premium"] }, // <-- Adicione esta linha (ajuste o ícone se quiser)
  ];

  const renderContent = () => {
    if (loading || !storeData) { // <-- Adicionado !storeData
      return (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    const isSectionAllowed = menuItems.some(
      (item) => item.text === selectedSection && item.allowedPlans.includes(userPlan)
    );

    if (!isSectionAllowed && selectedSection !== "Home") { // <-- Permite ir para Home
      setSelectedSection("Home");
      // Não precisa renderizar Home aqui, o switch fará isso.
    }


    switch (selectedSection) {
      case "Home":
        return (
          <DashboardHome
            storeData={storeData}
            userPlan={userPlan}
            navigate={navigate}
            setSelectedSection={setSelectedSection}
          />
        );
      case "Editar Cabeçalho":
        return (
          <EditHeader
            headerTitle={headerTitle}
            setHeaderTitle={setHeaderTitle}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            exibirLogo={exibirLogo}
            setExibirLogo={setExibirLogo}
            onSave={saveHeaderChanges}
            currentUser={currentUser}
            onUpdate={handleHeaderUpdate}
          />
        );
      case "Editar Banner":
        return (
          <EditBanner
            bannerImages={bannerImages}
            setBannerImages={setBannerImages}
            newBannerImage={newBannerImage}
            setNewBannerImage={setNewBannerImage}
            onAddBanner={addBannerImage}
            onRemoveBanner={removeBannerImage}
            currentUser={currentUser}
            userPlan={userPlan}
          />
        );
      case "Editar Rodapé":
        return (
          <EditFooter
            nomeLoja={headerTitle || storeData?.nome || "Minha Loja"}
            footerData={footerData}
            onSave={saveFooterChanges}
            onCancel={() => setSelectedSection("Home")}
          />
        );
      case "Gerenciar Estoque":
        return (
          <ManageStock
            products={products}
            setProducts={setProducts}
            userPlan={userPlan} // <-- Passando userPlan
            lojaId={currentUser?.uid} // <-- Passando lojaId
          />
        );
      case "Relatórios de Vendas":
        return <SalesReports currentUser={currentUser} />;
      case "Configurar WhatsApp":
        return (
          <div>
            <h2>Configurar WhatsApp para Vendas</h2>
            <TextField // <-- Precisa importar TextField se ainda não estiver
              label="Número do WhatsApp (com DDD)"
              fullWidth
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Ex: 5585999999999"
            />
            <Button variant="contained" onClick={saveWhatsappChanges}>
              Salvar Número
            </Button>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Este número será usado para os clientes entrarem em contato diretamente da loja.
            </Typography>
          </div>
        );
      case "Visualizar Loja":
        return <LojinhaPreview user={storeData} />;
      case "Upgrade de Plano":
        return currentUser ? <PlanoUpgrade user={currentUser} /> : null;
      // Remova o case "Preview Estático" se não for mais necessário
      case "Pagamentos": // <-- 2. Renderize o novo componente
        return (
          <PaymentsSettings
            storeData={storeData}
            setStoreData={setStoreData} // <-- Passe a função setStoreData
            currentUser={currentUser}
            userPlan={userPlan}
          />
        );
      case "Domínio Personalizado":
        return (
          <CustomDomainConfig
            currentUser={currentUser}
            storeData={storeData}
            userPlan={userPlan}
            onSaveChanges={async (label, data, msg) => {
              try {
                await updateDoc(doc(db, "lojas", currentUser.uid), data);
                alert(msg || "Domínio atualizado!");
                setStoreData(prev => ({ ...prev, ...data }));
                return true;
              } catch (e) {
                alert("Erro ao salvar domínio.");
                return false;
              }
            }}
            apiBaseUrl={process.env.REACT_APP_API_URL || "https://storesync.onrender.com"}
            onUpgradePlanClick={() => setSelectedSection("Upgrade de Plano")}
          />
        );
      default:
        return (
          <div>
            <h2>{selectedSection}</h2>
            <p>Seção em desenvolvimento.</p>
          </div>
        );
    }
  };

  const filteredMenuItems = menuItems.filter((item) => item.allowedPlans.includes(userPlan));

  const drawerContent = (
    <div className="admin-loja-drawer-container">
      <Toolbar className="admin-loja-drawer-header">
        <Typography variant="h6" noWrap>
          {storeData?.nome || headerTitle || "Minha Loja"}
        </Typography>
      </Toolbar>
      <List className="admin-loja-menu-list">
        {filteredMenuItems.map((item, index) => (
          <ListItem
            button
            key={index}
            onClick={() => {
              setSelectedSection(item.text);
              setMobileOpen(false);
            }}
            className={selectedSection === item.text ? "admin-loja-active" : ""}
          >
            <ListItemIcon className="admin-loja-menu-icon">{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <div className="admin-loja-logout-button" onClick={handleLogout}>
        <LogoutIcon sx={{ mr: 1 }} />
        Sair
      </div>
    </div>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: (theme) => theme.palette.primary.main || "#4a6bff",
          display: { sm: "none" },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {storeData?.nome || headerTitle || "Minha Loja"}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: 260,
          flexShrink: 0,
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            width: 260,
            boxSizing: "border-box",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { width: 260 },
        }}
      >
        {drawerContent}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 260px)` },
          ml: { sm: "260px" },
          mt: { xs: "56px", sm: 0 },
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default Dashboard;