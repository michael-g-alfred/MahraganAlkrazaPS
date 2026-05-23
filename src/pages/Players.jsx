/**
 * Players.jsx
 * ─────────────────────────────────────────────────────────────────
 * صفحة عرض اللاعبين المسجلين مع إمكانية الفلترة، الحذف، وتصدير Excel.
 * - تستخدم useFetch لجلب البيانات من Firestore.
 * - تستخدم XLSX من SheetJS لتصدير البيانات.
 * - يحق للمستخدم المُصرَّح له فقط (ALLOWED_ACTION) الحذف والتصدير.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import useFetch from "../hooks/useFetch";
import SelectBox from "../components/SelectBox";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/AuthContext";
import { doc, deleteDoc, writeBatch, getDocs, collection } from "firebase/firestore";
import { db } from "../utils/firebase";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

// ─── ثوابت ────────────────────────────────────────────────────────
/** البريد الإلكتروني الوحيد المسموح له بالحذف والتصدير */
const ALLOWED_ACTION = "michoolgeorge@gmail.com";
/** عدد العناصر في كل صفحة */
const ITEMS_PER_PAGE = 20;

// ─── مساعدات الأفاتار ──────────────────────────────────────────────

function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "؟";
  return parts[0][0];
}

const AVATAR_COLORS = [
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#dcfce7", text: "#166534" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#fef9c3", text: "#854d0e" },
  { bg: "#ede9fe", text: "#5b21b6" },
  { bg: "#ffedd5", text: "#9a3412" },
];

function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── مكونات الشارات ──────────────────────────────────────────────

function GenderBadge({ gender }) {
  if (gender === "بنين")
    return (
      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-medium whitespace-nowrap">
        بنين
      </span>
    );
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
      style={{ background: "#fce7f3", color: "#9d174d" }}>
      بنات
    </span>
  );
}

function FormBadge({ form }) {
  if (form === "جماعى")
    return (
      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium whitespace-nowrap">
        جماعى
      </span>
    );
  return (
    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-medium whitespace-nowrap">
      فردى
    </span>
  );
}

// ─── مكون كارت اللاعب ─────────────────────────────────────────────

