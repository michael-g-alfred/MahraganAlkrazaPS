import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useAdminBracket from "../hooks/useAdminBracket";
import useSiteSettings from "../hooks/useSiteSettings";
import { getPrivileges } from "../utils/permissions";
import deleteCollection from "../utils/deleteCollection";
import SelectBox from "../components/SelectBox";
import Loader from "../components/Loader";
import gamesData from "../data/games";
import stagesData from "../data/stages";

// ─── زرار فتح / غلق الموقع ─────────────────────────────────────────
function SiteToggleCard({ closed, loading, onToggle }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4">
      <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">
        حالة التسجيل
      </p>
      <button
        onClick={onToggle}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
          loading ? "bg-slate-100 text-slate-400 cursor-wait"
          : closed ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          : "bg-orange-600 text-white hover:bg-orange-700 shadow-sm"
        }`}>
        {loading ?
          "جارِ التحديث..."
        : closed ?
          "🔓 فتح الموقع"
        : "🔒 غلق الموقع"}
      </button>
    </div>
  );
}

// ─── زراير مسح الداتا (منفصلة: لاعبين / قرعات) ──────────────────────
function DangerZoneCard() {
  const [deletingPlayers, setDeletingPlayers] = useState(false);
  const [deletingBrackets, setDeletingBrackets] = useState(false);

  const handleDeletePlayers = async () => {
    if (
      !window.confirm("سيتم مسح كل اللاعبين نهائيًا ولا يمكن التراجع. متأكد؟")
    )
      return;
    if (!window.confirm("تأكيد أخير: هل أنت متأكد 100% من مسح كل اللاعبين؟"))
      return;

    setDeletingPlayers(true);
    try {
      const playersCount = await deleteCollection("players");
      toast.success(`تم مسح ${playersCount} لاعب بنجاح`);
    } catch {
      toast.error("فشل مسح اللاعبين");
    } finally {
      setDeletingPlayers(false);
    }
  };

  const handleDeleteBrackets = async () => {
    if (!window.confirm("سيتم مسح كل القرعات نهائيًا ولا يمكن التراجع. متأكد؟"))
      return;
    if (!window.confirm("تأكيد أخير: هل أنت متأكد 100% من مسح كل القرعات؟"))
      return;

    setDeletingBrackets(true);
    try {
      const bracketsCount = await deleteCollection("brackets");
      toast.success(`تم مسح ${bracketsCount} قرعة بنجاح`);
    } catch {
      toast.error("فشل مسح القرعات");
    } finally {
      setDeletingBrackets(false);
    }
  };

  return (
    <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-sm mb-4">
      <p className="text-xs font-semibold text-red-400 mb-3 uppercase tracking-wide">
        منطقة الخطر
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleDeletePlayers}
          disabled={deletingPlayers}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            deletingPlayers ?
              "bg-slate-100 text-slate-400 cursor-wait"
            : "bg-red-600 text-white hover:bg-red-700 shadow-sm"
          }`}>
          {deletingPlayers ? "جارِ المسح..." : "مسح كل اللاعبين"}
        </button>

        <button
          onClick={handleDeleteBrackets}
          disabled={deletingBrackets}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            deletingBrackets ?
              "bg-slate-100 text-slate-400 cursor-wait"
            : "bg-red-600 text-white hover:bg-red-700 shadow-sm"
          }`}>
          {deletingBrackets ? "جارِ المسح..." : "مسح كل القرعات"}
        </button>
      </div>
    </div>
  );
}

// ─── إظهار/إخفاء الألعاب، ولكل لعبة مراحلها الخاصة ──────────────────
function VisibilityCard({ visibility, onGameToggle, onStageToggle }) {
  const [expandedGame, setExpandedGame] = useState(null);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4">
      <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">
        إعدادات التسجيل
      </p>

      <p className="text-xs font-semibold text-slate-500 mb-2">
        الألعاب والمراحل
      </p>

      <div className="flex flex-col gap-2">
        {gamesData.map((g) => {
          const isOpen = expandedGame === g.name;
          const gameStages = visibility.stages[g.name] || {};

          return (
            <div
              key={g.name}
              className="border border-slate-200 rounded-xl overflow-hidden">
              {/* رأس اللعبة: تفعيل/تعطيل اللعبة + فتح قائمة مراحلها */}
              <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibility.games[g.name] !== false}
                    onChange={(e) => onGameToggle(g.name, e.target.checked)}
                  />
                  <span className="font-semibold">{g.name}</span>
                </label>

                <button
                  onClick={() => setExpandedGame(isOpen ? null : g.name)}
                  className="text-xs text-blue-700 font-semibold px-2 py-1 hover:underline">
                  {isOpen ? "إخفاء المراحل ▲" : "تعديل المراحل ▼"}
                </button>
              </div>

              {/* مراحل اللعبة دي بس */}
              {isOpen && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3">
                  {stagesData.map((s) => (
                    <label
                      key={s.name}
                      className="flex items-center gap-2 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gameStages[s.name] !== false}
                        onChange={(e) =>
                          onStageToggle(g.name, s.name, e.target.checked)
                        }
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── المكون الرئيسي ────────────────────────────────────────────────

export default function Admin() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const privileges = getPrivileges(user?.email);

  const {
    closed,
    loading: settingsLoading,
    visibility,
    toggleSiteClosed,
    setGameVisible,
    setStageVisible,
  } = useSiteSettings();

  const [loadingFetch, errorFetch, rawPlayers] = useFetch();

  const [selectedGame, setSelectedGame] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedForm, setSelectedForm] = useState("");

  const playersList = useMemo(() => rawPlayers || [], [rawPlayers]);

  const bracketKey =
    selectedGame && selectedStage && selectedGender && selectedForm ?
      `${selectedGame}__${selectedGender}__${selectedForm}__${selectedStage}`
    : null;

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

  const teamsCount = useMemo(
    () =>
      isTeam ?
        new Set(filteredPlayers.map((p) => p.team).filter(Boolean)).size
      : 0,
    [filteredPlayers, isTeam],
  );

  const {
    localBracket,
    bracketLoading,
    saving,
    handleGenerateBracket,
    handleResetBracket,
  } = useAdminBracket(bracketKey, filteredPlayers, isTeam);

  // ─────────────────────────────────────────────────────────────────
  const Header = (
    <div
      dir="rtl"
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-700 text-white px-4 py-3.5 sm:px-5 rounded-2xl shadow-md mb-5 gap-3 sm:gap-0">
      {/* القسم الأيمن: الشعار والمعلومات */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <svg
          className="w-5 h-5 text-blue-200 flex-shrink-0"
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

        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-base font-bold leading-none">لوحة الأدمن</h1>
          <span
            className="text-xs text-white font-mono bg-blue-900 px-2.5 py-1 rounded-full border border-blue-600/30 truncate max-w-[200px] xs:max-w-[280px] sm:max-w-none"
            title={`${user?.email} — ${privileges.label}`}>
            {user?.email} — {privileges.label}
          </span>
        </div>
      </div>

      {/* القسم الأيسر: زر الخروج */}
      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors duration-200 cursor-pointer flex-shrink-0 mr-auto sm:mr-0">
        <svg
          className="w-3.5 h-3.5 transform rotate-180"
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
        <span>خروج</span>
      </button>
    </div>
  );

  // ─── مفيش صلاحيات إدارية على الإطلاق (محتوى فاضي) ─────────────────
  if (!privileges.canEditDashboard) {
    return (
      <div className="min-h-screen max-w-3xl mx-auto" dir="rtl">
        {Header}
        <div className="flex flex-col items-center gap-3 py-20 text-center text-slate-400">
          <svg
            className="w-12 h-12 text-slate-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM16 7a4 4 0 00-8 0v4h8V7z"
            />
          </svg>
          <p className="font-semibold text-slate-500">
            لا توجد صلاحيات إدارية على هذا الحساب
          </p>
          {privileges.canTogglePaid && (
            <Link
              to="/players"
              className="mt-2 text-sm text-blue-700 font-semibold underline">
              اذهب لصفحة اللاعبين لتسجيل الدفع
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ─── محتوى الأدمن الكامل ────────────────────────────────────────
  return (
    <div className="min-h-screen max-w-7xl mx-auto" dir="rtl">
      {Header}

      <div className="px-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <SiteToggleCard
            closed={closed}
            loading={settingsLoading}
            onToggle={toggleSiteClosed}
          />

          <DangerZoneCard />
        </div>

        <VisibilityCard
          visibility={visibility}
          onGameToggle={setGameVisible}
          onStageToggle={setStageVisible}
        />

        {/* ═══ قسم إنشاء / مسح القرعة ══════════════════════════ */}
        {loadingFetch ?
          <div className="flex justify-center py-10">
            <Loader />
          </div>
        : errorFetch ?
          <p className="text-red-500 text-center font-medium">{errorFetch}</p>
        : <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">
              إنشاء / إعادة تهيئة القرعة
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
                  {isTeam ? "عدد الفرق:" : "عدد اللاعبين:"}{" "}
                  <span className="font-bold text-blue-700">
                    {isTeam ? teamsCount : filteredPlayers.length}
                  </span>
                </p>
                {(isTeam ? teamsCount < 1 : filteredPlayers.length < 1) && (
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {isTeam ?
                      "لا يوجد فرق في هذه المجموعة"
                    : "لا يوجد لاعبون في هذه المجموعة"}
                  </span>
                )}
              </div>
            )}
          </div>
        }

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
                مسح وإعادة التهيئة
              </button>
            )}
          </div>
        )}

        {bracketLoading && (
          <div className="flex justify-center py-10">
            <Loader />
          </div>
        )}
      </div>
    </div>
  );
}
