import React, { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useBracket from "../hooks/useBracket";
import SelectBox from "../components/SelectBox";
import Loader from "../components/Loader";
import generateBracket, { propagateWinners } from "../utils/generateBracket";
import toast from "react-hot-toast";

export default function Admin() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [loadingFetch, errorFetch, players] = useFetch();

  const [selectedGame,   setSelectedGame]   = useState("");
  const [selectedStage,  setSelectedStage]  = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedForm,   setSelectedForm]   = useState("");
  const [showBracket,    setShowBracket]     = useState(false);
  const [saving,         setSaving]          = useState(false);

  const bracketKey =
    selectedGame && selectedStage && selectedGender && selectedForm
      ? `${selectedGame}__${selectedGender}__${selectedForm}__${selectedStage}`
      : null;

  const { bracket, loading: bracketLoading, saveBracket } = useBracket(bracketKey);

  // localBracket = النسخة اللي بنشتغل عليها
  const [localBracket, setLocalBracket] = useState(null);

  // لما الـ bracket يجي من Firebase نحدّث localBracket
  // بس مننسيش الـ scores اللي المستخدم كتبها ومش اتحفظت لسه
  const prevKeyRef = useRef(null);
  useEffect(() => {
    // لو اتغير الـ key يعني اتغيرت المسابقة → reset كل حاجة
    if (prevKeyRef.current !== bracketKey) {
      prevKeyRef.current = bracketKey;
      setShowBracket(false);
      setLocalBracket(bracket ? JSON.parse(JSON.stringify(bracket)) : null);
    } else if (bracket && !localBracket) {
      // أول مرة بيجي bracket من Firebase
      setLocalBracket(JSON.parse(JSON.stringify(bracket)));
    }
  }, [bracket, bracketKey]);

  // ── Dropdowns ──
  const games = useMemo(
    () => [...new Set(players.map((p) => p.game).filter(Boolean))],
    [players]
  );
  const stages = useMemo(
    () => [...new Set(players.filter((p) => p.game === selectedGame).map((p) => p.stage).filter(Boolean))],
    [players, selectedGame]
  );
  const genders = useMemo(
    () => [...new Set(players.filter((p) => p.game === selectedGame && p.stage === selectedStage).map((p) => p.gender).filter(Boolean))],
    [players, selectedGame, selectedStage]
  );
  const forms = useMemo(
    () => [...new Set(players.filter((p) => p.game === selectedGame && p.stage === selectedStage && p.gender === selectedGender).map((p) => p.form).filter(Boolean))],
    [players, selectedGame, selectedStage, selectedGender]
  );

  const filteredPlayers = useMemo(
    () => players.filter(
      (p) =>
        p.game   === selectedGame &&
        p.stage  === selectedStage &&
        p.gender === selectedGender &&
        p.form   === selectedForm
    ),
    [players, selectedGame, selectedStage, selectedGender, selectedForm]
  );

  const isTeam = selectedForm === "جماعى";

  // ── إنشاء القرعة (مرة واحدة بس) ──
  const handleGenerateBracket = async () => {
    if (localBracket) {
      toast.error("القرعة اتعملت بالفعل ومش ممكن تتعمل تاني!");
      return;
    }
    if (filteredPlayers.length < 2) {
      toast.error("محتاج على الأقل لاعبين اتنين!");
      return;
    }
    setSaving(true);
    try {
      const newBracket = generateBracket(filteredPlayers, isTeam);
      await saveBracket(newBracket);
      setLocalBracket(newBracket);
      setShowBracket(true);
      toast.success("تم إنشاء القرعة ✅");
    } catch {
      toast.error("فشل الحفظ ❌");
    } finally {
      setSaving(false);
    }
  };

  // ── تغيير النتيجة ──
  const handleScoreChange = (roundIdx, matchIdx, field, value) => {
    setLocalBracket((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated.rounds[roundIdx].matches[matchIdx][field] =
        value === "" ? null : Number(value);
      return updated;
    });
  };

  // ── تأكيد النتيجة وتسجيل الفايز ──
  const handleSetWinner = async (roundIdx, matchIdx) => {
    const match = localBracket.rounds[roundIdx].matches[matchIdx];
    if (match.score1 === null || match.score2 === null) {
      toast.error("أدخل النتيجة الأول");
      return;
    }
    if (match.score1 === match.score2) {
      toast.error("مفيش تعادل في Knockout — لازم فايز");
      return;
    }
    const winner = match.score1 > match.score2 ? match.p1 : match.p2;
    setSaving(true);
    try {
      const updated = JSON.parse(JSON.stringify(localBracket));
      updated.rounds[roundIdx].matches[matchIdx].winner = winner;
      propagateWinners(updated.rounds);
      await saveBracket(updated);
      setLocalBracket(updated);
      toast.success(`الفايز: ${winner} 🏆`);
    } catch {
      toast.error("فشل الحفظ ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-blue-700 text-white p-4 rounded-2xl">
        <h1 className="text-xl font-bold">لوحة الأدمن — القرعة والخريطة</h1>
        <button onClick={handleLogout}
          className="bg-white text-blue-700 px-4 py-2 rounded-xl font-semibold hover:bg-blue-50 transition text-sm">
          خروج
        </button>
      </div>

      {/* Filters */}
      {loadingFetch ? (
        <div className="flex justify-center py-8"><Loader /></div>
      ) : errorFetch ? (
        <p className="text-red-500 text-center">{errorFetch}</p>
      ) : (
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <SelectBox label="اختر اللعبة" value={selectedGame}
            onChange={(e) => { setSelectedGame(e.target.value); setSelectedStage(""); setSelectedGender(""); setSelectedForm(""); }}
            options={games} />
          <SelectBox label="اختر المرحلة" value={selectedStage}
            onChange={(e) => { setSelectedStage(e.target.value); setSelectedGender(""); setSelectedForm(""); }}
            options={stages} />
          <SelectBox label="اختر النوع" value={selectedGender}
            onChange={(e) => { setSelectedGender(e.target.value); setSelectedForm(""); }}
            options={genders} />
          <SelectBox label="اختر الإستمارة" value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            options={forms} />
        </div>
      )}

      {/* Actions */}
      {bracketKey && !bracketLoading && (
        <div className="flex flex-wrap gap-3 justify-center mb-6 items-center">
          {!localBracket && (
            <button
              onClick={handleGenerateBracket}
              disabled={saving || filteredPlayers.length < 2}
              className={`px-6 py-3 rounded-xl font-bold text-white transition ${
                saving || filteredPlayers.length < 2
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800"
              }`}
            >
              {saving ? "جاري الحفظ..." : "🎲 إنشاء القرعة"}
            </button>
          )}

          {localBracket && (
            <>
              <button
                onClick={() => setShowBracket((v) => !v)}
                className="px-6 py-3 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 transition"
              >
                {showBracket ? "🙈 إخفاء الخريطة" : "🏆 إظهار الخريطة"}
              </button>
              <span className="text-green-700 font-semibold text-sm">
                ✅ القرعة محفوظة
              </span>
            </>
          )}
        </div>
      )}

      {bracketLoading && (
        <div className="flex justify-center py-8"><Loader /></div>
      )}

      {/* Bracket */}
      {!bracketLoading && showBracket && localBracket && (
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-6 min-w-max px-2 items-start">
            {localBracket.rounds.map((round, roundIdx) => (
              <div key={roundIdx} className="flex flex-col gap-4" style={{ minWidth: 230 }}>
                <div className="text-center bg-blue-700 text-white rounded-full px-4 py-1 text-sm font-bold">
                  {round.roundName}
                </div>
                <div className="flex flex-col gap-6">
                  {round.matches.map((match, matchIdx) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onScoreChange={(field, val) => handleScoreChange(roundIdx, matchIdx, field, val)}
                      onSetWinner={() => handleSetWinner(roundIdx, matchIdx)}
                      saving={saving}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bracketKey && !bracketLoading && !localBracket && !loadingFetch && filteredPlayers.length === 0 && (
        <p className="text-center text-gray-500 mt-8">لا يوجد لاعبون مسجلون لهذه المسابقة</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
function MatchCard({ match, onScoreChange, onSetWinner, saving }) {
  const hasWinner = !!match.winner;
  const isBye     = match.isBye;
  const waiting   = !match.p1 || !match.p2;

  return (
    <div className={`border-2 rounded-2xl p-3 bg-white shadow-sm ${hasWinner ? "border-green-500" : "border-blue-300"}`}>
      <PlayerRow name={match.p1} score={match.score1} isWinner={match.winner === match.p1}
        onChange={(val) => onScoreChange("score1", val)} disabled={isBye || hasWinner || waiting} />
      <div className="text-center text-gray-400 text-xs my-1 font-bold">VS</div>
      <PlayerRow name={match.p2} score={match.score2} isWinner={match.winner === match.p2}
        onChange={(val) => onScoreChange("score2", val)} disabled={isBye || hasWinner || waiting} />

      {!hasWinner && !isBye && !waiting && (
        <button onClick={onSetWinner}
          disabled={saving || match.score1 === null || match.score2 === null}
          className={`mt-3 w-full text-xs py-2 rounded-lg font-bold transition ${
            saving || match.score1 === null || match.score2 === null
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}>
          تأكيد النتيجة
        </button>
      )}
      {hasWinner && (
        <div className="mt-2 text-center text-green-700 font-bold text-xs bg-green-50 rounded-lg py-1">
          🏆 {match.winner}
        </div>
      )}
      {isBye && (
        <div className="mt-2 text-center text-blue-500 text-xs bg-blue-50 rounded-lg py-1 font-bold">
          تأهل تلقائي ✅
        </div>
      )}
      {!hasWinner && !isBye && waiting && (
        <div className="mt-2 text-center text-gray-400 text-xs">في انتظار الفائزين...</div>
      )}
    </div>
  );
}

function PlayerRow({ name, score, isWinner, onChange, disabled }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-2 py-1 ${isWinner ? "bg-green-100 border border-green-400" : "bg-gray-50"}`}>
      <span className={`flex-1 text-sm truncate font-semibold ${name ? "text-blue-700" : "text-gray-300"}`}>
        {name || "—"}
      </span>
      <input type="number" min="0" value={score ?? ""} onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-14 text-center border rounded-lg p-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 ${
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "border-blue-300"
        }`}
        placeholder="0" />
    </div>
  );
}
