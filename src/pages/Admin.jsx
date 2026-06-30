import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useAdminBracket from "../hooks/useAdminBracket";
import SelectBox from "../components/SelectBox";
import Loader from "../components/Loader";
import RoundTabs from "../components/admin/RoundTabs";
import ChampionCard from "../components/admin/ChampionCard";
import RelayChurchCard from "../components/admin/RelayChurchCard";
import NormalMatchCard from "../components/admin/NormalMatchCard";

// ─── المكون الرئيسي ────────────────────────────────────────────────

export default function Admin() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [loadingFetch, errorFetch, rawPlayers] = useFetch();

  const [selectedGame, setSelectedGame] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedForm, setSelectedForm] = useState("");

  const playersList = useMemo(() => rawPlayers || [], [rawPlayers]);

  // ── بناء مفتاح القرعة ────────────────────────────────────────
  const bracketKey =
    selectedGame && selectedStage && selectedGender && selectedForm ?
      `${selectedGame}__${selectedGender}__${selectedForm}__${selectedStage}`
    : null;

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

  // ── كل منطق وحالة القرعة ─────────────────────────────────────

  const {
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
  } = useAdminBracket(bracketKey, filteredPlayers, isTeam);

  // ─────────────────────────────────────────────────────────────────
  // العرض
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen max-w-7xl mx-auto" dir="rtl">
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
                {filteredPlayers.length < 1 && (
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    لا يوجد لاعبون في هذه المجموعة
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
                disabled={filteredPlayers.length < 1 || saving}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                           font-semibold text-sm transition-all duration-200 ${
                             saving || filteredPlayers.length < 1 ?
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
            <RoundTabs
              rounds={localBracket.rounds}
              activeRoundIdx={activeRoundIdx}
              onSelect={setActiveRoundIdx}
            />

            {/* ── مباريات الدور الحالي ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {currentRound?.matches.map((match, matchIdx) => {
                if (match.isChampion) {
                  return <ChampionCard key={match.id} match={match} />;
                }

                if (isRelayGroupRound) {
                  return (
                    <RelayChurchCard
                      key={match.id}
                      match={match}
                      matchIdx={matchIdx}
                      saving={saving}
                      onScoreChange={handleRelayPlayerScoreChange}
                      onConfirm={handleSetChurchWinner}
                    />
                  );
                }

                return (
                  <NormalMatchCard
                    key={match.id}
                    match={match}
                    matchIdx={matchIdx}
                    saving={saving}
                    onScoreChange={handleNormalScoreChange}
                    onConfirm={handleSetNormalMatchWinner}
                  />
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
