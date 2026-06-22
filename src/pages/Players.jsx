import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import useFetch from "../hooks/useFetch";
import SelectBox from "../components/SelectBox";
import Pagination from "../components/Pagination";
import EditPlayerModal from "../components/EditPlayerModal";
import { useAuth } from "../context/AuthContext";
import {
  doc,
  deleteDoc,
  writeBatch,
  getDocs,
  collection,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

const ALLOWED_ACTION_EMAIL = import.meta.env.VITE_ALLOWED_ACTION?.toLowerCase();
const ALLOWED_PAID_EMAIL = import.meta.env.VITE_ALLOWED_PAID?.toLowerCase();
const ITEMS_PER_PAGE = 20;

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

function PaidCheckbox({ playerId, paid, onToggle, canPaidAction }) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    e.stopPropagation();
    if (!canPaidAction) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "players", playerId), { paid: !paid });
      onToggle(playerId, !paid);
      toast.success(!paid ? "✅ تم تسجيل الدفع" : "↩️ تم إلغاء الدفع", {
        duration: 2000,
      });
    } catch {
      toast.error("فشل تحديث حالة الدفع");
    } finally {
      setLoading(false);
    }
  };

  if (!canPaidAction) {
    return (
      <span
        className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0
        ${paid ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-500"}
      `}>
        {paid ? "دفع" : "لم يدفع"}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleChange}
      disabled={loading}
      aria-label={paid ? "إلغاء الدفع" : "تسجيل الدفع"}
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        border transition-all duration-200 flex-shrink-0
        ${
          loading ?
            "opacity-50 cursor-wait border-slate-200 bg-slate-50 text-slate-400"
          : paid ?
            "bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200"
          : "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
        }
      `}>
      {loading ?
        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      : paid ?
        <svg
          className="w-3 h-3"
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
      : <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      }
      {paid ? "دفع" : "لم يدفع"}
    </button>
  );
}

function PlayerCard({
  player,
  index,
  canAction,
  canPaidAction,
  onDelete,
  onPaidToggle,
  onEdit,
}) {
  const [expanded, setExpanded] = useState(false);
  const color = avatarColor(player.name);
  const initials = getInitials(player.name);

  const handleToggle = () => {
    if (window.getSelection()?.toString()) return;
    setExpanded((v) => !v);
  };

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
        expanded ? "border-blue-300 shadow-sm border-2" : "border-slate-200"
      }`}>
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`تفاصيل ${player.name}`}>
        <span className="text-xs text-slate-400 w-6 text-center flex-shrink-0 font-mono font-bold select-none">
          {index + 1}
        </span>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 select-none"
          style={{ background: color.bg, color: color.text }}
          aria-hidden="true">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate leading-tight select-text">
            {player.name}
          </p>
          <p
            className="text-sm font-bold font-mono text-rose-700 truncate mt-0.5 select-text"
            dir="rtl">
            {player.nationalId || "—"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {canAction && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(player);
              }}
              title="تعديل بيانات اللاعب"
              aria-label={`تعديل بيانات ${player.name}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-700 hover:text-white flex-shrink-0">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              تعديل
            </button>
          )}
          <PaidCheckbox
            playerId={player.id}
            paid={!!player.paid}
            onToggle={onPaidToggle}
            canPaidAction={canPaidAction}
          />
          <div className="hidden sm:flex items-center gap-1.5">
            <GenderBadge gender={player.gender} />
            <FormBadge form={player.form} />
          </div>
        </div>

        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 select-none ${expanded ? "rotate-180" : ""}`}
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

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 pb-4 pt-3">
          <div className="flex sm:hidden items-center gap-2 mb-3">
            <GenderBadge gender={player.gender} />
            <FormBadge form={player.form} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <DetailItem label="المرحلة">{player.stage || "—"}</DetailItem>
            <DetailItem label="تاريخ الميلاد">
              {player.birthdate || "—"}
            </DetailItem>
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
            <DetailItem label="حالة الاشتراك">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${
                  player.paid ?
                    "bg-emerald-100 text-emerald-800"
                  : "bg-red-50 text-red-600"
                }`}>
                {player.paid ? "✓ دفع الاشتراك" : "✗ لم يدفع بعد"}
              </span>
            </DetailItem>
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

function DetailItem({ label, children, className = "" }) {
  return (
    <div className={`select-text ${className}`}>
      <p className="text-blue-700 mb-0.5 text-sm font-medium">{label}</p>
      <div className="text-slate-700 font-black text-xs">{children}</div>
    </div>
  );
}

// ── مساعد: استخراج قيم فريدة غير فارغة ───────────────────────────
function uniqueValues(arr, key) {
  return [...new Set(arr.map((p) => p[key]).filter(Boolean))].sort();
}

