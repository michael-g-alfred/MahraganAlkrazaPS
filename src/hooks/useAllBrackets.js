import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";

/**
 * يجيب كل القرعات (brackets) المُنشأة حاليًا في السيرفر، real-time.
 * كل مستند id بيكون بالشكل: game__gender__form__stage
 */
export default function useAllBrackets() {
  const [brackets, setBrackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "brackets"),
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBrackets(arr);
        setLoading(false);
      },
      () => {
        setError("فشل تحميل القرعات");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  return { brackets, loading, error };
}
