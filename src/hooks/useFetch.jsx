import React, { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_FIREBASE_URL;

export default function useFetch() {
  const [players, setPlayers] = useState([]);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [errorFetch, setErrorFetch] = useState(null);

  useEffect(() => {
    setLoadingFetch(true);
    setErrorFetch(null);

    fetch(`${BASE_URL}/players.json`)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then((data) => {
        if (data) {
          const playersArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setPlayers(playersArray);
        } else {
          setPlayers([]);
        }
        setLoadingFetch(false);
      })
      .catch(() => {
        setPlayers([]);
        setErrorFetch("فشل جلب البيانات من السيرفر");
        setLoadingFetch(false);
      });
  }, []);

  return [loadingFetch, errorFetch, players];
}
