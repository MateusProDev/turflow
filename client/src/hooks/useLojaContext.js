import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export function useLojaContext(propLojaId, propLojaData) {
  const { slug } = useParams();
  const [lojaId, setLojaId] = useState(propLojaId || null);
  const [lojaData, setLojaData] = useState(propLojaData || null);
  const [loading, setLoading] = useState(!propLojaId);

  useEffect(() => {
    async function fetchLoja() {
      setLoading(true);
      let finalLojaId = propLojaId;
      let finalLojaData = propLojaData;
      const isCustomDomain =
        typeof window !== "undefined" &&
        !window.location.host.endsWith("vercel.app") &&
        !window.location.host.includes("localhost") &&
        !window.location.host.includes("onrender.com");
      if (isCustomDomain && propLojaData && propLojaData.id) {
        finalLojaId = propLojaData.id;
        finalLojaData = propLojaData;
      } else if (!isCustomDomain && slug) {
        const lojaQuery = query(collection(db, "lojas"), where("slug", "==", slug));
        const lojaSnap = await getDocs(lojaQuery);
        if (!lojaSnap.empty) {
          finalLojaId = lojaSnap.docs[0].id;
          finalLojaData = { id: lojaSnap.docs[0].id, ...lojaSnap.docs[0].data() };
        }
      }
      setLojaId(finalLojaId);
      setLojaData(finalLojaData);
      setLoading(false);
    }
    if (!propLojaId || !propLojaData) fetchLoja();
  }, [propLojaId, propLojaData, slug]);

  return { lojaId, lojaData, loading };
}
