import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import games from "../data/games";
import stages from "../data/stages";

const REG_DOC = doc(db, "settings", "registration");
const VISIBILITY_DOC = doc(db, "settings", "visibility");

// دلوقتي: visibility.stages[gameName][stageName] = true/false
// كل لعبة عندها خريطة مراحل مستقلة
function defaultVisibility() {
  const g = {};
  games.forEach((game) => (g[game.name] = true));

  const s = {};
  games.forEach((game) => {
    s[game.name] = {};
    stages.forEach((stage) => (s[game.name][stage.name] = true));
  });

  return { games: g, stages: s };
}

/**
 * حالة فتح/غلق الموقع + إظهار/إخفاء الألعاب، وإظهار/إخفاء المراحل
 * لكل لعبة على حدة وقت التسجيل.
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
      const defaults = defaultVisibility();

      if (snap.exists()) {
        const data = snap.data();
        const savedStages = data.stages || {};

        // دمج المراحل المحفوظة مع الديفولت، لعبة لعبة
        const mergedStages = {};
        games.forEach((game) => {
          mergedStages[game.name] = {
            ...defaults.stages[game.name],
            ...(savedStages[game.name] || {}),
          };
        });

        setVisibility({
          games: { ...defaults.games, ...(data.games || {}) },
          stages: mergedStages,
        });
      } else {
        setVisibility(defaults);
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

  // بقى بياخد اسم اللعبة كمان عشان يعرف يظبط المرحلة جوه اللعبة الصح
  const setStageVisible = useCallback(
    async (gameName, stageName, visible) => {
      const next = {
        ...visibility,
        stages: {
          ...visibility.stages,
          [gameName]: {
            ...visibility.stages[gameName],
            [stageName]: visible,
          },
        },
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
