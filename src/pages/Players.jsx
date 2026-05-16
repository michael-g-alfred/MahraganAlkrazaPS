import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import AlertIcon from "../icons/AlertIcon";
import TrashIcon from "../icons/TrashIcon";
import FilterIcon from "../icons/FilterIcon";
import Loader from "../components/Loader";
import useFetch from "../hooks/useFetch";
import SelectBox from "../components/SelectBox";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

const BASE_URL = import.meta.env.VITE_FIREBASE_URL;

export default function Players() {
  const { user } = useAuth();

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

  const isFilter = Object.values(filter).some(Boolean);

  // ── حذف لاعب واحد ──
  function handleDeleteItem(player) {
    if (window.confirm(`هل أنت متأكد من حذف ${player.name}؟`)) {
      const prevPlayers = [...localPlayers];
      setLocalPlayers((prev) => prev.filter((p) => p.id !== player.id));

      fetch(`${BASE_URL}/players/${player.id}.json`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error("فشل في الحذف");
          toast.success("تم حذف اللاعب بنجاح ✅");
        })
        .catch(() => {
          setLocalPlayers(prevPlayers);
          toast.error("حدث خطأ أثناء الحذف ❌ - تم استرجاع اللاعب");
        });
    }
  }

  // ── مسح الكل ──
  async function handleDeleteAll() {
    if (
      !window.confirm(
        `⚠️ هل أنت متأكد من حذف جميع اللاعبين (${localPlayers.length} لاعب)؟\nلا يمكن التراجع عن هذا الإجراء!`,
      )
    )
      return;

    setDeletingAll(true);
    const prevPlayers = [...localPlayers];
    setLocalPlayers([]);

    try {
      const res = await fetch(`${BASE_URL}/players.json`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
      toast.success("تم حذف جميع اللاعبين بنجاح 🗑️");
    } catch {
      setLocalPlayers(prevPlayers);
      toast.error("حدث خطأ أثناء الحذف ❌ - تم استرجاع البيانات");
    } finally {
      setDeletingAll(false);
    }
  }

  // ── Export to Excel ──
  function handleExportExcel() {
    const rows = filteredPlayers.map((p, i) => ({
      "#": i + 1,
      الاسم: p.name,
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
    toast.success("تم تحميل ملف Excel ✅");
  }

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

  const genders  = useMemo(() => [...new Set(localPlayers.map((p) => p.gender).filter(Boolean))], [localPlayers]);
  const games    = useMemo(() => [...new Set(localPlayers.map((p) => p.game).filter(Boolean))],   [localPlayers]);
  const stages   = useMemo(() => [...new Set(localPlayers.map((p) => p.stage).filter(Boolean))],  [localPlayers]);
  const churches = useMemo(() => [...new Set(localPlayers.map((p) => p.church).filter(Boolean))], [localPlayers]);
  const forms    = useMemo(() => [...new Set(localPlayers.map((p) => p.form).filter(Boolean))],   [localPlayers]);
  const teams    = useMemo(() => [...new Set(localPlayers.map((p) => p.team).filter(Boolean))],   [localPlayers]);

  return (
    <div className="min-h-screen">
      {loadingFetch && (
        <div className="flex justify-center items-center py-12" role="status" aria-label="جاري التحميل">
          <Loader />
        </div>
      )}

      {!loadingFetch && errorFetch && (
        <div role="alert" className="flex justify-center items-center text-red-500 text-xl font-semibold py-12">
          {errorFetch}
        </div>
      )}

      {!loadingFetch && !errorFetch && localPlayers.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-6" role="search" aria-label="تصفية اللاعبين">
          <SelectBox label="كل الأنواع"     value={filter.gender} onChange={(e) => setFilter({ ...filter, gender:  e.target.value })} options={genders}  />
          <SelectBox label="كل المراحل"     value={filter.stage}  onChange={(e) => setFilter({ ...filter, stage:   e.target.value })} options={stages}   />
          <SelectBox label="كل الألعاب"     value={filter.game}   onChange={(e) => setFilter({ ...filter, game:    e.target.value })} options={games}    />
          <SelectBox label="كل الكنائس"     value={filter.church} onChange={(e) => setFilter({ ...filter, church:  e.target.value })} options={churches} />
          <SelectBox label="كل الإستمارات" value={filter.form}   onChange={(e) => setFilter({ ...filter, form:    e.target.value })} options={forms}    />
          <SelectBox label="كل الفرق"       value={filter.team}   onChange={(e) => setFilter({ ...filter, team:    e.target.value })} options={teams}    />

          <button
            onClick={() => setFilter({ gender: "", game: "", stage: "", church: "", form: "", team: "" })}
            disabled={!isFilter}
            aria-label="مسح كل الفلاتر"
            className={`${isFilter ? "bg-blue-700 hover:bg-blue-800 text-white cursor-pointer" : "bg-gray-300 cursor-not-allowed text-gray-400"} px-4 py-2 rounded-lg transition`}>
            <FilterIcon />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {!loadingFetch && !errorFetch && localPlayers.length > 0 && (
        <div className="flex flex-wrap justify-center items-center gap-3 mb-4" dir="rtl">
          <p className="text-blue-700 font-bold text-lg" aria-live="polite" aria-atomic="true">
            عدد اللاعبين: {filteredPlayers.length}
          </p>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            disabled={filteredPlayers.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${
              filteredPlayers.length === 0 ? "bg-gray-300 text-gray-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-800 text-white cursor-pointer"
            }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            تحميل Excel
          </button>

          {/* مسح الكل */}
          <button
            onClick={handleDeleteAll}
            disabled={deletingAll || localPlayers.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${
              deletingAll || localPlayers.length === 0 ? "bg-gray-300 text-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            {deletingAll ? "جاري الحذف..." : "مسح الكل"}
          </button>
        </div>
      )}

      {!loadingFetch && !errorFetch && filteredPlayers.length > 0 && (
        <div className="overflow-x-auto mx-auto shadow-sm rounded-xl">
          <table className="min-w-full rounded-xl overflow-hidden text-xs sm:text-sm md:text-base w-full" role="table" aria-label="جدول اللاعبين">
            <thead className="bg-blue-700 text-white text-sm">
              <tr>
                <th scope="col" className="p-2 sm:p-3 text-center">#</th>
                <th scope="col" className="p-2 sm:p-3 text-center">الصورة</th>
                <th scope="col" className="p-2 sm:p-3 text-center">الاسم</th>
                <th scope="col" className="p-2 sm:p-3 text-center">النوع</th>
                <th scope="col" className="p-2 sm:p-3 text-center">اللعبة</th>
                <th scope="col" className="p-2 sm:p-3 text-center">المرحلة</th>
                <th scope="col" className="p-2 sm:p-3 text-center">الكنيسة</th>
                <th scope="col" className="p-2 sm:p-3 text-center">تاريخ الميلاد</th>
                <th scope="col" className="p-2 sm:p-3 text-center">رقم التليفون</th>
                <th scope="col" className="p-2 sm:p-3 text-center">الإستمارة</th>
                <th scope="col" className="p-2 sm:p-3 text-center bg-green-700">اسم الفريق</th>
                <th scope="col" className="p-2 sm:p-3 text-center bg-red-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="text-blue-700 bg-white text-sm">
              {filteredPlayers.map((player, index) => (
                <tr key={player.id} className="border-t border-blue-300 hover:bg-blue-100 transition">
                  <td className="p-2 sm:p-3 text-center font-semibold bg-blue-50">{index + 1}</td>
                  <td className="p-2 sm:p-3 flex justify-center items-center text-center bg-blue-100">
                    <img
                      src={player.image}
                      alt={`صورة ${player.name}`}
                      loading="lazy"
                      width={100}
                      height={100}
                      className="w-full max-w-[80px] sm:max-w-[100px] md:max-w-[120px] h-auto object-contain rounded-md border-2 border-blue-700"
                    />
                  </td>
                  <td className="p-2 sm:p-3 font-bold text-center bg-blue-50">{player.name}</td>
                  <td className="p-2 sm:p-3 text-center bg-blue-100">{player.gender}</td>
                  <td className="p-2 sm:p-3 text-center bg-blue-50">{player.game}</td>
                  <td className="p-2 sm:p-3 text-center bg-blue-100">{player.stage}</td>
                  <td className="p-2 sm:p-3 text-center bg-blue-50">{player.church}</td>
                  <td className="p-2 sm:p-3 text-center bg-blue-100">{player.birthdate}</td>
                  <td className="p-2 sm:p-3 text-center font-mono bg-blue-50">{player.phone}</td>
                  <td className="p-2 sm:p-3 text-center bg-blue-100">{player.form}</td>
                  <td className="p-2 sm:p-3 text-center bg-green-50">
                    {player.team ? (
                      <span className="font-semibold text-green-800 bg-green-200 px-3 py-1 rounded-full">{player.team}</span>
                    ) : (
                      <hr className="border border-green-700 w-6 mx-auto rounded-full" />
                    )}
                  </td>
                  <td className="p-2 sm:p-3 text-center bg-red-50">
                    <button onClick={() => handleDeleteItem(player)} aria-label={`حذف اللاعب ${player.name}`} className="cursor-pointer">
                      <TrashIcon size={32} color="red" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loadingFetch && !errorFetch && localPlayers.length === 0 && (
        <div className="flex flex-col justify-center items-center gap-2 text-center py-16" role="status">
          <span className="text-gray-500" aria-hidden="true"><AlertIcon /></span>
          <p className="text-gray-500 text-xl font-semibold">لا يوجد لاعبين مسجلين بعد</p>
        </div>
      )}
    </div>
  );
}
