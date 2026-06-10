import React, { useState, useMemo, useEffect } from "react";
import usePlayerSave from "../hooks/usePlayerSave";
import Card from "../components/Card";
import Loader from "../components/Loader";
import ReviewModal from "../components/ReviewModal";
import useFetch from "../hooks/useFetch";
import {
  validateBirthdate,
  validateNameUnique,
  validateQuadName,
} from "../utils/validatePlayer";

export default function Team({ data, onUpdateSelection }) {
  const { loading, saveTeam } = usePlayerSave(data, onUpdateSelection);

  const [teamName, setTeamName] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [players, setPlayers] = useState([]);
  const [playerErrors, setPlayerErrors] = useState([]);
  const [checkingNames, setCheckingNames] = useState([]);
  const [nationalIdValids, setNationalIdValids] = useState([]);

  // ── حالة مودال المراجعة ─────────────────────────────────────
  const [showReview, setShowReview] = useState(false);

  const [loadingFetch, errorFetch, playersData] = useFetch();

  const teamsArr = useMemo(
    () => [...new Set(playersData.map((t) => t.team).filter(Boolean))],
    [playersData],
  );

  const parsedCount = parseInt(playerCount, 10);
  const countIsValid = !isNaN(parsedCount) && parsedCount >= 2 && parsedCount <= 12;

  useEffect(() => {
    setPlayers([]);
    setPlayerErrors([]);
    setCheckingNames([]);
    setNationalIdValids([]);
  }, [playerCount]);

  const handleGeneratePlayers = () => {
    const newPlayers = Array.from({ length: parsedCount }, () => ({
      name: "",
      phone: "",
      birthdate: "",
      nationalId: "",
    }));
    setPlayers(newPlayers);
    setPlayerErrors(Array(parsedCount).fill({ birthdate: null, name: null }));
    setCheckingNames(Array(parsedCount).fill(false));
    setNationalIdValids(Array(parsedCount).fill(false));
  };

  const handlePlayerChange = (index, field, value) => {
    setPlayers((prev) =>
      prev.map((player, i) => i === index ? { ...player, [field]: value } : player),
    );

    if (field === "birthdate" && data?.stage?.name) {
      const error = validateBirthdate(value, data.stage.name);
      setPlayerErrors((prev) =>
        prev.map((e, i) => (i === index ? { ...e, birthdate: error } : e)),
      );
    }

    if (field === "name") {
      const quadError = validateQuadName(value);
      if (quadError) {
        setPlayerErrors((prev) =>
          prev.map((e, i) => (i === index ? { ...e, name: quadError } : e)),
        );
        setCheckingNames((prev) => prev.map((c, i) => (i === index ? false : c)));
        return;
      }
      setCheckingNames((prev) => prev.map((c, i) => (i === index ? true : c)));
      clearTimeout(window[`nameTimer_${index}`]);
      window[`nameTimer_${index}`] = setTimeout(async () => {
        const error = await validateNameUnique(value, data);
        setPlayerErrors((prev) =>
          prev.map((e, i) => (i === index ? { ...e, name: error } : e)),
        );
        setCheckingNames((prev) => prev.map((c, i) => (i === index ? false : c)));
      }, 600);
    }
  };

  const handleNationalIdChange = (index, val) => {
    setPlayers((prev) =>
      prev.map((player, i) => i === index ? { ...player, nationalId: val } : player),
    );
  };

  const handleNationalIdValidation = (index, isValid) => {
    setNationalIdValids((prev) => prev.map((v, i) => (i === index ? isValid : v)));
  };

  const hasAnyError =
    playerErrors.some((e) => e?.birthdate || e?.name) ||
    checkingNames.some(Boolean);

  const allNationalIdsValid =
    nationalIdValids.length > 0 && nationalIdValids.every(Boolean);

  const isTeamValid =
    teamName.trim() &&
    !teamsArr.includes(teamName.trim()) &&
    players.length >= 2 &&
    players.every((p) => p.name?.trim() && p.phone?.trim() && p.birthdate) &&
    allNationalIdsValid &&
    !hasAnyError &&
    !loading;

  // ── فتح المراجعة ────────────────────────────────────────────
  const handleOpenReview = async () => {
    const finalErrors = await Promise.all(
      players.map(async (p) => {
        const quadErr = validateQuadName(p.name);
        if (quadErr) {
          return {
            birthdate: validateBirthdate(p.birthdate, data?.stage?.name),
            name: quadErr,
          };
        }
        return {
          birthdate: validateBirthdate(p.birthdate, data?.stage?.name),
          name: await validateNameUnique(p.name, data),
        };
      }),
    );
    setPlayerErrors(finalErrors);
    if (finalErrors.some((e) => e.birthdate || e.name)) return;
    setShowReview(true);
  };

  // ── تأكيد الحفظ الفعلي ──────────────────────────────────────
  const handleConfirmSave = async () => {
    await saveTeam(players, teamName.trim());
    setShowReview(false);
    setTeamName("");
    setPlayers([]);
    setPlayerCount("");
    setPlayerErrors([]);
    setCheckingNames([]);
    setNationalIdValids([]);
  };

  return (
    <>
      {/* مودال المراجعة */}
      {showReview && (
        <ReviewModal
          selectionData={data}
          players={players}
          teamName={teamName}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowReview(false)}
          loading={loading}
        />
      )}

      <div className="max-w-4xl mx-auto" dir="rtl" aria-label="استمارة تسجيل فريق">
        <div className="bg-white border-2 border-blue-700 rounded-3xl overflow-hidden shadow-sm">
          {/* رأس النموذج */}
          <div className="bg-blue-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-base">بيانات الفريق</h3>
                <p className="text-blue-200 text-xs">استمارة تسجيل جماعي</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid gap-5">
            {/* اسم الفريق */}
            <div>
              <label htmlFor="teamName" className="block mb-2 text-blue-700 font-semibold text-sm">
                اسم الفريق
              </label>
              {loadingFetch ?
                <div className="mb-2"><Loader size={4} /></div>
              : errorFetch ?
                <p role="alert" className="mb-2 text-red-500 text-sm">{errorFetch}</p>
              : teamsArr.length > 0 && (
                  <p className="mb-2 text-sm text-orange-500 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 font-medium">
                    الفرق المسجلة:{" "}
                    <span className="font-black text-orange-700">{teamsArr.join("، ")}</span>{" "}
                    — اختر اسماً مختلفاً
                  </p>
                )
              }
              <input
                id="teamName"
                type="text"
                placeholder="لعبة مرحلة كنيسة نوع مثال (شطرنج خامسة الإنبابيشوى بنين أ)"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full border border-blue-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition"
              />
              {teamsArr.includes(teamName.trim()) && teamName.trim() && (
                <p role="alert" className="mt-2 text-red-600 text-xs flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  هذا الاسم مستخدم بالفعل، اختر اسماً آخر
                </p>
              )}
            </div>

            {/* عدد اللاعبين */}
            <div>
              <label htmlFor="playerCount" className="block mb-2 text-blue-700 font-semibold text-sm">
                عدد اللاعبين بالفريق{" "}
                <span className="font-normal text-slate-400">(من 2 إلى 12)</span>
              </label>
              <input
                id="playerCount"
                type="number"
                min="2"
                max="12"
                placeholder="أدخل عدد اللاعبين"
                value={playerCount}
                onChange={(e) => setPlayerCount(e.target.value)}
                className="w-full border border-blue-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition"
              />
              {playerCount && !countIsValid && (
                <p role="alert" className="mt-2 text-red-600 text-xs flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  العدد يجب أن يكون بين 2 و12
                </p>
              )}
            </div>

            {/* زر تسجيل اللاعبين */}
            <button
              type="button"
              onClick={handleGeneratePlayers}
              disabled={!teamName.trim() || !countIsValid || teamsArr.includes(teamName.trim())}
              className={`flex items-center justify-center py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                (!teamName.trim() || !countIsValid || teamsArr.includes(teamName.trim())) ?
                  "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-700 text-white hover:bg-blue-800 shadow-sm"
              }`}>
              تسجيل اللاعبين
            </button>

            {/* نماذج اللاعبين */}
            {players.length > 0 && (
              <div className="grid gap-6">
                {players.map((player, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <h3 className="text-blue-700 font-bold text-sm">اللاعب {index + 1}</h3>
                    </div>
                    <Card
                      formData={player}
                      handleInputChange={(e) =>
                        handlePlayerChange(index, e.target.name, e.target.value)
                      }
                      handleNationalIdChange={(val) => handleNationalIdChange(index, val)}
                      onNationalIdValidation={(isValid) => handleNationalIdValidation(index, isValid)}
                      nameError={playerErrors[index]?.name}
                      checkingName={checkingNames[index]}
                    />
                    {playerErrors[index]?.birthdate && (
                      <div
                        role="alert"
                        className="mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{playerErrors[index].birthdate}</span>
                      </div>
                    )}
                    {index < players.length - 1 && (
                      <hr className="mt-6 border-t-2 border-dashed border-blue-100" />
                    )}
                  </div>
                ))}

                {/* زر المراجعة والحفظ */}
                <button
                  type="button"
                  onClick={handleOpenReview}
                  disabled={!isTeamValid}
                  aria-disabled={!isTeamValid}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                    !isTeamValid ?
                      "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-blue-700 text-white hover:bg-blue-800 shadow-sm hover:shadow-md"
                  }`}>
                  {loading ?
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جارٍ الحفظ...
                    </>
                  : <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      مراجعة وحفظ الفريق
                    </>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
