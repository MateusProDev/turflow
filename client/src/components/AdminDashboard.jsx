import React from "react";

const AdminDashboard = ({ loja, reservas }) => {
  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001' }}>
      <h2>Dashboard da Agência</h2>
      <div style={{ marginBottom: 24 }}>
        <strong>Loja:</strong> {loja?.nome || 'Minha Agência'}<br />
        <strong>Email:</strong> {loja?.email || '-'}
      </div>
      <hr style={{ margin: '24px 0' }} />
      <h3>Reservas Recebidas</h3>
      <div style={{ color: '#888', fontSize: 15 }}>Aqui aparecerão todas as reservas feitas pelos clientes. Você poderá atualizar o status e responder dúvidas.</div>
      {/* Em breve: listagem de reservas e chat */}
    </div>
  );
};

export default AdminDashboard;
