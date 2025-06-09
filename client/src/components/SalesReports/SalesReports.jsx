import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from "@mui/material";

// Exemplo de função para buscar dados de vendas (substitua pela sua API ou Firestore)
const fetchSalesData = async () => {
  // Simulação de dados
  return [
    { id: 1, produto: "Produto 1", quantidade: 3, valor: 89.7, data: "2025-05-10" },
    { id: 2, produto: "Produto 2", quantidade: 1, valor: 49.9, data: "2025-05-11" },
    { id: 3, produto: "Produto 3", quantidade: 2, valor: 39.8, data: "2025-05-12" },
  ];
};

const SalesReports = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData().then((data) => {
      setSales(data);
      setLoading(false);
    });
  }, []);

  const total = sales.reduce((sum, s) => sum + s.valor, 0);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Relatórios de Vendas
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Produto</TableCell>
                  <TableCell>Quantidade</TableCell>
                  <TableCell>Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.data}</TableCell>
                    <TableCell>{sale.produto}</TableCell>
                    <TableCell>{sale.quantidade}</TableCell>
                    <TableCell>R$ {sale.valor.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, textAlign: "right", fontWeight: "bold" }}>
            Total vendido: R$ {total.toFixed(2)}
          </Box>
        </>
      )}
    </Box>
  );
};

export default SalesReports;