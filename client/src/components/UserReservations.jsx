import React from "react";

const UserReservations = ({ reservas }) => {
  return (
    <div style={{ marginTop: 32 }}>
      <h4>Minhas Reservas</h4>
      {(!reservas || reservas.length === 0) ? (
        <div style={{ color: '#888' }}>Nenhuma reserva encontrada.</div>
      ) : (
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {reservas.map((res, idx) => (
            <li key={idx} style={{ marginBottom: 18, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
              <div><strong>Pacote:</strong> {res.pacote}</div>
              <div><strong>Status:</strong> {res.status}</div>
              <div><strong>Data:</strong> {res.data}</div>
              {/* Em breve: botão para abrir chat */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserReservations;
