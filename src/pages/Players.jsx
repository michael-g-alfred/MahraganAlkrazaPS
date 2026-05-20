import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import useFetch from "../hooks/useFetch";
import SelectBox from "../components/SelectBox";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

const BASE_URL = import.meta.env.VITE_FIREBASE_URL;
const ALLOWED_DELETE_ALL_EMAIL = "michoolgeorge@gmail.com";

function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0][0];
  return parts[0][0] + parts[1][0];
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
      <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-medium whitespace-nowrap">
        جماعى
      </span>
    );
  return (
    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-medium whitespace-nowrap">
      فردى
    </span>
  );
}

function PlayerCard({ player, index, canAction, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const color = avatarColor(player.name);
  const initials = getInitials(player.name);

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden transition-all ${
        expanded ? "border-blue-200" : "border-slate-100"
      }`}>
      {/* Header — دائماً مرئي */}
      <div
        className="flex items-center gap-3 px-3 py-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
        aria-label={`تفاصيل ${player.name}`}>
        {/* الترتيب */}
        <span className="text-xs text-slate-400 w-5 text-center flex-shrink-0">
          {index + 1}
        </span>

        {/* الصورة الرمزية */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
          style={{ background: color.bg, color: color.text }}>
          {initials}
        </div>

        {/* الاسم وتحته الرقم القومي */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {player.name}
          </p>
          <p
            className="text-xs font-mono text-slate-400 truncate"
            dir="ltr"
            style={{ textAlign: "right" }}>
            {player.nationalId || "—"}
          </p>
        </div>

        {/* الشارات تظهر بالخارج فقط في الشاشات الكبيرة والمتوسطة md */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          <GenderBadge gender={player.gender} />
          <FormBadge form={player.form} />
        </div>

        {/* السهم جهة اليسار */}
        <svg
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* التفاصيل عند التوسيع */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {/* الشارات تظهر هنا فقط في الموبايل الصغير وتختفي في الشاشات الأكبر md لأنها معروضة بالخارج بالفعل */}
          <div className="flex md:hidden items-center gap-2 pt-3 pb-1">
            <GenderBadge gender={player.gender} />
            <FormBadge form={player.form} />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 text-xs">
            <DetailItem label="اللعبة">{player.game || "—"}</DetailItem>
            <DetailItem label="المرحلة">{player.stage || "—"}</DetailItem>
            <DetailItem label="تاريخ الميلاد">
              {player.birthdate || "—"}
            </DetailItem>
            <DetailItem label="التليفون">
              <span className="font-mono">{player.phone || "—"}</span>
            </DetailItem>
            <div className="col-span-2">
              <DetailItem label="الكنيسة">{player.church || "—"}</DetailItem>
            </div>
            <div className="col-span-2">
              <DetailItem label="الفريق">
                {player.team ?
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {player.team}
                  </span>
                : <span className="text-slate-400">—</span>}
              </DetailItem>
            </div>
          </div>

          {canAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(player);
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-red-600 bg-red-50 border border-red-100 text-xs font-medium hover:bg-red-100 transition"
              aria-label={`حذف اللاعب ${player.name}`}>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true">
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
      <p className="text-slate-400 mb-0.5">{label}</p>
      <div className="text-slate-900 font-medium truncate">{children}</div>
    </div>
  );
}

export default function Players() {
  const { user } = useAuth();
  const canAction = user?.email?.toLowerCase() === ALLOWED_DELETE_ALL_EMAIL;

  const [loadingFetch, errorFetch, players] = useFetch();
  const [localPlayers, setLocalPlayers] = useState([]);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    setLocalPlayers(players);
  }, [players]);

  const [filter, setFilter] = useState({
    gender: "",
    game: "",
    form: "",
    stage: "",
    church: "",
    team: "",
  });

  const isFiltered = Object.values(filter).some(Boolean);

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

  function handleDeleteItem(player) {
    if (!window.confirm(`هل أنت متأكد من حذف ${player.name}؟`)) return;
    const prev = [...localPlayers];
    setLocalPlayers((p) => p.filter((x) => x.id !== player.id));
    fetch(`${BASE_URL}/players/${player.id}.json`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error();
        toast.success("تم حذف اللاعب ✅");
      })
      .catch(() => {
        setLocalPlayers(prev);
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
    const prev = [...localPlayers];
    setLocalPlayers([]);
    try {
      const res = await fetch(`${BASE_URL}/players.json`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("تم حذف جميع اللاعبين 🗑️");
    } catch {
      setLocalPlayers(prev);
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
      { wch: 5 },
      { wch: 25 },
      { wch: 18 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "اللاعبين");
    const fileName = `اللاعبين_${new Date().toLocaleDateString("ar-EG").replace(/\//g, "-")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("تم تحميل Excel ✅");
  }

  if (loadingFetch) {
    return (
      <div
        className="flex justify-center items-center py-20"
        role="status"
        aria-label="جاري التحميل">
        <Loader />
      </div>
    );
  }

  if (errorFetch) {
    return (
      <div role="alert" className="text-red-500 text-center py-16 font-medium">
        {errorFetch}
      </div>
    );
  }

  if (localPlayers.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 py-20 text-slate-400"
        role="status">
        <svg
          className="w-12 h-12 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
          aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-lg font-medium">لا يوجد لاعبين مسجلين بعد</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir="rtl">
      {/* الفلتر */}
      <div
        className="flex flex-wrap justify-center gap-3 mb-4"
        role="search"
        aria-label="تصفية اللاعبين">
        <SelectBox
          label="كل الأنواع"
          value={filter.gender}
          onChange={(e) => setFilter({ ...filter, gender: e.target.value })}
          options={genders}
        />
        <SelectBox
          label="كل المراحل"
          value={filter.stage}
          onChange={(e) => setFilter({ ...filter, stage: e.target.value })}
          options={stages}
        />
        <SelectBox
          label="كل الألعاب"
          value={filter.game}
          onChange={(e) => setFilter({ ...filter, game: e.target.value })}
          options={games}
        />
        <SelectBox
          label="كل الكنائس"
          value={filter.church}
          onChange={(e) => setFilter({ ...filter, church: e.target.value })}
          options={churches}
        />
        <SelectBox
          label="كل الإستمارات"
          value={filter.form}
          onChange={(e) => setFilter({ ...filter, form: e.target.value })}
          options={forms}
        />
        <SelectBox
          label="كل الفرق"
          value={filter.team}
          onChange={(e) => setFilter({ ...filter, team: e.target.value })}
          options={teams}
        />
        <button
          onClick={() =>
            setFilter({
              gender: "",
              game: "",
              form: "",
              stage: "",
              church: "",
              team: "",
            })
          }
          disabled={!isFiltered}
          aria-label="مسح كل الفلاتر"
          className={`${
            isFiltered ?
              "bg-blue-700 hover:bg-blue-800 text-white cursor-pointer"
            : "bg-gray-300 cursor-not-allowed text-gray-400"
          } px-4 py-2 rounded-lg transition`}>
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 4H20v2.172a2 2 0 01-.586 1.414l-4.5 4.5M15 15v4l-6 2v-7.5L4.52 7.572A2 2 0 014 6.227V4M3 3l18 18"
            />
          </svg>
        </button>
      </div>

      {/* عداد + أزرار الأكشن */}
      <div
        className="flex flex-wrap justify-center items-center gap-3 mb-4"
        aria-live="polite">
        <p className="text-blue-700 font-bold text-lg">
          عدد اللاعبين: {filteredPlayers.length}
        </p>

        {canAction && (
          <button
            onClick={handleExportExcel}
            disabled={filteredPlayers.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${
              filteredPlayers.length === 0 ?
                "bg-gray-300 text-gray-400 cursor-not-allowed"
              : "bg-green-700 hover:bg-green-800 text-white cursor-pointer"
            }`}>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            تحميل Excel
          </button>
        )}

        {canAction && (
          <button
            onClick={handleDeleteAll}
            disabled={deletingAll || localPlayers.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${
              deletingAll || localPlayers.length === 0 ?
                "bg-gray-300 text-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            }`}>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {deletingAll ? "جاري الحذف..." : "مسح الكل"}
          </button>
        )}
      </div>

      {/* قائمة الكروت */}
      {filteredPlayers.length === 0 ?
        <div className="text-center py-16 text-slate-400">
          <p className="text-base font-medium">لا توجد نتائج</p>
          <p className="text-sm mt-1">حاول تغيير الفلتر</p>
        </div>
      : <div className="flex flex-col gap-2 pb-8">
          {filteredPlayers.map((player, index) => (
            <PlayerCard
              key={player.id}
              player={player}
              index={index}
              canAction={canAction}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      }
    </div>
  );
}
