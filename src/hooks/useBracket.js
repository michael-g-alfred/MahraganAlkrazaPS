import { useState, useEffect, useRef } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";

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

    if (prevKeyRef.current !== safeBracketKey) {
      setBracket(null);
      prevKeyRef.current = safeBracketKey;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, "brackets", safeBracketKey),
      (snap) => {
        setBracket(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      () => {
        setError("فشل تحميل الخريطة");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [safeBracketKey]);

  const saveBracket = async (data) => {
    if (!safeBracketKey) return;
    await setDoc(doc(db, "brackets", safeBracketKey), data);
    return data;
  };

  return { bracket, loading, error, saveBracket };
}
