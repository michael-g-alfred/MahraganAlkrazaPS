import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import useBracket from "./useBracket";
import generateBracket, { propagateWinners } from "../utils/generateBracket";

/**
 * كل منطق التعامل مع القرعة: التحميل، الحفظ، إدخال النتائج،
 * تحديد فائز كل مباراة/كنيسة، وتحديد البطل النهائي.
 *
 * @param {string|null} bracketKey - مفتاح القرعة الحالية (لعبة+مرحلة+نوع+استمارة)
 * @param {Array} filteredPlayers - اللاعبين المتاحين للمجموعة الحالية
 * @param {boolean} isTeam - هل المجموعة فرق ولا أفراد
 */
export default function useAdminBracket(bracketKey, filteredPlayers, isTeam) {
  const safeBracketKey =
    bracketKey ?
      bracketKey.replace(/\s+/g, "_").replace(/[./[\]#$]/g, "_")
    : null;

  const { bracket, loading: bracketLoading, saveBracket } = useBracket(
    bracketKey,
  );

  const [localBracket, setLocalBracket] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);

  // ── إعادة تهيئة عند تغيير المجموعة ──────────────────────────
  useEffect(() => {
    setLocalBracket(null);
    setActiveRoundIdx(0);
  }, [bracketKey]);

  useEffect(() => {
    if (bracket) setLocalBracket(JSON.parse(JSON.stringify(bracket)));
  }, [bracket]);

  // ── إنشاء / مسح القرعة ─────────────────────────────────────

  const handleGenerateBracket = async () => {
    if (filteredPlayers.length < 1) {
      toast.error("محتاج على الأقل لاعب واحد!");
      return;
    }
    setSaving(true);
    try {
      const newBracket = generateBracket(filteredPlayers, isTeam);
      await saveBracket(newBracket);
      setLocalBracket(newBracket);
      setActiveRoundIdx(0);
      toast.success("تم إنشاء الهيكل المبدئي بنجاح");
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleResetBracket = async () => {
    if (
      !window.confirm("سيتم مسح البيانات الحالية وإعادة التهيئة، هل أنت متأكد؟")
    )
      return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "brackets", safeBracketKey));
      const newBracket = generateBracket(filteredPlayers, isTeam);
      await saveBracket(newBracket);
      setLocalBracket(newBracket);
      setActiveRoundIdx(0);
      toast.success("تمت إعادة الهيكلة");
    } catch {
      toast.error("فشل المسح");
    } finally {
      setSaving(false);
    }
  };

  // ── إدخال النتائج ────────────────────────────────────────────

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

  // ── تأكيد نتيجة كنيسة (جري) ─────────────────────────────────

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

      await saveBracket(updated);
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

  // ── تأكيد فائز مباراة عادية ─────────────────────────────────

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
      await saveBracket(updated);
      setLocalBracket(updated);
      toast.success(`الفائز المصعد: ${winner}`);
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  // ── متغيرات مشتقة ────────────────────────────────────────────

  const currentRound = localBracket?.rounds?.[activeRoundIdx];
  const isRelayGroupRound = !!currentRound?.matches?.[0]?.players;

  return {
    localBracket,
    bracketLoading,
    saving,
    activeRoundIdx,
    setActiveRoundIdx,
    currentRound,
    isRelayGroupRound,
    handleGenerateBracket,
    handleResetBracket,
    handleRelayPlayerScoreChange,
    handleNormalScoreChange,
    handleSetChurchWinner,
    handleSetNormalMatchWinner,
  };
}