function PlayerCard({ player, index, canAction, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const color = avatarColor(player.name);
  const initials = getInitials(player.name);

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
        expanded ? "border-blue-300 shadow-sm border-2" : "border-slate-200"
      }`}>
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`تفاصيل ${player.name}`}>
        <span className="text-xs text-slate-400 w-6 text-center flex-shrink-0 font-mono font-bold">
          {index + 1}
        </span>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
          style={{ background: color.bg, color: color.text }}
          aria-hidden="true">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
            {player.name}
          </p>
          <p
            className="text-sm font-bold font-mono text-rose-700 truncate mt-0.5"
            dir="rtl">
            {player.nationalId || "—"}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <GenderBadge gender={player.gender} />
          <FormBadge form={player.form} />
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 pb-4 pt-3">
          <div className="flex sm:hidden items-center gap-2 mb-3">
            <GenderBadge gender={player.gender} />
            <FormBadge form={player.form} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <DetailItem label="المرحلة">{player.stage || "—"}</DetailItem>
            <DetailItem label="تاريخ الميلاد">{player.birthdate || "—"}</DetailItem>
            <DetailItem label="اللعبة">{player.game || "—"}</DetailItem>
            <DetailItem label="التليفون">
              <span className="font-mono">{player.phone || "—"}</span>
            </DetailItem>
            <DetailItem label="الكنيسة" className="col-span-2">
              {player.church || "—"}
            </DetailItem>
            {player.team && (
              <DetailItem label="الفريق">
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 rounded-full px-2.5 py-0.5 font-medium">
                  {player.team}
                </span>
              </DetailItem>
            )}
          </div>

          {canAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(player);
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                         text-red-600 bg-red-50 border border-red-200 text-xs font-semibold
                         hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200"
              aria-label={`حذف اللاعب ${player.name}`}>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              حذف اللاعب
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-blue-700 mb-0.5 text-sm font-medium">{label}</p>
      <div className="text-slate-700 font-black text-xs">{children}</div>
    </div>
  );
}

// ─── المكون الرئيسي ────────────────────────────────────────────────

export default function Players() {
  const { user } = useAuth();
  const canAction = user?.email?.toLowerCase() === ALLOWED_ACTION;

  const [loadingFetch, errorFetch, players] = useFetch();
  const [localPlayers, setLocalPlayers] = useState([]);
  const [deletingAll, setDeletingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState({
    gender: "",
    game: "",
    form: "",
    stage: "",
    church: "",
    team: "",
  });

  useEffect(() => {
    setLocalPlayers(players);
  }, [players]);

  const isFiltered = Object.values(filter).some(Boolean);

  const handleFilterChange = (key, value) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilter({ gender: "", game: "", form: "", stage: "", church: "", team: "" });
    setCurrentPage(1);
  };

  // ── حساب البيانات المعروضة ────────────────────────────────────

  const filteredPlayers = useMemo(
    () =>
      localPlayers.filter((p) => {
        if (filter.gender && p.gender !== filter.gender) return false;
        if (filter.game && p.game !== filter.game) return false;
        if (filter.stage && p.stage !== filter.stage) return false;
        if (filter.church && p.church !== filter.church) return false;
        if (filter.form && p.form !== filter.form) return false;
        if (filter.team && p.team !== filter.team) return false;
        return true;
      }),
    [localPlayers, filter],
  );

  const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);

  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  // ── خيارات الفلاتر ────────────────────────────────────────────

  const genders = useMemo(
    () => [...new Set(localPlayers.map((p) => p.gender).filter(Boolean))],
    [localPlayers],
  );
  const games = useMemo(
    () => [...new Set(localPlayers.map((p) => p.game).filter(Boolean))],
    [localPlayers],
  );
  const stages = useMemo(
    () => [...new Set(localPlayers.map((p) => p.stage).filter(Boolean))],
    [localPlayers],
  );
  const churches = useMemo(
    () => [...new Set(localPlayers.map((p) => p.church).filter(Boolean))],
    [localPlayers],
  );
  const forms = useMemo(
    () => [...new Set(localPlayers.map((p) => p.form).filter(Boolean))],
    [localPlayers],
  );
  const teams = useMemo(
    () => [...new Set(localPlayers.map((p) => p.team).filter(Boolean))],
    [localPlayers],
  );

  // ── دوال الأكشن ───────────────────────────────────────────────

  function handleDeleteItem(player) {
    if (!window.confirm(`هل أنت متأكد من حذف ${player.name}؟`)) return;

    const backup = [...localPlayers];
    setLocalPlayers((prev) => prev.filter((x) => x.id !== player.id));

    if (paginatedPlayers.length === 1 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }

    deleteDoc(doc(db, "players", player.id))
      .then(() => toast.success("تم حذف اللاعب ✅"))
      .catch(() => {
        setLocalPlayers(backup);
        toast.error("فشل الحذف ❌");
      });
  }

  async function handleDeleteAll() {
    if (
      !window.confirm(
        `⚠️ حذف جميع اللاعبين (${localPlayers.length})؟ لا يمكن التراجع!`,
      )
    )
      return;

    setDeletingAll(true);
    const backup = [...localPlayers];
    setLocalPlayers([]);
    setCurrentPage(1);

    try {
      const snapshot = await getDocs(collection(db, "players"));
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      toast.success("تم حذف جميع اللاعبين 🗑️");
    } catch {
      setLocalPlayers(backup);
      toast.error("فشل الحذف ❌");
    } finally {
      setDeletingAll(false);
    }
  }

  function handleExportExcel() {
    const rows = filteredPlayers.map((p, i) => ({
      "#": i + 1,
      الاسم: p.name,
      "الرقم القومى": p.nationalId || "",
      النوع: p.gender,
      اللعبة: p.game,
      المرحلة: p.stage,
      الكنيسة: p.church,
      "تاريخ الميلاد": p.birthdate,
      "رقم التليفون": p.phone,
      الإستمارة: p.form,
      "اسم الفريق": p.team || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 5 }, { wch: 25 }, { wch: 18 }, { wch: 10 }, { wch: 15 },
      { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "اللاعبين");
    const fileName = `اللاعبين_${new Date().toLocaleDateString("ar-EG").replace(/\//g, "-")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("تم تحميل Excel ✅");
  }

  // ── حالات التحميل والخطأ ─────────────────────────────────────

  if (loadingFetch) {
    return (
      <div className="flex justify-center items-center py-24" role="status">
        <Loader />
      </div>
    );
  }

  if (errorFetch) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="text-4xl">⚠️</span>
        <p className="text-red-500 font-semibold">{errorFetch}</p>
      </div>
    );
  }

  if (localPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-slate-400">
        <svg className="w-16 h-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-lg font-semibold text-slate-500">لا يوجد لاعبين مسجلين بعد</p>
        <p className="text-sm">ابدأ بتسجيل اللاعبين من الصفحة الرئيسية</p>
      </div>
    );
  }

  // ── الواجهة الرئيسية ──────────────────────────────────────────

  return (
    <div className="min-h-screen max-w-4xl mx-auto" dir="rtl">
      {/* ═══ شريط الفلاتر ═══════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
          فلترة النتائج
        </p>
        <div className="flex flex-wrap gap-2" role="search">
          <SelectBox
            label="النوع"
            value={filter.gender}
            onChange={(e) => handleFilterChange("gender", e.target.value)}
            options={genders}
          />
          <SelectBox
            label="المرحلة"
            value={filter.stage}
            onChange={(e) => handleFilterChange("stage", e.target.value)}
            options={stages}
          />
          <SelectBox
            label="اللعبة"
            value={filter.game}
            onChange={(e) => handleFilterChange("game", e.target.value)}
            options={games}
          />
          <SelectBox
            label="الكنيسة"
            value={filter.church}
            onChange={(e) => handleFilterChange("church", e.target.value)}
            options={churches}
          />
          <SelectBox
            label="الإستمارة"
            value={filter.form}
            onChange={(e) => handleFilterChange("form", e.target.value)}
            options={forms}
          />
          <SelectBox
            label="الفريق"
            value={filter.team}
            onChange={(e) => handleFilterChange("team", e.target.value)}
            options={teams}
          />
          <button
            onClick={resetFilters}
            disabled={!isFiltered}
            title="مسح جميع الفلاتر"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              isFiltered
                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white cursor-pointer"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            مسح
          </button>
        </div>
      </div>

      {/* ═══ شريط الإحصاء والأزرار ══════════════════════════════ */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-700 inline-block"></span>
          <p className="text-sm font-semibold text-slate-700" aria-live="polite">
            {filteredPlayers.length} لاعب
            {isFiltered && (
              <span className="text-slate-400 font-normal"> من {localPlayers.length}</span>
            )}
          </p>
        </div>

        {canAction && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={filteredPlayers.length === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                filteredPlayers.length === 0
                  ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-700 hover:text-white cursor-pointer"
              }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Excel
            </button>

            <button
              onClick={handleDeleteAll}
              disabled={deletingAll || localPlayers.length === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                deletingAll || localPlayers.length === 0
                  ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                  : "bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white cursor-pointer"
              }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deletingAll ? "جاري الحذف..." : "مسح الكل"}
            </button>
          </div>
        )}
      </div>

      {/* ═══ قائمة اللاعبين ══════════════════════════════════════ */}
      {filteredPlayers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
          <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="font-semibold text-slate-500">لا توجد نتائج</p>
          <p className="text-sm">حاول تغيير الفلتر أو مسحه</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 pb-4">
            {paginatedPlayers.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={(currentPage - 1) * ITEMS_PER_PAGE + index}
                canAction={canAction}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
