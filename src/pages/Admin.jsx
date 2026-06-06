import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useBracket from "../hooks/useBracket";
import SelectBox from "../components/SelectBox";
import Loader from "../components/Loader";
import generateBracket, { propagateWinners } from "../utils/generateBracket";
import toast from "react-hot-toast";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

// ─── المكون الرئيسي ────────────────────────────────────────────────

export default function Admin() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [loadingFetch, errorFetch, rawPlayers] = useFetch();

  const [selectedGame, setSelectedGame] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedForm, setSelectedForm] = useState("");

  const [saving, setSaving] = useState(false);
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);

  const playersList = useMemo(() => rawPlayers || [], [rawPlayers]);

  // ── بناء مفتاح القرعة ────────────────────────────────────────
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

  // ── إعادة تهيئة عند تغيير المجموعة ──────────────────────────

  useEffect(() => {
    setLocalBracket(null);
    setActiveRoundIdx(0);
  }, [bracketKey]);

  useEffect(() => {
    if (bracket) setLocalBracket(JSON.parse(JSON.stringify(bracket)));
  }, [bracket]);

  // ── خيارات القوائم المنسدلة ──────────────────────────────────

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

  // ── دوال إنشاء القرعة ─────────────────────────────────────────

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
      // حذف القرعة من Firestore
      await deleteDoc(doc(db, "brackets", safeBracketKey));
      // إنشاء هيكل جديد
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

  // ── دوال إدخال النتائج ────────────────────────────────────────

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
  const isFirstRoundRelay =
    activeRoundIdx === 0 && localBracket?.rounds?.[0]?.matches?.[0]?.players;
  const totalRounds = localBracket?.rounds?.length ?? 0;
  const completedRounds =
    localBracket?.rounds?.filter((r) => r.matches.every((m) => m.winner))
      .length ?? 0;

  // ─────────────────────────────────────────────────────────────────
  // العرض
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen max-w-4xl mx-auto" dir="rtl">
      {/* ═══ رأس الصفحة ══════════════════════════════════════════ */}
      <div className="flex justify-between items-center bg-blue-700 text-white px-5 py-3.5 rounded-2xl shadow-md mb-5">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-blue-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
            <h1 className="text-base font-bold leading-none">لوحة الأدمن</h1>
            <span className="text-xs text-white font-mono bg-blue-900 px-2.5 py-0.5 rounded-full border border-blue-600/30">
              {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex items-center text-xs px-3.5 py-1.5 rounded-full font-semibold bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white cursor-pointer flex-shrink-0">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          خروج
        </button>
      </div>

      <div className="px-1">
        {/* ═══ قسم الفلاتر ══════════════════════════════════════ */}
        {loadingFetch ?
          <div className="flex justify-center py-10">
            <Loader />
          </div>
        : errorFetch ?
          <p className="text-red-500 text-center font-medium">{errorFetch}</p>
        : <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">
              تحديد المجموعة
            </p>
            <div className="flex flex-wrap gap-2">
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

            {bracketKey && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  عدد اللاعبين:{" "}
                  <span className="font-bold text-blue-700">
                    {filteredPlayers.length}
                  </span>
                </p>
                {filteredPlayers.length < 2 && (
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    يجب 2 لاعبين على الأقل
                  </span>
                )}
              </div>
            )}
          </div>
        }

        {/* ═══ أزرار إنشاء / مسح القرعة ══════════════════════════ */}
        {bracketKey && !bracketLoading && (
          <div className="flex gap-2.5 mb-4">
            {!localBracket && (
              <button
                onClick={handleGenerateBracket}
                disabled={saving || filteredPlayers.length < 2}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                           font-semibold text-sm transition-all duration-200 ${
                             saving || filteredPlayers.length < 2 ?
                               "bg-slate-100 text-slate-400 cursor-not-allowed"
                             : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                           }`}>
                {!saving && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                )}
                {saving ? "جارٍ الإنشاء..." : "إنشاء هيكل القرعة"}
              </button>
            )}

            {localBracket && (
              <button
                onClick={handleResetBracket}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                           font-semibold text-sm bg-red-600 text-white hover:bg-red-700
                           transition-all duration-200 shadow-sm disabled:opacity-50">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                مسح وإعادة التهيئة
              </button>
            )}
          </div>
        )}

        {/* مؤشر التحميل */}
        {bracketLoading && (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        )}

        {/* ═══ لوحة القرعة الرئيسية ═══════════════════════════════ */}
        {!bracketLoading && localBracket && (
          <>
            {/* ── شريط التقدم ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600">
                  تقدم المسابقة
                </p>
                <span className="text-xs font-bold text-blue-700">
                  {completedRounds} / {totalRounds} دور
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-700 rounded-full transition-all duration-500"
                  style={{
                    width:
                      totalRounds ?
                        `${(completedRounds / totalRounds) * 100}%`
                      : "0%",
                  }}
                  role="progressbar"
                  aria-valuenow={completedRounds}
                  aria-valuemax={totalRounds}
                />
              </div>
            </div>

            {/* ── تبويبات الأدوار ── */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-none">
              {localBracket.rounds.map((round, idx) => {
                const isDone = round.matches.every((m) => m.winner);
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveRoundIdx(idx)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full
                               text-xs font-semibold transition-all duration-200 border ${
                                 activeRoundIdx === idx ?
                                   "bg-blue-700 text-white border-blue-700 shadow-sm"
                                 : isDone ?
                                   "bg-emerald-50 text-emerald-700 border-emerald-200"
                                 : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                               }`}>
                    {isDone && activeRoundIdx !== idx && (
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {round.roundName}
                  </button>
                );
              })}
            </div>

            {/* ── عنوان الدور الحالي ── */}
            <div className="bg-blue-700 text-white text-center text-sm font-bold py-2.5 px-4 rounded-xl mb-3">
              {currentRound?.roundName}
            </div>

            {/* ── مباريات الدور الحالي ── */}
            <div className="flex flex-col gap-3 pb-8">
              {currentRound?.matches.map((match, matchIdx) => {
                // ── كارت البطل النهائي ──
                if (match.isChampion) {
                  return (
                    <div
                      key={match.id}
                      className="border-2 border-amber-300 rounded-2xl p-6 bg-amber-50 text-center shadow-sm">
                      <div className="w-16 h-16 bg-amber-100 border-2 border-amber-300 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-8 h-8 text-amber-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 21h8M12 17v4M12 17c-3.314 0-6-2.686-6-6V4h12v7c0 3.314-2.686 6-6 6zM4 7H2M20 7h2"
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-amber-600 mb-1 uppercase tracking-wide">
                        بطل المسابقة
                      </p>
                      <p className="text-lg font-bold text-amber-900 break-words">
                        {match.p1}
                      </p>
                    </div>
                  );
                }

                // ── كارت تصفيات كنيسة ──
                if (isFirstRoundRelay) {
                  const hasChurchWinner = !!match.winner;
                  return (
                    <div
                      key={match.id}
                      className={`bg-white rounded-2xl p-4 border shadow-sm transition-all ${
                        hasChurchWinner ?
                          "border-emerald-300 bg-emerald-50/30"
                        : "border-slate-200"
                      }`}>
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-blue-700"></div>
                        <p className="text-sm font-bold text-slate-700">
                          {match.churchName}
                        </p>
                      </div>

                      <div className="flex flex-col divide-y divide-slate-100">
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

                      {!hasChurchWinner ?
                        <button
                          onClick={() => handleSetChurchWinner(matchIdx)}
                          disabled={saving}
                          className="mt-3 w-full py-2.5 bg-blue-700 text-white rounded-xl
                                     text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                          تصعيد أسرع لاعب ↑
                        </button>
                      : <div className="mt-3 py-2.5 px-4 bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-emerald-600 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <p className="text-sm font-semibold text-emerald-800">
                            المتأهل: {match.winner.split(" (")[0]}
                          </p>
                        </div>
                      }
                    </div>
                  );
                }

                // ── كارت مباراة عادية ──
                const hasWinner = !!match.winner;
                const isBye = match.isBye;
                const waiting = !match.p1 || !match.p2;

                return (
                  <div
                    key={match.id}
                    className={`bg-white rounded-2xl border shadow-sm transition-all ${
                      isBye ? "border-slate-100 opacity-70"
                      : hasWinner ? "border-emerald-300"
                      : "border-slate-200"
                    }`}>
                    <div className="p-4">
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

                      <div className="flex items-center gap-3 py-2">
                        <div className="flex-1 h-px bg-slate-100"></div>
                        <span className="text-xs font-bold text-slate-300 tracking-widest">
                          VS
                        </span>
                        <div className="flex-1 h-px bg-slate-100"></div>
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
                    </div>

                    <div className="px-4 pb-4">
                      {!hasWinner && !isBye && !waiting && (
                        <button
                          onClick={() => handleSetNormalMatchWinner(matchIdx)}
                          disabled={saving}
                          className="w-full py-2.5 bg-blue-700 text-white rounded-xl
                                     text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                          تأكيد الفائز ✓
                        </button>
                      )}

                      {hasWinner && !isBye && (
                        <div className="py-2 px-4 bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-emerald-600 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <p className="text-sm font-semibold text-emerald-800 truncate">
                            {match.winner}
                          </p>
                        </div>
                      )}

                      {isBye && (
                        <div className="py-2 px-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-semibold text-center">
                          تأهل تلقائي
                        </div>
                      )}

                      {!hasWinner && !isBye && waiting && (
                        <div className="py-2 text-center text-xs text-slate-400 italic">
                          في انتظار نتائج الدور السابق...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ حالة عدم وجود قرعة ═══════════════════════════════ */}
        {!bracketLoading && bracketKey && !localBracket && !saving && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="font-semibold text-slate-600">
              لم يتم إنشاء الهيكل بعد
            </p>
            <p className="text-sm text-slate-400">
              عدد اللاعبين المتاحين:{" "}
              <span className="font-bold text-blue-700">
                {filteredPlayers.length}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── مكونات مساعدة ────────────────────────────────────────────────

function TimeRow({ name, score, onChange, disabled }) {
  const displayValue = score === "00:00:00" || !score ? "" : score;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex-1 text-sm text-slate-700 break-words min-w-0 leading-tight">
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
          className="w-20 text-center border border-slate-200 rounded-lg py-1.5 px-2 text-sm
                     font-mono bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                     outline-none transition disabled:bg-slate-50 disabled:text-slate-400
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-slate-400 font-medium">ث</span>
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
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        isWinner ?
          "bg-emerald-100 border border-emerald-200"
        : "bg-slate-50 border border-transparent"
      }`}>
      {isWinner && (
        <svg
          className="w-4 h-4 text-emerald-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}

      <span
        className={`flex-1 text-sm break-words min-w-0 leading-tight ${
          name && name !== "BYE" ? "text-slate-800" : "text-slate-300 italic"
        } ${isWinner ? "font-semibold text-emerald-900" : ""}`}>
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
            className="w-20 text-center border border-slate-200 rounded-lg py-1.5 px-2 text-sm
                     font-mono bg-white focus:border-blue-500 outline-none
                     disabled:bg-slate-50 disabled:text-slate-400
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-slate-400">ث</span>
        </div>
      : <input
          type="number"
          min="0"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-16 text-center border border-slate-200 rounded-lg py-1.5 px-2
                   text-sm font-mono bg-white focus:border-blue-500 outline-none
                   disabled:bg-slate-50 disabled:text-slate-400 flex-shrink-0"
          placeholder="0"
        />
      }
    </div>
  );
}
