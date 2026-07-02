import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import games from "../data/games";
import stages from "../data/stages";

const REG_DOC = doc(db, "settings", "registration");
const VISIBILITY_DOC = doc(db, "settings", "visibility");

function defaultVisibility() {
  const g = {};
  games.forEach((game) => (g[game.name] = true));
  const s = {};
  stages.forEach((stage) => (s[stage.name] = true));
  return { games: g, stages: s };
}

/**
 * حالة فتح/غلق الموقع + إظهار/إخفاء الألعاب والمراحل وقت التسجيل.
 * أي تغيير بيتحفظ في Firestore ويظهر فورًا لكل المستخدمين (real-time).
 */
export default function useSiteSettings() {
  const [closed, setClosed] = useState(false);
  const [visibility, setVisibility] = useState(defaultVisibility());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub1 = onSnapshot(REG_DOC, (snap) => {
      setClosed(snap.exists() ? snap.data().closed === true : false);
      setLoading(false);
    });

    const unsub2 = onSnapshot(VISIBILITY_DOC, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setVisibility({
          games: { ...defaultVisibility().games, ...(data.games || {}) },
          stages: { ...defaultVisibility().stages, ...(data.stages || {}) },
        });
      } else {
        setVisibility(defaultVisibility());
      }
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const toggleSiteClosed = useCallback(async () => {
    await setDoc(REG_DOC, { closed: !closed }, { merge: true });
  }, [closed]);

  const setGameVisible = useCallback(
    async (name, visible) => {
      const next = {
        ...visibility,
        games: { ...visibility.games, [name]: visible },
      };
      setVisibility(next);
      await setDoc(VISIBILITY_DOC, next, { merge: true });
    },
    [visibility],
  );

  const setStageVisible = useCallback(
    async (name, visible) => {
      const next = {
        ...visibility,
        stages: { ...visibility.stages, [name]: visible },
      };
      setVisibility(next);
      await setDoc(VISIBILITY_DOC, next, { merge: true });
    },
    [visibility],
  );

  return {
    closed,
    loading,
    visibility,
    toggleSiteClosed,
    setGameVisible,
    setStageVisible,
  };
}
