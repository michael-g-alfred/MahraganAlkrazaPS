import React, { useState, useEffect } from "react";
import usePlayerSave from "../hooks/usePlayerSave";
import Card from "../components/Card";
import ReviewModal from "../components/ReviewModal";
import {
  validateBirthdate,
  validateNameUnique,
  validateQuadName,
} from "../utils/validatePlayer";

export default function MultipleSingle({ data, onUpdateSelection, onBack }) {
  const { loading, savePlayer } = usePlayerSave(data, onUpdateSelection);

  const [playerCount, setPlayerCount] = useState("");
  const [players, setPlayers] = useState([]);
  const [playerErrors, setPlayerErrors] = useState([]);
  const [checkingNames, setCheckingNames] = useState([]);
  const [nationalIdValids, setNationalIdValids] = useState([]);

  // مودال المراجعة
  const [showReview, setShowReview] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(null); // null = كل اللاعبين، رقم = لاعب واحد

  const parsedCount = parseInt(playerCount, 10);
  const countIsValid = !isNaN(parsedCount) && parsedCount >= 2 && parsedCount <= 20;

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
      prev.map((player, i) => (i === index ? { ...player, [field]: value } : player)),
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
      clearTimeout(window[`multiSingleNameTimer_${index}`]);
      window[`multiSingleNameTimer_${index}`] = setTimeout(async () => {
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
      prev.map((player, i) => (i === index ? { ...player, nationalId: val } : player)),
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

  const isAllValid =
    players.length >= 2 &&
    players.every((p) => p.name?.trim() && p.phone?.trim() && p.birthdate) &&
    allNationalIdsValid &&
    !hasAnyError &&
    !loading;

  // حساب عدد اللاعبين الكاملين
  const completedCount = players.filter(
    (p, i) =>
      p.name?.trim() &&
      p.phone?.trim() &&
      p.birthdate &&
      nationalIdValids[i] &&
      !playerErrors[i]?.birthdate &&
      !playerErrors[i]?.name &&
      !checkingNames[i],
  ).length;

  // فتح مراجعة كل اللاعبين
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
    setReviewIndex(null);
    setShowReview(true);
  };

  // حفظ كل اللاعبين
  const handleConfirmSaveAll = async () => {
    for (const p of players) {
      await savePlayer({
        name: p.name,
        phone: p.phone,
        birthdate: p.birthdate,
        nationalId: p.nationalId,
      });
    }
    setShowReview(false);
    setPlayers([]);
    setPlayerCount("");
    setPlayerErrors([]);
    setCheckingNames([]);
    setNationalIdValids([]);
  };

  return (
    <>
      {/* مودال المراجعة */}
      {showReview && reviewIndex === null && (
        <MultiReviewModal
          selectionData={data}
          players={players}
          onConfirm={handleConfirmSaveAll}
          onCancel={() => setShowReview(false)}
          loading={loading}
        />
      )}

      <div className="max-w-4xl mx-auto" dir="rtl">
        <div className="bg-white border-2 border-blue-700 rounded-3xl overflow-hidden shadow-sm">
          {/* رأس النموذج */}
          <div className="bg-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">تسجيل عدة لاعبين فرديين</h3>
                  <p className="text-blue-200 text-xs">كل لاعب يُسجَّل بشكل مستقل</p>
                </div>
              </div>
              {/* زرار الرجوع */}
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                رجوع
              </button>
            </div>
          </div>

          <div className="p-6 grid gap-5">
            {/* عدد اللاعبين */}
            <div>
              <label htmlFor="multiPlayerCount" className="block mb-2 text-blue-700 font-semibold text-sm">
                عدد اللاعبين{" "}
                <span className="font-normal text-slate-400">(من 2 إلى 20)</span>
              </label>
              <input
                id="multiPlayerCount"
                type="number"
                min="2"
                max="20"
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
                  العدد يجب أن يكون بين 2 و20
                </p>
              )}
            </div>

            {/* زر إنشاء الاستمارات */}
            <button
              type="button"
              onClick={handleGeneratePlayers}
              disabled={!countIsValid}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                !countIsValid
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-700 text-white hover:bg-blue-800 shadow-sm"
              }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              إنشاء الاستمارات
            </button>

            {/* شريط التقدم */}
            {players.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">اكتمال البيانات</span>
                  <span className="text-xs font-bold text-blue-700">
                    {completedCount} / {players.length}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-700 rounded-full transition-all duration-500"
                    style={{ width: players.length ? `${(completedCount / players.length) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            )}

            {/* نماذج اللاعبين */}
            {players.length > 0 && (
              <div className="grid gap-6">
                {players.map((player, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                          nationalIdValids[index] &&
                          player.name?.trim() &&
                          player.phone?.trim() &&
                          player.birthdate &&
                          !playerErrors[index]?.birthdate &&
                          !playerErrors[index]?.name &&
                          !checkingNames[index]
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-700 text-white"
                        }`}>
                        {nationalIdValids[index] &&
                        player.name?.trim() &&
                        player.phone?.trim() &&
                        player.birthdate &&
                        !playerErrors[index]?.birthdate &&
                        !playerErrors[index]?.name &&
                        !checkingNames[index] ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <h3 className="text-blue-700 font-bold text-sm">اللاعب {index + 1}</h3>
                    </div>

                    <Card
                      formData={player}
                      handleInputChange={(e) =>
                        handlePlayerChange(index, e.target.name, e.target.value)
                      }
                      handleNationalIdChange={(val) => handleNationalIdChange(index, val)}
                      onNationalIdValidation={(isValid) =>
                        handleNationalIdValidation(index, isValid)
                      }
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
                  disabled={!isAllValid}
                  aria-disabled={!isAllValid}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                    !isAllValid
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-blue-700 text-white hover:bg-blue-800 shadow-sm hover:shadow-md"
                  }`}>
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جارٍ الحفظ...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      مراجعة وتسجيل {players.length} لاعبين
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── مودال مراجعة متعدد اللاعبين ────────────────────────────────────
function PlayerReviewCard({ player, index }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1d4ed8", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          {index + 1}
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1e3a8a" }}>{player.name}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: 12 }}>
        <div style={{ color: "#475569" }}>
          <span style={{ color: "#94a3b8" }}>رقم قومى: </span>
          <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{player.nationalId || "—"}</span>
        </div>
        <div style={{ color: "#475569" }}>
          <span style={{ color: "#94a3b8" }}>تليفون: </span>
          <span style={{ fontFamily: "monospace" }}>{player.phone || "—"}</span>
        </div>
        <div style={{ color: "#475569" }}>
          <span style={{ color: "#94a3b8" }}>ميلاد: </span>
          <span>{player.birthdate || "—"}</span>
        </div>
      </div>
    </div>
  );
}

function MultiReviewModal({ selectionData, players, onConfirm, onCancel, loading }) {
  const selectionItems = [
    { icon: "ti-user", label: "النوع", value: selectionData?.gender?.name },
    { icon: "ti-trophy", label: "اللعبة", value: selectionData?.game?.name },
    { icon: "ti-calendar", label: "المرحلة", value: selectionData?.stage?.name },
    { icon: "ti-building-church", label: "الكنيسة", value: selectionData?.church?.name },
    { icon: "ti-forms", label: "نوع الاستمارة", value: "فردى (متعدد)" },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-label="مراجعة بيانات التسجيل">
      <div
        dir="rtl"
        style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", border: "2px solid #1d4ed8", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ background: "#1d4ed8", padding: "1rem 1.25rem", borderRadius: "18px 18px 0 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ti ti-clipboard-check" style={{ color: "white", fontSize: 18 }} aria-hidden="true" />
          </div>
          <div>
            <p style={{ color: "white", fontWeight: 700, fontSize: 16, margin: 0 }}>مراجعة قبل التسجيل</p>
            <p style={{ color: "#bfdbfe", fontSize: 12, margin: 0 }}>
              {players.length} لاعب فردي — تأكد من صحة البيانات
            </p>
          </div>
        </div>

        <div style={{ padding: "1.25rem" }}>
          {/* بيانات التسجيل */}
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>بيانات التسجيل</p>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "4px 12px", marginBottom: 20, border: "1px solid #e2e8f0" }}>
            {selectionItems.map(({ icon, label, value }) => (
              <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #e2e8f0" }}>
                <span style={{ minWidth: 28, height: 28, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`ti ${icon}`} style={{ fontSize: 14, color: "#1d4ed8" }} aria-hidden="true" />
                </span>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{value || "—"}</p>
                </div>
              </div>
            ))}
          </div>

          {/* اللاعبين */}
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>
            اللاعبون ({players.length})
          </p>
          <div>
            {players.map((p, i) => (
              <PlayerReviewCard key={i} player={p} index={i} />
            ))}
          </div>

          {/* تنبيه */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#fffbeb", borderRadius: 10, padding: "10px 12px", marginTop: 12, border: "1px solid #fde68a" }}>
            <i className="ti ti-info-circle" style={{ color: "#d97706", fontSize: 16, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
              بعد الضغط على "تأكيد التسجيل" لن تتمكن من التراجع. تأكد من صحة جميع البيانات.
            </p>
          </div>

          {/* أزرار */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={onCancel}
              disabled={loading}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              <i className="ti ti-arrow-right" style={{ fontSize: 14, marginLeft: 4 }} aria-hidden="true" />
              تعديل
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: loading ? "#93c5fd" : "#1d4ed8", color: "white", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  جارٍ التسجيل...
                </>
              ) : (
                <>
                  <i className="ti ti-check" style={{ fontSize: 16 }} aria-hidden="true" />
                  تأكيد تسجيل {players.length} لاعبين
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
