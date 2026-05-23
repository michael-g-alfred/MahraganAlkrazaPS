import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";

export function normalizeField(field) {
  if (!field) return "";
  if (typeof field === "object" && field.name) return field.name;
  return String(field);
}

export default function useFetch() {
  const [players, setPlayers] = useState([]);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [errorFetch, setErrorFetch] = useState(null);

  useEffect(() => {
    setLoadingFetch(true);
    setErrorFetch(null);

    getDocs(collection(db, "players"))
      .then((snapshot) => {
        const arr = snapshot.docs.map((doc) => {
          const raw = doc.data();
          return {
            id: doc.id,
            ...raw,
            gender: normalizeField(raw.gender),
            game: normalizeField(raw.game),
            stage: normalizeField(raw.stage),
            church: normalizeField(raw.church),
            form: normalizeField(raw.form),
            team: normalizeField(raw.team),
            name: normalizeField(raw.name),
          };
        });
        setPlayers(arr);
        setLoadingFetch(false);
      })
      .catch(() => {
        setErrorFetch("فشل جلب البيانات من السيرفر");
        setLoadingFetch(false);
      });
  }, []);

  return [loadingFetch, errorFetch, players];
}