// ── مساعد: تطبيع النص العربي للبحث (يشيل التشكيل ويوحّد الحروف المتشابهة) ──
function normalizeArabicSearch(str) {
  if (!str) return "";
  return str
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .toLowerCase();
}

export default function Players() {
  const { user } = useAuth();

  const currentUserEmail = user?.email?.toLowerCase();
  const canAction = currentUserEmail === ALLOWED_ACTION_EMAIL;
  const canPaidAction = currentUserEmail === ALLOWED_PAID_EMAIL;

  const [loadingFetch, errorFetch, players] = useFetch();
  const [localPlayers, setLocalPlayers] = useState([]);
  const [deletingAll, setDeletingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [editingPlayer, setEditingPlayer] = useState(null);

  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [loadingRegStatus, setLoadingRegStatus] = useState(true);
  const [togglingReg, setTogglingReg] = useState(false);

  // ── البحث بالاسم ─────────────────────────────────────────────
  const [searchName, setSearchName] = useState("");

  // ── الفلاتر المتسلسلة ─────────────────────────────────────────
  const [filter, setFilter] = useState({
    gender: "",
    game: "",
    stage: "",
    church: "",
    form: "",
    team: "",
    paid: "",
  });

  useEffect(() => {
    const fetchRegStatus = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "registration"));
        if (snap.exists()) {
          setRegistrationClosed(snap.data().closed === true);
        }
      } catch {
        // ignore
      } finally {
        setLoadingRegStatus(false);
      }
    };
    fetchRegStatus();
  }, []);

  const handleToggleRegistration = async () => {
    if (!canAction) return;
    const newVal = !registrationClosed;
    setTogglingReg(true);
    try {
      await setDoc(doc(db, "settings", "registration"), { closed: newVal });
      setRegistrationClosed(newVal);
      toast.success(newVal ? "🔒 تم غلق التسجيل" : "🔓 تم فتح التسجيل", {
        duration: 3000,
      });
    } catch {
      toast.error("فشل تغيير حالة التسجيل");
    } finally {
      setTogglingReg(false);
    }
  };

  useEffect(() => {
    setLocalPlayers(players);
  }, [players]);

  // ── دالة تغيير فلتر مع إعادة تعيين الفلاتر التالية ──────────
  const FILTER_ORDER = [
    "gender",
    "game",
    "stage",
    "church",
    "form",
    "team",
    "paid",
  ];

  const handleFilterChange = (key, value) => {
    const keyIndex = FILTER_ORDER.indexOf(key);
    const downstream = FILTER_ORDER.slice(keyIndex + 1);

    setFilter((prev) => {
      const next = { ...prev, [key]: value };
      downstream.forEach((k) => {
        next[k] = "";
      });
      return next;
    });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilter({
      gender: "",
      game: "",
      stage: "",
      church: "",
      form: "",
      team: "",
      paid: "",
    });
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchName(value);
    setCurrentPage(1);
  };

  const isFiltered = Object.values(filter).some(Boolean) || !!searchName.trim();

  const handlePaidToggle = (playerId, newPaid) => {
    setLocalPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, paid: newPaid } : p)),
    );
  };

  const handlePlayerSaved = (updatedPlayer) => {
    setLocalPlayers((prev) =>
      prev.map((p) =>
        p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } : p,
      ),
    );
  };

  // ── حساب خيارات الفلاتر المتسلسلة ────────────────────────────
  // كل مستوى يُفلتر على أساس كل ما قبله فقط

  const afterGender = useMemo(
    () =>
      filter.gender ?
        localPlayers.filter((p) => p.gender === filter.gender)
      : localPlayers,
    [localPlayers, filter.gender],
  );

  const afterGame = useMemo(
    () =>
      filter.game ?
        afterGender.filter((p) => p.game === filter.game)
      : afterGender,
    [afterGender, filter.game],
  );

  const afterStage = useMemo(
    () =>
      filter.stage ?
        afterGame.filter((p) => p.stage === filter.stage)
      : afterGame,
    [afterGame, filter.stage],
  );

  const afterChurch = useMemo(
    () =>
      filter.church ?
        afterStage.filter((p) => p.church === filter.church)
      : afterStage,
    [afterStage, filter.church],
  );

  const afterForm = useMemo(
    () =>
      filter.form ?
        afterChurch.filter((p) => p.form === filter.form)
      : afterChurch,
    [afterChurch, filter.form],
  );

  const afterTeam = useMemo(
    () =>
      filter.team ? afterForm.filter((p) => p.team === filter.team) : afterForm,
    [afterForm, filter.team],
  );

  // خيارات كل فلتر (مبنية على ما قبله)
  const genderOptions = useMemo(
    () => uniqueValues(localPlayers, "gender"),
    [localPlayers],
  );
  const gameOptions = useMemo(
    () => uniqueValues(afterGender, "game"),
    [afterGender],
  );
  const stageOptions = useMemo(
    () => uniqueValues(afterGame, "stage"),
    [afterGame],
  );
  const churchOptions = useMemo(
    () => uniqueValues(afterStage, "church"),
    [afterStage],
  );
  const formOptions = useMemo(
    () => uniqueValues(afterChurch, "form"),
    [afterChurch],
  );
  const teamOptions = useMemo(
    () => uniqueValues(afterForm, "team"),
    [afterForm],
  );

  // ── النتائج النهائية ─────────────────────────────────────────
  const filteredPlayers = useMemo(() => {
    let result = afterTeam;
    if (filter.paid === "دفعوا فقط") result = result.filter((p) => p.paid);
    if (filter.paid === "لم يدفعوا فقط") result = result.filter((p) => !p.paid);

    const trimmedSearch = searchName.trim();
    if (trimmedSearch) {
      const normalizedSearch = normalizeArabicSearch(trimmedSearch);
      result = result.filter((p) =>
        normalizeArabicSearch(p.name).includes(normalizedSearch),
      );
    }

    return result;
  }, [afterTeam, filter.paid, searchName]);

  const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);

  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  // ── حذف ───────────────────────────────────────────────────────
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
    const rows = filteredPlayers.map((p) => ({
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
      "دفع الاشتراك": p.paid ? "دفع ✓" : "لم يدفع ✗",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    ws["!cols"] = [
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
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();

    // جعل المصنف RTL
    wb.Workbook = {
      Views: [{ RTL: true }],
    };

    XLSX.utils.book_append_sheet(wb, ws, "اللاعبين");

    const fileName = `اللاعبين_${new Date()
      .toLocaleDateString("ar-EG")
      .replace(/\//g, "-")}.xlsx`;

    XLSX.writeFile(wb, fileName);

    toast.success("تم تحميل Excel ✅");
  }

  if (loadingFetch) {
    return (
      <div className="flex justify-center items-center py-24" role="status">
        <Loader />
      </div>
    );
  }

  if (errorFetch) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="text-4xl">⚠️</span>
        <p className="text-red-500 font-semibold">{errorFetch}</p>
      </div>
    );
  }

  if (localPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-slate-400">
        {canAction && (
          <div className="mb-4">
            <RegistrationToggleButton
              closed={registrationClosed}
              loading={loadingRegStatus || togglingReg}
              onToggle={handleToggleRegistration}
            />
          </div>
        )}
        <svg
          className="w-16 h-16 text-slate-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-lg font-semibold text-slate-500">
          لا يوجد لاعبين مسجلين بعد
        </p>
        <p className="text-sm">ابدأ بتسجيل اللاعبين من الصفحة الرئيسية</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto" dir="rtl">
      {editingPlayer && (
        <EditPlayerModal
          player={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSaved={handlePlayerSaved}
        />
      )}

      {/* ── شريط البحث بالاسم ──────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
        <label
          htmlFor="playerSearch"
          className="block mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          البحث بالاسم
        </label>
        <div className="relative">
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="playerSearch"
            type="text"
            value={searchName}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="اكتب اسم اللاعب..."
            className="w-full border border-blue-700 rounded-xl pr-10 pl-10 py-2.5 text-sm
                       outline-none focus:ring-2 focus:ring-blue-300 transition"
          />
          {searchName && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              aria-label="مسح البحث"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── شريط الفلاتر المتسلسلة ────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            فلترة النتائج
          </p>
          {isFiltered && (
            <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5 font-semibold">
              {Object.values(filter).filter(Boolean).length +
                (searchName.trim() ? 1 : 0)}{" "}
              فلتر نشط
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2" role="search">
          {/* النوع — دائماً يظهر */}
          <SelectBox
            label="النوع"
            value={filter.gender}
            onChange={(e) => handleFilterChange("gender", e.target.value)}
            options={genderOptions}
          />

          {/* اللعبة — خياراتها تتغير حسب النوع المختار */}
          <SelectBox
            label="اللعبة"
            value={filter.game}
            onChange={(e) => handleFilterChange("game", e.target.value)}
            options={gameOptions}
          />

          {/* المرحلة — حسب النوع + اللعبة */}
          <SelectBox
            label="المرحلة"
            value={filter.stage}
            onChange={(e) => handleFilterChange("stage", e.target.value)}
            options={stageOptions}
          />

          {/* الكنيسة — حسب النوع + اللعبة + المرحلة */}
          <SelectBox
            label="الكنيسة"
            value={filter.church}
            onChange={(e) => handleFilterChange("church", e.target.value)}
            options={churchOptions}
          />

          {/* الإستمارة — حسب ما قبلها */}
          <SelectBox
            label="الإستمارة"
            value={filter.form}
            onChange={(e) => handleFilterChange("form", e.target.value)}
            options={formOptions}
          />

          {/* الفريق — حسب ما قبله */}
          {teamOptions.length > 0 && (
            <SelectBox
              label="الفريق"
              value={filter.team}
              onChange={(e) => handleFilterChange("team", e.target.value)}
              options={teamOptions}
            />
          )}

          {/* الاشتراك — ثابت دائماً */}
          <SelectBox
            label="الاشتراك"
            value={filter.paid}
            onChange={(e) => handleFilterChange("paid", e.target.value)}
            options={["دفعوا فقط", "لم يدفعوا فقط"]}
          />

          {/* زر مسح الفلاتر */}
          <button
            onClick={() => {
              resetFilters();
              handleSearchChange("");
            }}
            disabled={!isFiltered}
            title="مسح جميع الفلاتر"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              isFiltered ?
                "bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white cursor-pointer"
              : "bg-slate-100 text-slate-300 border border-transparent cursor-not-allowed"
            }`}>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            مسح
          </button>
        </div>

        {/* ملخص الفلاتر النشطة */}
        {isFiltered && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
            {searchName.trim() && (
              <button
                onClick={() => handleSearchChange("")}
                className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 hover:bg-blue-600 hover:text-white transition-all"
                title="إزالة البحث بالاسم">
                <span className="font-medium">الاسم:</span>
                <span>{searchName.trim()}</span>
                <svg
                  className="w-3 h-3 mr-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            {FILTER_ORDER.filter((k) => filter[k]).map((k) => {
              const labels = {
                gender: "النوع",
                game: "اللعبة",
                stage: "المرحلة",
                church: "الكنيسة",
                form: "الإستمارة",
                team: "الفريق",
                paid: "الاشتراك",
              };
              return (
                <button
                  key={k}
                  onClick={() => handleFilterChange(k, "")}
                  className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 hover:bg-blue-600 hover:text-white transition-all"
                  title={`إزالة فلتر ${labels[k]}`}>
                  <span className="font-medium">{labels[k]}:</span>
                  <span>{filter[k]}</span>
                  <svg
                    className="w-3 h-3 mr-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── شريط الإحصاء والأزرار ──────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-700 inline-block"></span>
          <p
            className="text-sm font-semibold text-slate-700"
            aria-live="polite">
            {filteredPlayers.length} لاعب
            {isFiltered && (
              <span className="text-slate-400 font-normal">
                {" "}
                من {localPlayers.length}
              </span>
            )}
          </p>
        </div>

        {canAction && (
          <div className="flex items-center gap-2 flex-wrap">
            <RegistrationToggleButton
              closed={registrationClosed}
              loading={loadingRegStatus || togglingReg}
              onToggle={handleToggleRegistration}
            />
            <button
              onClick={handleExportExcel}
              disabled={filteredPlayers.length === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                filteredPlayers.length === 0 ?
                  "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-700 hover:text-white cursor-pointer"
              }`}>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Excel
            </button>
            {/* <button
              onClick={handleDeleteAll}
              disabled={deletingAll || localPlayers.length === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                deletingAll || localPlayers.length === 0
                  ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                  : "bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white cursor-pointer"
              }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deletingAll ? "جاري الحذف..." : "مسح الكل"}
            </button> */}
          </div>
        )}
      </div>

      {/* ── قائمة اللاعبين ─────────────────────────────────────── */}
      {filteredPlayers.length === 0 ?
        <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
          <svg
            className="w-10 h-10 text-slate-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="font-semibold text-slate-500">لا توجد نتائج</p>
          <p className="text-sm">حاول تغيير الفلتر أو مسحه</p>
        </div>
      : <>
          <div className="flex flex-col gap-2 pb-4">
            {paginatedPlayers.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={(currentPage - 1) * ITEMS_PER_PAGE + index}
                canAction={canAction}
                canPaidAction={canPaidAction}
                onDelete={handleDeleteItem}
                onPaidToggle={handlePaidToggle}
                onEdit={setEditingPlayer}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      }
    </div>
  );
}

function RegistrationToggleButton({ closed, loading, onToggle }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      title={closed ? "فتح التسجيل" : "غلق التسجيل"}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
        loading ? "bg-slate-50 text-slate-300 border-slate-200 cursor-wait"
        : closed ?
          "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-700 hover:text-white cursor-pointer"
        : "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-700 hover:text-white cursor-pointer"
      }`}>
      {loading ?
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      : closed ?
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
          />
        </svg>
      : <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM16 7a4 4 0 00-8 0v4h8V7z"
          />
        </svg>
      }
      {loading ?
        "..."
      : closed ?
        "فتح التسجيل"
      : "غلق التسجيل"}
    </button>
  );
}
