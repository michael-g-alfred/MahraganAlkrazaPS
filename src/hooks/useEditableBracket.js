import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { propagateWinners } from "../utils/generateBracket";

/**
 * منطق تعديل قرعة موجودة بالفعل (إدخال نتيجة / تأكيد فائز) —
 * مستقل عن إنشاء أو مسح القرعة، بيستخدم فى صفحة /brackets للأدمن الكامل فقط.
 */
export default function useEditableBracket(bracketId, initialBracket) {
  const [localBracket, setLocalBracket] = useState(initialBracket);
  const [saving, setSaving] = useState(false);
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);

  useEffect(() => {
    setLocalBracket(initialBracket);
  }, [initialBracket]);

  const save = async (updated) => {
    await setDoc(doc(db, "brackets", bracketId), updated);
  };

  const handleRelayPlayerScoreChange = (matchIdx, playerIdx, value) => {
    setLocalBracket((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated.rounds[activeRoundIdx].matches[matchIdx].players[
        playerIdx
      ].score = value;
      return updated;
    });
  };

  const handleNormalScoreChange = (matchIdx, field, value) => {
    setLocalBracket((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated.rounds[activeRoundIdx].matches[matchIdx][field] =
        value === "" ? null : value;
      return updated;
    });
  };

  const handleSetChurchWinner = async (matchIdx) => {
    const group = localBracket.rounds[activeRoundIdx].matches[matchIdx];

    const hasInvalidTime = group.players.some(
      (p) =>
        p.score === undefined ||
        p.score === null ||
        p.score === "" ||
        Number(p.score) <= 0,
    );
    if (hasInvalidTime) {
      toast.error("برجاء إدخال توقيتات صحيحة أكبر من الصفر");
      return;
    }

    const minTime = Math.min(
      ...group.players.map((p) => parseFloat(p.score)),
    );
    const bestPlayers = group.players.filter(
      (p) => parseFloat(p.score) === minTime,
    );
    const winnerEntries = bestPlayers.map((p) =>
      group.isChurchHeat ? `${p.name}-${group.churchName}` : p.name,
    );
    const displayNames = bestPlayers.map((p) => p.name).join(" و ");

    setSaving(true);
    try {
      const updated = JSON.parse(JSON.stringify(localBracket));
      const targetMatch = updated.rounds[activeRoundIdx].matches[matchIdx];
      targetMatch.winner = winnerEntries.join("\n");
      targetMatch.winnerTime = minTime;

      const hadChampionBefore = updated.rounds.some(
        (r) => r.roundName === "بطل المسابقة",
      );
      propagateWinners(updated.rounds);
      const championRound = updated.rounds.find(
        (r) => r.roundName === "بطل المسابقة",
      );

      await save(updated);
      setLocalBracket(updated);

      if (championRound && !hadChampionBefore) {
        const championNames = championRound.matches[0].winner
          .split("\n")
          .map((line) => line.split("-")[0])
          .join(" و ");
        toast.success(`🏆 البطل: ${championNames}`);
      } else {
        toast.success(`أسرع لاعب في ${group.churchName}: ${displayNames}`);
      }
    } catch {
      toast.error("فشل حفظ التصفية");
    } finally {
      setSaving(false);
    }
  };

  const handleSetNormalMatchWinner = async (matchIdx) => {
    const match = localBracket.rounds[activeRoundIdx].matches[matchIdx];

    if (
      match.score1 === null ||
      match.score2 === null ||
      match.score1 === "" ||
      match.score2 === ""
    ) {
      toast.error("أدخل النتيجة أولاً");
      return;
    }

    let winner = "";
    if (match.isRelay) {
      const t1 = parseFloat(match.score1);
      const t2 = parseFloat(match.score2);
      if (t1 === t2) {
        toast.error("لا يمكن تعادل الأوقات في التتابع");
        return;
      }
      winner = t1 < t2 ? match.p1 : match.p2;
    } else {
      if (Number(match.score1) === Number(match.score2)) {
        toast.error("يجب وجود فائز في أدوار خروج المغلوب");
        return;
      }
      winner =
        Number(match.score1) > Number(match.score2) ? match.p1 : match.p2;
    }

    setSaving(true);
    try {
      const updated = JSON.parse(JSON.stringify(localBracket));
      updated.rounds[activeRoundIdx].matches[matchIdx].winner = winner;
      propagateWinners(updated.rounds);
      await save(updated);
      setLocalBracket(updated);
      toast.success(`الفائز المصعد: ${winner}`);
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const currentRound = localBracket?.rounds?.[activeRoundIdx];
  const isRelayGroupRound = !!currentRound?.matches?.[0]?.players;

  return {
    localBracket,
    saving,
    activeRoundIdx,
    setActiveRoundIdx,
    currentRound,
    isRelayGroupRound,
    handleRelayPlayerScoreChange,
    handleNormalScoreChange,
    handleSetChurchWinner,
    handleSetNormalMatchWinner,
  };
}
