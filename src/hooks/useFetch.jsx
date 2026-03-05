import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_FIREBASE_URL;

// Helper to normalize a field that could be string or { name: string }
export function normalizeField(field) {
  if (!field) return "";
  if (typeof field === "object" && field.name) return field.name;
  return String(field);
}

// Normalize a raw player record coming from Firebase
function normalizePlayer(key, raw) {
  return {
    id: key,
    ...raw,
    gender: normalizeField(raw.gender),
    game: normalizeField(raw.game),
    stage: normalizeField(raw.stage),
    church: normalizeField(raw.church),
    form: normalizeField(raw.form),
    team: normalizeField(raw.team),
    name: normalizeField(raw.name),
  };
}

export default function useFetch() {
  const [players, setPlayers] = useState([]);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [errorFetch, setErrorFetch] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    setLoadingFetch(true);
    setErrorFetch(null);

    fetch(`${BASE_URL}/players.json`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then((data) => {
        if (data) {
          const playersArray = Object.keys(data).map((key) =>
            normalizePlayer(key, data[key])
          );
          setPlayers(playersArray);
        } else {
          setPlayers([]);
        }
        setLoadingFetch(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // component unmounted – ignore
        setPlayers([]);
        setErrorFetch("فشل جلب البيانات من السيرفر");
        setLoadingFetch(false);
      });

    return () => controller.abort();
  }, []);

  return [loadingFetch, errorFetch, players];
}
