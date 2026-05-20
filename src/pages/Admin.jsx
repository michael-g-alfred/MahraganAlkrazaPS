import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useBracket from "../hooks/useBracket";
import SelectBox from "../components/SelectBox";
import Loader from "../components/Loader";
import generateBracket, { propagateWinners } from "../utils/generateBracket";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_FIREBASE_URL;

export default function Admin() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loadingFetch, errorFetch, rawPlayers] = useFetch();
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedForm, setSelectedForm] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);

  const playersList = useMemo(() => rawPlayers || [], [rawPlayers]);

  const bracketKey =
    selectedGame && selectedStage && selectedGender && selectedForm ?
      `${selectedGame}__${selectedGender}__${selectedForm}__${selectedStage}`
    : null;

  const safeBracketKey =
    bracketKey ?
      bracketKey.replace(/\s+/g, "_").replace(/[./[\]#$]/g, "_")
    : null;

  const {
    bracket,
    loading: bracketLoading,
    saveBracket,
  } = useBracket(bracketKey);
  const [localBracket, setLocalBracket] = useState(null);

  useEffect(() => {
    setLocalBracket(null);
    setActiveRoundIdx(0);
  }, [bracketKey]);

  useEffect(() => {
    if (bracket) setLocalBracket(JSON.parse(JSON.stringify(bracket)));
  }, [bracket]);

  const games = useMemo(
    () => [...new Set(playersList.map((p) => p.game).filter(Boolean))],
    [playersList],
  );
  const stages = useMemo(
    () => [
      ...new Set(
        playersList
          .filter((p) => p.game === selectedGame)
          .map((p) => p.stage)
          .filter(Boolean),
      ),
    ],
    [playersList, selectedGame],
  );
  const genders = useMemo(
    () => [
      ...new Set(
        playersList
          .filter((p) => p.game === selectedGame && p.stage === selectedStage)
          .map((p) => p.gender)
          .filter(Boolean),
      ),
    ],
    [playersList, selectedGame, selectedStage],
  );
  const forms = useMemo(
    () => [
      ...new Set(
        playersList
          .filter(
            (p) =>
              p.game === selectedGame &&
              p.stage === selectedStage &&
              p.gender === selectedGender,
          )
          .map((p) => p.form)
          .filter(Boolean),
      ),
    ],
    [playersList, selectedGame, selectedStage, selectedGender],
  );

  const filteredPlayers = useMemo(
    () =>
      playersList.filter(
        (p) =>
          p.game === selectedGame &&
          p.stage === selectedStage &&
          p.gender === selectedGender &&
          p.form === selectedForm,
      ),
    [playersList, selectedGame, selectedStage, selectedGender, selectedForm],
  );

  const isTeam = selectedForm === "جماعى";

  const handleGenerateBracket = async () => {
    if (filteredPlayers.length < 2) {
      toast.error("محتاج على الأقل لاعبين اثنين!");
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
      await fetch(`${BASE_URL}/brackets/${safeBracketKey}.json`, {
        method: "DELETE",
      });
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

  const handleRelayPlayerScoreChange = (matchIdx, playerIdx, value) => {
    setLocalBracket((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated.rounds[activeRoundIdx].matches[matchIdx].players[
        playerIdx
      ].score = value;
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

    // ✅ parseFloat بدل timeToMs — الأقل وقت يكسب
    let bestPlayer = group.players[0];
    let minTime = parseFloat(bestPlayer.score);
    for (let i = 1; i < group.players.length; i++) {
      const t = parseFloat(group.players[i].score);
      if (t < minTime) {
        minTime = t;
        bestPlayer = group.players[i];
      }
    }

    setSaving(true);
    try {
      const updated = JSON.parse(JSON.stringify(localBracket));
      updated.rounds[activeRoundIdx].matches[matchIdx].winner =
        `${bestPlayer.name} (${group.churchName})`;
      propagateWinners(updated.rounds);
      await saveBracket(updated);
      setLocalBracket(updated);
      toast.success(`صعد الأسرع: ${bestPlayer.name}`);
    } catch {
      toast.error("فشل حفظ التصفية");
    } finally {
      setSaving(false);
    }
  };

  const handleNormalScoreChange = (matchIdx, field, value) => {
    setLocalBracket((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated.rounds[activeRoundIdx].matches[matchIdx][field] =
        value === "" ? null : value;
      return updated;
    });
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
      // ✅ parseFloat بدل timeToMs — الأقل وقت يكسب
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

  const currentRound = localBracket?.rounds?.[activeRoundIdx];
  const isFirstRoundRelay =
    activeRoundIdx === 0 && localBracket?.rounds?.[0]?.matches?.[0]?.players;

  const totalRounds = localBracket?.rounds?.length ?? 0;
  const completedRounds =
    localBracket?.rounds?.filter((r) => r.matches.every((m) => m.winner))
      .length ?? 0;

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center bg-blue-700 text-white px-4 py-3 rounded-b-2xl shadow-md mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <h1 className="text-base font-semibold">لوحة الأدمن</h1>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="text-red-600 bg-red-100 border border-red-700 hover:bg-red-700 hover:text-white text-sm px-4 py-1.5 rounded-full font-medium transition">
          خروج
        </button>
      </div>

      <div className="px-4">
        {/* Filters */}
        {loadingFetch ?
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        : errorFetch ?
          <p className="text-red-500 text-center">{errorFetch}</p>
        : <div className="flex flex-wrap gap-2 mb-4">
            <SelectBox
              label="اللعبة"
              value={selectedGame}
              onChange={(e) => {
                setSelectedGame(e.target.value);
                setSelectedStage("");
                setSelectedGender("");
                setSelectedForm("");
              }}
              options={games}
            />
            <SelectBox
              label="المرحلة"
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setSelectedGender("");
                setSelectedForm("");
              }}
              options={stages}
            />
            <SelectBox
              label="النوع"
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setSelectedForm("");
              }}
              options={genders}
            />
            <SelectBox
              label="الإستمارة"
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              options={forms}
            />
          </div>
        }

        {/* Generate / Reset buttons */}
        {bracketKey && !bracketLoading && (
          <div className="flex gap-2 mb-4">
            {!localBracket && (
              <button
                onClick={handleGenerateBracket}
                disabled={saving || filteredPlayers.length < 2}
                className={`flex-1 py-3 rounded-xl font-semibold text-white text-sm transition ${
                  saving || filteredPlayers.length < 2 ?
                    "bg-slate-300 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
                }`}>
                {saving ? "جارٍ الإنشاء..." : "إنشاء الهيكل المبدئي"}
              </button>
            )}
            {localBracket && (
              <button
                onClick={handleResetBracket}
                disabled={saving}
                className="flex-1 py-3 rounded-xl font-semibold text-white text-sm bg-red-600 hover:bg-red-700 transition">
                مسح وإعادة التهيئة
              </button>
            )}
          </div>
        )}

        {bracketLoading && (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        )}

        {/* Bracket Board */}
        {!bracketLoading && localBracket && (
          <>
            {/* Progress */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-700 rounded-full transition-all"
                  style={{
                    width:
                      totalRounds ?
                        `${(completedRounds / totalRounds) * 100}%`
                      : "0%",
                  }}
                />
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {completedRounds}/{totalRounds}
              </span>
            </div>

            {/* Round tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
              {localBracket.rounds.map((round, idx) => {
                const done = round.matches.every((m) => m.winner);
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveRoundIdx(idx)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition border ${
                      activeRoundIdx === idx ?
                        "bg-blue-700 text-white border-blue-700"
                      : done ?
                        "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-slate-600 border-slate-200"
                    }`}>
                    {done && activeRoundIdx !== idx && "✓ "}
                    {round.roundName}
                  </button>
                );
              })}
            </div>

            {/* Round name header */}
            <div className="bg-blue-700 text-white text-center text-sm font-medium py-2 px-4 rounded-xl mb-3">
              {currentRound?.roundName}
            </div>

            {/* Matches for active round */}
            <div className="flex flex-col gap-3 pb-6 bg-slate-100/70 border-2 border-slate-400/50 p-4 rounded-xl">
              {currentRound?.matches.map((match, matchIdx) => {
                if (match.isChampion) {
                  return (
                    <div
                      key={match.id}
                      className="border-2 border-amber-400 rounded-2xl p-5 bg-amber-50 text-center">
                      <div className="text-3xl mb-2">🏆</div>
                      <p className="text-xs text-amber-700 mb-1">
                        بطل المسابقة
                      </p>
                      <p className="text-lg font-semibold text-amber-900 break-words">
                        {match.p1}
                      </p>
                    </div>
                  );
                }

                if (isFirstRoundRelay) {
                  const hasChurchWinner = !!match.winner;
                  return (
                    <div
                      key={match.id}
                      className={`rounded-2xl p-4 border ${
                        hasChurchWinner ?
                          "border-emerald-400 bg-emerald-50"
                        : "border-slate-200 bg-white"
                      }`}>
                      <p className="text-xs text-slate-500 bg-slate-100 rounded-lg text-center py-1.5 mb-3">
                        {match.churchName}
                      </p>
                      <div className="flex flex-col gap-0 divide-y divide-slate-100">
                        {match.players.map((player, pIdx) => (
                          <TimeRow
                            key={pIdx}
                            name={player.name}
                            score={player.score}
                            disabled={hasChurchWinner}
                            onChange={(val) =>
                              handleRelayPlayerScoreChange(matchIdx, pIdx, val)
                            }
                          />
                        ))}
                      </div>
                      {!hasChurchWinner && (
                        <button
                          onClick={() => handleSetChurchWinner(matchIdx)}
                          disabled={saving}
                          className="mt-3 w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition">
                          تصعيد أسرع لاعب
                        </button>
                      )}
                      {hasChurchWinner && (
                        <div className="mt-3 py-2 px-3 bg-emerald-100 border border-emerald-200 rounded-xl text-center text-sm text-emerald-700 font-medium">
                          🎉 المتأهل: {match.winner.split(" (")[0]}
                        </div>
                      )}
                    </div>
                  );
                }

                // Normal match
                const hasWinner = !!match.winner;
                const isBye = match.isBye;
                const waiting = !match.p1 || !match.p2;

                return (
                  <div
                    key={match.id}
                    className={`rounded-2xl p-4 border bg-white ${
                      isBye ? "border-slate-100 opacity-70"
                      : hasWinner ? "border-emerald-400"
                      : "border-slate-200"
                    }`}>
                    <NormalPlayerRow
                      name={match.p1}
                      score={match.score1}
                      isWinner={match.winner === match.p1 && !isBye}
                      disabled={isBye || hasWinner || waiting}
                      isRelay={match.isRelay}
                      onChange={(val) =>
                        handleNormalScoreChange(matchIdx, "score1", val)
                      }
                    />
                    <div className="text-center text-xs text-slate-400 font-bold tracking-widest py-2">
                      VS
                    </div>
                    <NormalPlayerRow
                      name={match.p2}
                      score={match.score2}
                      isWinner={match.winner === match.p2 && !isBye}
                      disabled={isBye || hasWinner || waiting}
                      isRelay={match.isRelay}
                      onChange={(val) =>
                        handleNormalScoreChange(matchIdx, "score2", val)
                      }
                    />

                    {!hasWinner && !isBye && !waiting && (
                      <button
                        onClick={() => handleSetNormalMatchWinner(matchIdx)}
                        disabled={saving}
                        className="mt-3 w-full py-2.5 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition">
                        تأكيد الفائز ✓
                      </button>
                    )}
                    {hasWinner && !isBye && (
                      <div className="mt-3 py-2 px-3 bg-emerald-100 border border-emerald-200 rounded-xl text-center text-sm text-emerald-700 font-medium">
                        🏆 الفائز: {match.winner}
                      </div>
                    )}
                    {isBye && (
                      <div className="mt-3 py-2 px-3 bg-blue-50 border border-blue-100 rounded-xl text-center text-sm text-blue-700">
                        تأهل تلقائي 🚀
                      </div>
                    )}
                    {!hasWinner && !isBye && waiting && (
                      <div className="mt-3 py-2 text-center text-xs text-slate-400 italic">
                        في انتظار الفائزين...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty — no bracket yet */}
        {!bracketLoading && bracketKey && !localBracket && !saving && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
            <span className="text-5xl">📋</span>
            <p className="text-sm">لم يتم إنشاء الهيكل بعد</p>
            <p className="text-xs">
              عدد اللاعبين المتاحين: {filteredPlayers.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TimeRow({ name, score, onChange, disabled }) {
  const displayValue = score === "00:00:00" || !score ? "" : score;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex-1 text-sm text-slate-700 break-words min-w-0">
        {name}
      </span>
      <div
        className="flex items-center gap-1 flex-shrink-0"
        style={{ direction: "ltr" }}>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={displayValue}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-center border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-mono bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition disabled:bg-slate-50 disabled:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-slate-400">ث</span>
      </div>
    </div>
  );
}

function NormalPlayerRow({
  name,
  score,
  isWinner,
  onChange,
  disabled,
  isRelay,
}) {
  const displayValue =
    isRelay && (score === "00:00:00" || !score) ? "" : (score ?? "");
  const displayName =
    name ?
      name.includes(" (") ?
        name.split(" (")[0]
      : name
    : "—";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
        isWinner ?
          "bg-emerald-100 border border-emerald-300"
        : "bg-slate-50 border border-transparent"
      }`}>
      <span
        className={`flex-1 text-sm break-words min-w-0 leading-tight ${
          name && name !== "BYE" ? "text-blue-950" : "text-slate-300 italic"
        } ${isWinner ? "font-medium" : ""}`}>
        {displayName}
      </span>
      {isRelay ?
        <div
          className="flex items-center gap-1 flex-shrink-0"
          style={{ direction: "ltr" }}>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={displayValue}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 text-center border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-mono bg-white focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-slate-400">ث</span>
        </div>
      : <input
          type="number"
          min="0"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-16 text-center border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-mono bg-white focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 flex-shrink-0"
          placeholder="0"
        />
      }
    </div>
  );
}
