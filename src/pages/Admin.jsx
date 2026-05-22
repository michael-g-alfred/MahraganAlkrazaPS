/**
 * Admin.jsx
 * ─────────────────────────────────────────────────────────────────
 * لوحة تحكم الأدمن لإدارة قرعة المسابقات.
 *
 * الوظائف الرئيسية:
 * 1. اختيار اللعبة / المرحلة / النوع / الاستمارة لتحديد المجموعة المطلوبة.
 * 2. إنشاء هيكل القرعة (bracket) باستخدام generateBracket.
 * 3. إدخال نتائج المباريات وتحديد الفائز في كل دور.
 * 4. حفظ الهيكل في Firebase Realtime Database عبر useBracket.
 *
 * أنواع المباريات المدعومة:
 * - مباراة عادية (بنود/جماعي) — الفائز بالنقاط الأعلى.
 * - سباق التتابع (جري) — المرحلة الأولى تصفيات كنائس، ثم خروج المغلوب بالوقت الأقل.
 * ─────────────────────────────────────────────────────────────────
 */

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

// ─── المكون الرئيسي ────────────────────────────────────────────────

export default function Admin() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // جلب جميع اللاعبين من Firebase
  const [loadingFetch, errorFetch, rawPlayers] = useFetch();

  // حالات الفلاتر الأربعة لتحديد المجموعة المطلوبة
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedForm, setSelectedForm] = useState("");

  // حالة عملية الحفظ (لمنع التكرار)
  const [saving, setSaving] = useState(false);

  // الدور النشط المعروض حاليًا في لوحة القرعة
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);

  /** قائمة اللاعبين كمصفوفة (useFetch يرجع null أحيانًا) */
  const playersList = useMemo(() => rawPlayers || [], [rawPlayers]);

  // ── بناء مفتاح القرعة (bracketKey) ────────────────────────────
  /**
   * مفتاح فريد يحدد القرعة المطلوبة.
   * يكون null إذا لم تكتمل الفلاتر الأربعة.
   */
  const bracketKey =
    selectedGame && selectedStage && selectedGender && selectedForm ?
      `${selectedGame}__${selectedGender}__${selectedForm}__${selectedStage}`
    : null;

  /**
   * نسخة آمنة من المفتاح — تُستبدَل فيها المسافات والرموز الخاصة
   * التي لا تقبلها Firebase كمسارات.
   */
  const safeBracketKey =
    bracketKey ?
      bracketKey.replace(/\s+/g, "_").replace(/[./[\]#$]/g, "_")
    : null;

  // جلب وحفظ بيانات القرعة من/إلى Firebase
  const {
    bracket,
    loading: bracketLoading,
    saveBracket,
  } = useBracket(bracketKey);

  /**
   * نسخة محلية من القرعة تتيح التعديل الفوري في الواجهة
   * قبل الحفظ في Firebase (Optimistic UI).
   */
  const [localBracket, setLocalBracket] = useState(null);

  // ── إعادة تهيئة عند تغيير المجموعة المختارة ────────────────────

  /** عند تغيير bracketKey، امسح القرعة المحلية وارجع للدور الأول */
  useEffect(() => {
    setLocalBracket(null);
    setActiveRoundIdx(0);
  }, [bracketKey]);

  /** عند جلب قرعة جديدة من Firebase، اصنع نسخة محلية قابلة للتعديل */
  useEffect(() => {
    if (bracket) setLocalBracket(JSON.parse(JSON.stringify(bracket)));
  }, [bracket]);

  // ── حساب الخيارات المتاحة في القوائم المنسدلة ─────────────────

  /** الألعاب المتاحة من بيانات اللاعبين */
  const games = useMemo(
    () => [...new Set(playersList.map((p) => p.game).filter(Boolean))],
    [playersList],
  );

  /** المراحل المتاحة للعبة المختارة */
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

  /** الأنواع (بنين/بنات) المتاحة للعبة والمرحلة المختارتين */
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

  /** أنواع الاستمارات (فردي/جماعي) المتاحة للفلاتر المختارة */
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

  /** اللاعبون المطابقون لجميع الفلاتر الأربعة */
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

  /** هل الاستمارة جماعية؟ (يؤثر على طريقة بناء القرعة) */
  const isTeam = selectedForm === "جماعى";

  // ── دوال إنشاء القرعة ─────────────────────────────────────────

  /**
   * ينشئ هيكل القرعة المبدئي ويحفظه في Firebase.
   * يتطلب وجود لاعبين اثنين على الأقل.
   */
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

  /**
   * يمسح القرعة الحالية من Firebase وينشئ هيكلًا جديدًا.
   * يطلب تأكيدًا من المستخدم قبل المسح.
   */
  const handleResetBracket = async () => {
    if (
      !window.confirm("سيتم مسح البيانات الحالية وإعادة التهيئة، هل أنت متأكد؟")
    )
      return;
    setSaving(true);
    try {
      // حذف القرعة من Firebase أولًا
      await fetch(`${BASE_URL}/brackets/${safeBracketKey}.json`, {
        method: "DELETE",
      });
      // إنشاء هيكل جديد وحفظه
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

  /**
   * يُحدِّث توقيت لاعب واحد في مباراة تصفيات الكنائس (جري تتابع — دور 1).
   *
   * @param {number} matchIdx  - رقم المباراة في الدور الحالي
   * @param {number} playerIdx - رقم اللاعب داخل المباراة
   * @param {string} value     - التوقيت الجديد (ثوانٍ عشرية)
   */
  const handleRelayPlayerScoreChange = (matchIdx, playerIdx, value) => {
    setLocalBracket((prev) => {
      // Deep clone لتجنب تغيير الحالة مباشرة
      const updated = JSON.parse(JSON.stringify(prev));
      updated.rounds[activeRoundIdx].matches[matchIdx].players[
        playerIdx
      ].score = value;
      return updated;
    });
  };

  /**
   * يُحدِّث نتيجة مباراة عادية (نقطة واحدة لكل فريق/لاعب).
   *
   * @param {number} matchIdx - رقم المباراة في الدور الحالي
   * @param {string} field    - "score1" أو "score2"
   * @param {string} value    - القيمة الجديدة (أو "" للمسح)
   */
  const handleNormalScoreChange = (matchIdx, field, value) => {
    setLocalBracket((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      // قيمة فارغة تُحوَّل لـ null (لا تُعالَج كصفر)
      updated.rounds[activeRoundIdx].matches[matchIdx][field] =
        value === "" ? null : value;
      return updated;
    });
  };

  /**
   * يُحدِّد الفائز في تصفيات كنيسة (جري تتابع — دور 1).
   * الفائز هو اللاعب صاحب أقل توقيت.
   * يُحدِّث القرعة ويُصعِّد الفائز للدور التالي تلقائيًا.
   *
   * @param {number} matchIdx - رقم المباراة في الدور الحالي
   */
  const handleSetChurchWinner = async (matchIdx) => {
    const group = localBracket.rounds[activeRoundIdx].matches[matchIdx];

    // التحقق من إدخال توقيتات صحيحة لجميع اللاعبين
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

    // إيجاد اللاعب صاحب أقل توقيت (الأسرع)
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
      // تسجيل الفائز بصيغة "اسم اللاعب (اسم الكنيسة)"
      updated.rounds[activeRoundIdx].matches[matchIdx].winner =
        `${bestPlayer.name} (${group.churchName})`;
      // تصعيد الفائزين للدور التالي
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

  /**
   * يُحدِّد الفائز في مباراة عادية (نقاط) أو سباق (وقت).
   * - للنقاط: الأعلى نقاطًا يفوز.
   * - للتتابع: الأقل وقتًا يفوز.
   * - لا يُقبل التعادل في كلا الحالتين.
   *
   * @param {number} matchIdx - رقم المباراة في الدور الحالي
   */
  const handleSetNormalMatchWinner = async (matchIdx) => {
    const match = localBracket.rounds[activeRoundIdx].matches[matchIdx];

    // التحقق من إدخال النتيجتين
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
      // سباق تتابع — الأقل وقتًا يفوز
      const t1 = parseFloat(match.score1);
      const t2 = parseFloat(match.score2);
      if (t1 === t2) {
        toast.error("لا يمكن تعادل الأوقات في التتابع");
        return;
      }
      winner = t1 < t2 ? match.p1 : match.p2;
    } else {
      // مباراة عادية — الأعلى نقاطًا يفوز
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
      // تصعيد الفائزين تلقائيًا للدور التالي
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

  // ── متغيرات مشتقة للواجهة ────────────────────────────────────

  /** بيانات الدور الحالي المعروض */
  const currentRound = localBracket?.rounds?.[activeRoundIdx];

  /**
   * هل الدور الحالي هو الدور الأول من سباق التتابع؟
   * يتميز بوجود مصفوفة players داخل المباريات (تصفيات الكنائس).
   */
  const isFirstRoundRelay =
    activeRoundIdx === 0 && localBracket?.rounds?.[0]?.matches?.[0]?.players;

  /** إجمالي عدد الأدوار */
  const totalRounds = localBracket?.rounds?.length ?? 0;

  /** عدد الأدوار المكتملة (جميع مبارياتها لها فائز) */
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
        <div className="flex items-center gap-2.5">
          {/* أيقونة البرق */}
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
          <h1 className="text-base font-bold">لوحة الأدمن</h1>
        </div>

        {/* زر تسجيل الخروج */}
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex items-center text-xs px-3.5 py-1.5 rounded-full font-semibold bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white cursor-pointer">
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
              {/* فلتر اللعبة — إعادة تعيين بقية الفلاتر عند التغيير */}
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
              {/* فلتر المرحلة */}
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
              {/* فلتر النوع */}
              <SelectBox
                label="النوع"
                value={selectedGender}
                onChange={(e) => {
                  setSelectedGender(e.target.value);
                  setSelectedForm("");
                }}
                options={genders}
              />
              {/* فلتر الاستمارة */}
              <SelectBox
                label="الإستمارة"
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                options={forms}
              />
            </div>

            {/* معلومات المجموعة المختارة */}
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
            {/* زر إنشاء القرعة — يظهر فقط إذا لم تكن هناك قرعة حالية */}
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
                {/* أيقونة الإنشاء */}
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

            {/* زر إعادة التهيئة — يظهر فقط إذا كانت هناك قرعة حالية */}
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

        {/* مؤشر التحميل أثناء جلب بيانات القرعة */}
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
              {/* شريط التقدم المرئي */}
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
                    {/* علامة الإكمال للأدوار المنتهية */}
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
                      <div
                        className="w-16 h-16 bg-amber-100 border-2 border-amber-300 rounded-full
                                      flex items-center justify-center mx-auto mb-3">
                        {/* كأس البطولة */}
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

                // ── كارت تصفيات كنيسة (دور 1 جري تتابع) ──
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
                      {/* اسم الكنيسة */}
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-blue-700"></div>
                        <p className="text-sm font-bold text-slate-700">
                          {match.churchName}
                        </p>
                      </div>

                      {/* قائمة اللاعبين مع إدخال التوقيت */}
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

                      {/* زر تصعيد الأسرع أو نتيجة التصفية */}
                      {!hasChurchWinner ?
                        <button
                          onClick={() => handleSetChurchWinner(matchIdx)}
                          disabled={saving}
                          className="mt-3 w-full py-2.5 bg-blue-700 text-white rounded-xl
                                     text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                          تصعيد أسرع لاعب ↑
                        </button>
                      : <div
                          className="mt-3 py-2.5 px-4 bg-emerald-100 border border-emerald-200
                                        rounded-xl flex items-center gap-2">
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
                const isBye = match.isBye; // تأهل تلقائي بدون منافس
                const waiting = !match.p1 || !match.p2; // في انتظار فائزين من دور سابق

                return (
                  <div
                    key={match.id}
                    className={`bg-white rounded-2xl border shadow-sm transition-all ${
                      isBye ? "border-slate-100 opacity-70"
                      : hasWinner ? "border-emerald-300"
                      : "border-slate-200"
                    }`}>
                    <div className="p-4">
                      {/* اللاعب الأول */}
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

                      {/* فاصل VS */}
                      <div className="flex items-center gap-3 py-2">
                        <div className="flex-1 h-px bg-slate-100"></div>
                        <span className="text-xs font-bold text-slate-300 tracking-widest">
                          VS
                        </span>
                        <div className="flex-1 h-px bg-slate-100"></div>
                      </div>

                      {/* اللاعب الثاني */}
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

                    {/* ── حالات نتيجة المباراة ── */}
                    <div className="px-4 pb-4">
                      {/* زر تأكيد الفائز */}
                      {!hasWinner && !isBye && !waiting && (
                        <button
                          onClick={() => handleSetNormalMatchWinner(matchIdx)}
                          disabled={saving}
                          className="w-full py-2.5 bg-blue-700 text-white rounded-xl
                                     text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                          تأكيد الفائز ✓
                        </button>
                      )}

                      {/* الفائز المعلَن */}
                      {hasWinner && !isBye && (
                        <div
                          className="py-2 px-4 bg-emerald-100 border border-emerald-200
                                        rounded-xl flex items-center gap-2">
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

                      {/* تأهل تلقائي */}
                      {isBye && (
                        <div
                          className="py-2 px-4 bg-blue-50 border border-blue-200 rounded-xl
                                        text-sm text-blue-700 font-semibold text-center">
                          تأهل تلقائي
                        </div>
                      )}

                      {/* انتظار فائزين */}
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

        {/* ═══ حالة عدم وجود قرعة بعد ══════════════════════════════ */}
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

// ─── مكونات مساعدة للمباريات ────────────────────────────────────────

/**
 * صف إدخال توقيت لاعب واحد في تصفيات الكنائس.
 * يُستخدم فقط في الدور الأول من جري التتابع.
 *
 * @param {string}   name     - اسم اللاعب
 * @param {string}   score    - التوقيت الحالي (ثوانٍ عشرية)
 * @param {boolean}  disabled - هل الإدخال معطَّل؟ (بعد تحديد الفائز)
 * @param {Function} onChange - دالة تُستدعى بالقيمة الجديدة
 */
function TimeRow({ name, score, onChange, disabled }) {
  // نخفي القيمة الافتراضية "00:00:00" ونعرض فراغًا بدلها
  const displayValue = score === "00:00:00" || !score ? "" : score;

  return (
    <div className="flex items-center gap-3 py-2.5">
      {/* اسم اللاعب */}
      <span className="flex-1 text-sm text-slate-700 break-words min-w-0 leading-tight">
        {name}
      </span>

      {/* حقل إدخال التوقيت بالثواني العشرية */}
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
        {/* وحدة القياس: ثانية */}
        <span className="text-xs text-slate-400 font-medium">ث</span>
      </div>
    </div>
  );
}

/**
 * صف لاعب واحد في مباراة عادية.
 * يعرض اسم اللاعب وحقل إدخال النتيجة.
 * يُميِّز الفائز بخلفية خضراء.
 *
 * @param {string}   name      - اسم اللاعب أو الفريق
 * @param {*}        score     - النتيجة الحالية (أرقام أو ثوانٍ)
 * @param {boolean}  isWinner  - هل هذا هو الفائز؟
 * @param {boolean}  disabled  - هل الإدخال معطَّل؟
 * @param {boolean}  isRelay   - هل المباراة سباق تتابع (وقت)؟
 * @param {Function} onChange  - دالة تُستدعى بالقيمة الجديدة
 */
function NormalPlayerRow({
  name,
  score,
  isWinner,
  onChange,
  disabled,
  isRelay,
}) {
  // إخفاء الوقت الافتراضي في سباق التتابع
  const displayValue =
    isRelay && (score === "00:00:00" || !score) ? "" : (score ?? "");

  // اقتطاع "اسم الكنيسة" من الصيغة "اسم اللاعب (اسم الكنيسة)"
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
      {/* أيقونة الفائز */}
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

      {/* اسم اللاعب */}
      <span
        className={`flex-1 text-sm break-words min-w-0 leading-tight ${
          name && name !== "BYE" ? "text-slate-800" : "text-slate-300 italic"
        } ${isWinner ? "font-semibold text-emerald-900" : ""}`}>
        {displayName}
      </span>

      {/* حقل إدخال النتيجة */}
      {
        isRelay ?
          // سباق تتابع — إدخال بالثواني العشرية
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
          // مباراة عادية — إدخال بالنقاط
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
