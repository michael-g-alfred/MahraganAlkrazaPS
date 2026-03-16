import { useState, useEffect, useRef } from "react";

const BASE_URL = import.meta.env.VITE_FIREBASE_URL;

export default function useBracket(bracketKey) {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevKeyRef = useRef(null);

  const safeBracketKey =
    bracketKey ?
      bracketKey.replace(/\s+/g, "_").replace(/[./[\]#$]/g, "_")
    : null;

  useEffect(() => {
    if (!safeBracketKey) {
      setBracket(null);
      return;
    }

    // reset لو اتغير الـ key
    if (prevKeyRef.current !== safeBracketKey) {
      setBracket(null);
      prevKeyRef.current = safeBracketKey;
    }

    setLoading(true);
    setError(null);

    fetch(`${BASE_URL}/brackets/${safeBracketKey}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        // Firebase بيرجع null لو مفيش بيانات
        setBracket(data || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("useBracket fetch error:", err);
        setError("فشل تحميل الخريطة");
        setLoading(false);
      });
  }, [safeBracketKey]);

  const saveBracket = async (data) => {
    if (!safeBracketKey) return;
    const res = await fetch(`${BASE_URL}/brackets/${safeBracketKey}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Save failed: " + res.status);
    setBracket(data);
    return data;
  };

  return { bracket, loading, error, saveBracket };
}
