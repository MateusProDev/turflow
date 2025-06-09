import React from "react";
import { Grid, Card, CardContent, Typography, CardActions, Button, Alert } from "@mui/material";
import { Add as AddIcon, Settings as SettingsIcon, Preview as PreviewIcon } from "@mui/icons-material";

const DashboardHome = ({ storeData, userPlan, navigate, setSelectedSection }) => (
  <div>
    <h2>Bem-vindo ao Painel da sua Loja</h2>
    <p>Aqui você pode gerenciar todos os aspectos da sua loja virtual.</p>
    <Grid container spacing={3} mt={2}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Resumo da Loja</Typography>
            <Typography variant="body2">
              <strong>Nome:</strong> {storeData?.nome || "Não definido"}<br />
              <strong>Segmento:</strong> {storeData?.segmento || "Não definido"}<br />
              <strong>Plano:</strong> {userPlan}
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              size="small"
              startIcon={<PreviewIcon />}
              onClick={() => navigate(`/${storeData.slug}`)}
            >
              Visualizar Loja
            </Button>
          </CardActions>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Ações Rápidas</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setSelectedSection("Gerenciar Estoque")}
              sx={{ mt: 1, mr: 1 }}
            >
              Adicionar Produto
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setSelectedSection("Editar Cabeçalho")}
              sx={{ mt: 1 }}
            >
              Configurar Loja
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
    {userPlan === "free" && (
      <Alert severity="info" sx={{ mt: 3 }}>
        Você está no plano Free.{" "}
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => setSelectedSection("Upgrade de Plano")}
          sx={{ ml: 1 }}
        >
          Faça upgrade agora
        </Button>{" "}
        para acessar todos os recursos.
      </Alert>
    )}
  </div>
);

export default DashboardHome;