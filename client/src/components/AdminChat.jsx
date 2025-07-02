import React from "react";

const AdminChat = ({ messages, onSend, user, cliente }) => {
  const [msg, setMsg] = React.useState("");
  return (
    <div style={{ marginTop: 32, background: '#f8f9fa', borderRadius: 8, padding: 16 }}>
      <h4>Chat com {cliente?.name || 'Cliente'}</h4>
      <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
        {(messages || []).map((m, idx) => (
          <div key={idx} style={{ marginBottom: 8, textAlign: m.from === 'admin' ? 'right' : 'left' }}>
            <span style={{ background: m.from === 'admin' ? '#4a6bff' : '#eee', color: m.from === 'admin' ? '#fff' : '#222', padding: '6px 12px', borderRadius: 12, display: 'inline-block' }}>{m.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={e => { e.preventDefault(); onSend(msg); setMsg(""); }} style={{ display: 'flex', gap: 8 }}>
        <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Digite sua mensagem..." style={{ flex: 1, borderRadius: 8, border: '1px solid #ccc', padding: 8 }} />
        <button type="submit" style={{ background: '#4a6bff', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Enviar</button>
      </form>
    </div>
  );
};

export default AdminChat;
