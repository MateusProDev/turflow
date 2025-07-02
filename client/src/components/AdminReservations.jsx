import React from "react";

const AdminReservations = ({ reservas, onStatusChange }) => {
  return (
    <div style={{ marginTop: 32 }}>
      <h4>Reservas da Loja</h4>
      {(!reservas || reservas.length === 0) ? (
        <div style={{ color: '#888' }}>Nenhuma reserva recebida ainda.</div>
      ) : (
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {reservas.map((res, idx) => (
            <li key={idx} style={{ marginBottom: 18, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
              <div><strong>Cliente:</strong> {res.cliente}</div>
              <div><strong>Pacote:</strong> {res.pacote}</div>
              <div><strong>Status:</strong> {res.status}</div>
              <div><strong>Data:</strong> {res.data}</div>
              <select value={res.status} onChange={e => onStatusChange(res.id, e.target.value)} style={{ marginTop: 8 }}>
                <option value="aguardando">Aguardando</option>
                <option value="confirmada">Confirmada</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
              {/* Em breve: botão para abrir chat */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminReservations;
