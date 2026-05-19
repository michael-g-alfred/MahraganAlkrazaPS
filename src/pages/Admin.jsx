import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useBracket from "../hooks/useBracket";
import SelectBox from "../components/SelectBox";
import Loader from "../components/Loader";
import generateBracket, {
  propagateWinners,
  timeToMs,
} from "../utils/generateBracket";
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
  }, [bracketKey]);

  useEffect(() => {
    if (bracket) {
      setLocalBracket(JSON.parse(JSON.stringify(bracket)));
    }
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
      toast.success("تم إنشاء الهيكل المبدئي بنجاح");
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleResetBracket = async () => {
    if (
      !window.confirm(
        "سيتم مسح البيانات الحالية وإعادة التهيئة من جديد، هل أنت متأكد؟",
      )
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
      updated.rounds[0].matches[matchIdx].players[playerIdx].score = value;
      return updated;
    });
  };

  const handleSetChurchWinner = async (matchIdx) => {
    const group = localBracket.rounds[0].matches[matchIdx];

    const hasInvalidTime = group.players.some(
      (p) =>
        p.score === undefined ||
        p.score === null ||
        p.score === "" ||
        Number(p.score) <= 0,
    );
    if (hasInvalidTime) {
      toast.error("برجاء إدخال توقيتات صحيحة أكبر من الصفر لكل اللاعبين أولاً");
      return;
    }

    let bestPlayer = group.players[0];
    let minMs = timeToMs(bestPlayer.score);

    for (let i = 1; i < group.players.length; i++) {
      const ms = timeToMs(group.players[i].score);
      if (ms < minMs) {
        minMs = ms;
        bestPlayer = group.players[i];
      }
    }

    setSaving(true);
    try {
      const updated = JSON.parse(JSON.stringify(localBracket));
      updated.rounds[0].matches[matchIdx].winner =
        `${bestPlayer.name} (${group.churchName})`;

      propagateWinners(updated.rounds);
      await saveBracket(updated);
      setLocalBracket(updated);
      toast.success(`صعد الأسرع: ${bestPlayer.name}`);
    } catch {
      toast.error("فشل حفظ التصفية الداعمة");
    } finally {
      setSaving(false);
    }
  };

  const handleNormalScoreChange = (roundIdx, matchIdx, field, value) => {
    setLocalBracket((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated.rounds[roundIdx].matches[matchIdx][field] =
        value === "" ? null : value;
      return updated;
    });
  };

  const handleSetNormalMatchWinner = async (roundIdx, matchIdx) => {
    const match = localBracket.rounds[roundIdx].matches[matchIdx];
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
      const time1 = timeToMs(match.score1);
      const time2 = timeToMs(match.score2);
      if (time1 === time2) {
        toast.error("لا يمكن تعادل الأوقات في التتابع — يجب حسم الفائز!");
        return;
      }
      winner = time1 < time2 ? match.p1 : match.p2;
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
      updated.rounds[roundIdx].matches[matchIdx].winner = winner;

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

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans" dir="rtl">
      <div className="flex justify-between items-center mb-8 bg-blue-700 text-white p-5 rounded-b-3xl shadow-lg px-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <h1 className="text-xl font-black tracking-wide">لوحة الأدمن</h1>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="backdrop-blur-sm border-2 border-white/20 px-5 py-2 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 text-sm">
          خروج
        </button>
      </div>

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto px-4">
        {loadingFetch ?
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        : errorFetch ?
          <p className="text-red-500 text-center font-medium">{errorFetch}</p>
        : <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 justify-center mb-8">
            <SelectBox
              label="اختر اللعبة"
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
              label="اختر المرحلة"
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setSelectedGender("");
                setSelectedForm("");
              }}
              options={stages}
            />
            <SelectBox
              label="اختر النوع"
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setSelectedForm("");
              }}
              options={genders}
            />
            <SelectBox
              label="اختر الإستمارة"
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              options={forms}
            />
          </div>
        }

        {bracketKey && !bracketLoading && (
          <div className="flex justify-center mb-8">
            {!localBracket && (
              <button
                onClick={handleGenerateBracket}
                disabled={saving || filteredPlayers.length < 2}
                className={`px-8 py-3.5 rounded-xl font-extrabold text-white shadow-md transition-all ${saving || filteredPlayers.length < 2 ? "bg-slate-300 cursor-not-allowed shadow-none" : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-100"}`}>
                إنشاء الهيكل المبدئي
              </button>
            )}
            {localBracket && (
              <button
                onClick={handleResetBracket}
                disabled={saving}
                className="px-8 py-3.5 rounded-xl font-extrabold text-white bg-red-600 hover:bg-red-700 shadow-md hover:shadow-red-100 transition-all">
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
          <div className="overflow-x-auto pb-8 mask-gradient">
            <div className="flex gap-8 min-w-max px-4 items-start">
              {localBracket.rounds.map((round, roundIdx) => {
                const isFirstRoundRelay =
                  roundIdx === 0 && localBracket.rounds[0].matches[0]?.players;

                return (
                  <div
                    key={roundIdx}
                    className="flex flex-col gap-4 bg-slate-200/40 p-4 rounded-2xl border-2 border-slate-300/50"
                    style={{ width: isFirstRoundRelay ? 340 : 280 }}>
                    <div className="text-center bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-extrabold shadow-sm tracking-wide">
                      {round.roundName}
                    </div>

                    <div className="flex flex-col gap-5">
                      {round.matches.map((match, matchIdx) => {
                        if (match.isChampion) {
                          return (
                            <div
                              key={match.id}
                              className="border-2 border-amber-400 rounded-2xl p-6 bg-gradient-to-b from-amber-50 to-yellow-100/50 text-center transform scale-102">
                              <div className="text-amber-600 text-2xl mb-2">
                                🏆 بطل المسابقة 🏆
                              </div>
                              <div className="text-slate-900 font-black text-lg break-words">
                                {match.p1}
                              </div>
                            </div>
                          );
                        }

                        if (isFirstRoundRelay) {
                          const hasChurchWinner = !!match.winner;
                          return (
                            <div
                              key={match.id}
                              className={`border rounded-2xl p-4 bg-white ${hasChurchWinner ? "border-emerald-500 bg-emerald-50/20" : "border-slate-200"}`}>
                              <div className="text-xs font-black text-blue-950 mb-3 border-b border-slate-100 pb-2 text-center bg-blue-100/70 rounded-lg py-1">
                                {match.churchName}
                              </div>
                              <div className="flex flex-col gap-2.5">
                                {match.players.map((player, pIdx) => (
                                  <TimeRow
                                    key={pIdx}
                                    name={player.name}
                                    score={player.score}
                                    disabled={hasChurchWinner}
                                    onChange={(newTime) =>
                                      handleRelayPlayerScoreChange(
                                        matchIdx,
                                        pIdx,
                                        newTime,
                                      )
                                    }
                                  />
                                ))}
                              </div>

                              {!hasChurchWinner && (
                                <button
                                  onClick={() =>
                                    handleSetChurchWinner(matchIdx)
                                  }
                                  className="mt-4 w-full text-xs py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm">
                                  تصعيد أسرع لاعب بالكنيسة
                                </button>
                              )}
                              {hasChurchWinner && (
                                <div className="mt-3 text-center text-emerald-700 font-black text-xs bg-emerald-100/80 rounded-xl py-2 border border-emerald-200">
                                  🎉 المتأهل: {match.winner.split(" (")[0]}
                                </div>
                              )}
                            </div>
                          );
                        }

                        const hasWinner = !!match.winner;
                        const isBye = match.isBye;
                        const waiting = !match.p1 || !match.p2;

                        return (
                          <div
                            key={match.id}
                            className={`border rounded-2xl p-4 bg-white ${
                              isBye ?
                                "border-slate-200 bg-slate-50/50 opacity-75"
                              : hasWinner ? "border-emerald-500 bg-emerald-50/5"
                              : "border-slate-200"
                            }`}>
                            <NormalPlayerRow
                              name={match.p1}
                              score={match.score1}
                              isWinner={match.winner === match.p1 && !isBye}
                              onChange={(val) =>
                                handleNormalScoreChange(
                                  roundIdx,
                                  matchIdx,
                                  "score1",
                                  val,
                                )
                              }
                              disabled={isBye || hasWinner || waiting}
                              isRelay={match.isRelay}
                            />
                            <div className="relative text-center text-slate-400 text-[10px] my-2 font-black tracking-widest before:content-[''] before:absolute before:top-1/2 before:right-0 before:w-5 before:h-[1px] before:bg-slate-100 after:content-[''] after:absolute after:top-1/2 after:left-0 after:w-5 after:h-[1px] after:bg-slate-100">
                              VS
                            </div>
                            <NormalPlayerRow
                              name={match.p2}
                              score={match.score2}
                              isWinner={match.winner === match.p2 && !isBye}
                              onChange={(val) =>
                                handleNormalScoreChange(
                                  roundIdx,
                                  matchIdx,
                                  "score2",
                                  val,
                                )
                              }
                              disabled={isBye || hasWinner || waiting}
                              isRelay={match.isRelay}
                            />

                            {!hasWinner && !isBye && !waiting && (
                              <button
                                onClick={() =>
                                  handleSetNormalMatchWinner(roundIdx, matchIdx)
                                }
                                className="mt-4 w-full text-xs py-2.5 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition shadow-sm">
                                تأكيد الفائز ✓
                              </button>
                            )}
                            {hasWinner && !isBye && (
                              <div className="mt-3 text-center text-emerald-700 font-black text-xs bg-emerald-100/80 rounded-xl py-2 border border-emerald-200">
                                🏆 الفائز: {match.winner}
                              </div>
                            )}
                            {isBye && (
                              /* الخلفية والإطارات هنا لـ blue-50 */
                              <div className="mt-3 text-center text-blue-700 text-xs bg-blue-50 rounded-xl py-2 font-bold border border-blue-100">
                                تأهل تلقائي 🚀
                              </div>
                            )}
                            {!hasWinner && !isBye && waiting && (
                              <div className="mt-3 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl py-2">
                                في انتظار الفائزين...
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TimeRow({ name, score, onChange, disabled }) {
  const displayValue = score === "00:00:00" || !score ? "" : score;

  return (
    <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100/80">
      <span className="text-xs font-bold text-slate-700 break-words max-w-[160px]">
        {name}
      </span>
      <div className="flex items-center gap-1" style={{ direction: "ltr" }}>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={displayValue}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-center border border-slate-200 rounded-lg p-1 text-xs font-black bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-slate-400 font-bold">ث</span>
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

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 transition-all ${isWinner ? "bg-emerald-100/70 border border-emerald-300" : "bg-slate-50/80 border border-transparent"}`}>
      <span
        className={`text-xs font-bold break-words leading-tight max-w-[140px] ${name && name !== "BYE" ? "text-blue-950" : "text-slate-300 italic"}`}>
        {name ?
          name.includes(" (") ?
            name.split(" (")[0]
          : name
        : "—"}
      </span>

      {isRelay ?
        <div className="flex items-center gap-1" style={{ direction: "ltr" }}>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={displayValue}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-18 text-center border border-slate-200 rounded-lg p-1 text-xs font-black bg-white focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
          />
          <span className="text-[9px] text-slate-400 font-bold">ث</span>
        </div>
      : <input
          type="number"
          min="0"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-14 text-center border border-slate-200 rounded-lg p-1 text-xs font-black bg-white focus:border-blue-500 outline-none font-mono"
          placeholder="0"
        />
      }
    </div>
  );
}
