import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const UserArea = ({ lojaId }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser && lojaId) {
        const snap = await getDoc(doc(db, "lojas", lojaId, "usuarios", firebaseUser.uid));
        setUserData(snap.exists() ? snap.data() : null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [lojaId]);

  if (loading) return <div style={{textAlign:'center',marginTop:80}}>Carregando...</div>;
  if (!user) return <div style={{textAlign:'center',marginTop:80}}>Faça login para acessar sua área de usuário.</div>;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001' }}>
      <h2>Minha Conta</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#4a6bff' }}>
          {userData?.avatarUrl ? <img src={userData.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : (userData?.nome ? userData.nome[0].toUpperCase() : <i className="fas fa-user" />)}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 20 }}>{userData?.nome || user?.displayName || 'Visitante'}</div>
          <div style={{ color: '#888', fontSize: 15 }}>{userData?.email || user?.email}</div>
        </div>
      </div>
      <hr style={{ margin: '24px 0' }} />
      <h3>Minhas Reservas</h3>
      <div style={{ color: '#888', fontSize: 15 }}>Aqui aparecerão suas reservas e mensagens com a agência.</div>
      {/* Em breve: listagem de reservas e chat */}
    </div>
  );
};

export default UserArea;
