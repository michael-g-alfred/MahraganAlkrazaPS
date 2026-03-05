import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import AlertIcon from "../icons/AlertIcon";
import TrashIcon from "../icons/TrashIcon";
import FilterIcon from "../icons/FilterIcon";
import Loader from "../components/Loader";
import useFetch from "../hooks/useFetch";
import SelectBox from "../components/SelectBox";

const BASE_URL = import.meta.env.VITE_FIREBASE_URL;

export default function Players() {
  const [loadingFetch, errorFetch, players] = useFetch();
  const [localPlayers, setLocalPlayers] = useState([]);

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

  // All fields are already normalized strings from useFetch
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
    [localPlayers, filter]
  );

  const genders = useMemo(
    () => [...new Set(localPlayers.map((p) => p.gender).filter(Boolean))],
    [localPlayers]
  );
  const games = useMemo(
    () => [...new Set(localPlayers.map((p) => p.game).filter(Boolean))],
    [localPlayers]
  );
  const stages = useMemo(
    () => [...new Set(localPlayers.map((p) => p.stage).filter(Boolean))],
    [localPlayers]
  );
  const churches = useMemo(
    () => [...new Set(localPlayers.map((p) => p.church).filter(Boolean))],
    [localPlayers]
  );
  const forms = useMemo(
    () => [...new Set(localPlayers.map((p) => p.form).filter(Boolean))],
    [localPlayers]
  );
  const teams = useMemo(
    () => [...new Set(localPlayers.map((p) => p.team).filter(Boolean))],
    [localPlayers]
  );

  return (
    <div className="min-h-screen">
      {loadingFetch && (
        <div className="flex justify-center items-center py-12" role="status" aria-label="جاري التحميل">
          <Loader />
        </div>
      )}

      {!loadingFetch && errorFetch && (
        <div
          role="alert"
          className="flex justify-center items-center text-red-500 text-xl font-semibold py-12"
        >
          {errorFetch}
        </div>
      )}

      {!loadingFetch && !errorFetch && localPlayers.length > 0 && (
        <div
          className="flex flex-wrap justify-center gap-3 mb-6"
          role="search"
          aria-label="تصفية اللاعبين"
        >
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
              setFilter({ gender: "", game: "", stage: "", church: "", form: "", team: "" })
            }
            disabled={!isFilter}
            aria-label="مسح كل الفلاتر"
            className={`${
              isFilter
                ? "bg-blue-700 hover:bg-blue-800 text-white cursor-pointer"
                : "bg-gray-300 cursor-not-allowed text-gray-400"
            } px-4 py-2 rounded-lg transition`}
          >
            <FilterIcon />
          </button>
        </div>
      )}

      {!loadingFetch && !errorFetch && localPlayers.length > 0 && (
        <div className="text-center mb-4" aria-live="polite" aria-atomic="true">
          <p className="text-blue-700 font-bold text-lg">
            عدد اللاعبين: {filteredPlayers.length}
          </p>
        </div>
      )}

      {!loadingFetch && !errorFetch && filteredPlayers.length > 0 && (
        <div className="overflow-x-auto mx-auto shadow-sm rounded-xl">
          <table
            className="min-w-full rounded-xl overflow-hidden text-xs sm:text-sm md:text-base w-full"
            role="table"
            aria-label="جدول اللاعبين"
          >
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
                <tr
                  key={player.id}
                  className="border-t border-blue-300 hover:bg-blue-100 transition"
                >
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
                      <span className="font-semibold text-green-800 bg-green-200 px-3 py-1 rounded-full">
                        {player.team}
                      </span>
                    ) : (
                      <hr className="border border-green-700 w-6 mx-auto rounded-full" />
                    )}
                  </td>
                  <td className="p-2 sm:p-3 text-center bg-red-50">
                    <button
                      onClick={() => handleDeleteItem(player)}
                      aria-label={`حذف اللاعب ${player.name}`}
                      className="cursor-pointer"
                    >
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
        <div
          className="flex flex-col justify-center items-center gap-2 text-center py-16"
          role="status"
        >
          <span className="text-gray-500" aria-hidden="true">
            <AlertIcon />
          </span>
          <p className="text-gray-500 text-xl font-semibold">لا يوجد لاعبين مسجلين بعد</p>
        </div>
      )}
    </div>
  );
}
