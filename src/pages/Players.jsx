import React, { useState, useEffect } from "react";
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
    church: "",
    game: "",
    form: "",
    stage: "",
    team: "",
  });

  const isFilter =
    filter.gender ||
    filter.game ||
    filter.stage ||
    filter.church ||
    filter.form ||
    filter.team;

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

  const filteredPlayers = localPlayers.filter((p) => {
    if (filter.gender && p.gender !== filter.gender) return false;
    if (filter.game && p.game !== filter.game) return false;
    if (filter.stage && p.stage !== filter.stage) return false;
    if (filter.church && p.church !== filter.church) return false;
    if (filter.form && p.form !== filter.form) return false;
    if (filter.team && p.team !== filter.team) return false;

    return true;
  });

  const genders = [...new Set(localPlayers.map((p) => p.gender))];
  const games = [...new Set(localPlayers.map((p) => p.game))];
  const stages = [...new Set(localPlayers.map((p) => p.stage))];
  const churches = [...new Set(localPlayers.map((p) => p.church))];
  const forms = [...new Set(localPlayers.map((p) => p.form))];
  const teams = [...new Set(localPlayers.map((p) => p.team).filter(Boolean))];

  return (
    <div className="min-h-screen">
      {loadingFetch && (
        <div className="flex justify-center items-center">
          <Loader />
        </div>
      )}
      {!loadingFetch && errorFetch && (
        <div className="flex justify-center items-center  text-red-500 text-xl font-semibold">
          {errorFetch}
        </div>
      )}

      {!loadingFetch && !errorFetch && localPlayers.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-6">
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
                stage: "",
                church: "",
                form: "",
                team: "",
              })
            }
            disabled={!isFilter}
            className={`${
              isFilter
                ? "bg-blue-700 hover:bg-blue-800 text-white cursor-pointer"
                : "bg-gray-300 cursor-not-allowed text-gray-400"
            } px-4 py-2 rounded-lg transition`}>
            <FilterIcon />
          </button>
        </div>
      )}

      {!loadingFetch && !errorFetch && localPlayers.length > 0 && (
        <div className="text-center mb-4">
          <p className="text-blue-700 font-bold text-lg">
            عدد اللاعبين: {filteredPlayers.length}
          </p>
        </div>
      )}

      {!loadingFetch && !errorFetch && filteredPlayers.length > 0 && (
        <div className="overflow-x-auto mx-auto shadow-sm rounded-xl">
          <table className="min-w-full rounded-xl overflow-hidden text-xs sm:text-sm md:text-base w-full">
            <thead className="bg-blue-700 text-white text-sm">
              <tr>
                <th className="p-2 sm:p-3 text-center">#</th>
                <th className="p-2 sm:p-3 text-center">الصورة</th>
                <th className="p-2 sm:p-3 text-center">الاسم</th>

                <th className="p-2 sm:p-3 text-center">النوع</th>
                <th className="p-2 sm:p-3 text-center">اللعبة</th>
                <th className="p-2 sm:p-3 text-center">المرحلة</th>
                <th className="p-2 sm:p-3 text-center">الكنيسة</th>
                <th className="p-2 sm:p-3 text-center">تاريخ الميلاد</th>
                <th className="p-2 sm:p-3 text-center">رقم التليفون</th>
                <th className="p-2 sm:p-3 text-center">الإستمارة</th>
                <th className="p-2 sm:p-3 text-center bg-green-700">
                  اسم الفريق
                </th>
                <th className="p-2 sm:p-3 text-center bg-red-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="text-blue-700 bg-white text-sm">
              {filteredPlayers.map((player, index) => (
                <tr
                  key={player.id}
                  className="border-t border-blue-300 hover:bg-blue-100 transition">
                  <td className="p-2 sm:p-3 text-center font-semibold bg-blue-50">
                    {index + 1}
                  </td>
                  <td className="p-2 sm:p-3 flex justify-center items-center text-center bg-blue-100">
                    <img
                      src={player.image}
                      alt={player.name}
                      className="w-full max-w-[80px] sm:max-w-[100px] md:max-w-[120px] h-auto object-contain rounded-md border-2 border-blue-700"
                    />
                  </td>
                  <td className="p-2 sm:p-3 font-bold text-center bg-blue-50">
                    {player.name}
                  </td>

                  <td className="p-2 sm:p-3 text-center bg-blue-100">
                    {player.gender}
                  </td>
                  <td className="p-2 sm:p-3 text-center bg-blue-50">
                    {player.game}
                  </td>
                  <td className="p-2 sm:p-3 text-center bg-blue-100">
                    {player.stage}
                  </td>
                  <td className="p-2 sm:p-3 text-center bg-blue-50">
                    {player.church}
                  </td>
                  <td className="p-2 sm:p-3 text-center bg-blue-100">
                    {player.birthdate}
                  </td>
                  <td className="p-2 sm:p-3 text-center font-mono bg-blue-50">
                    {player.phone}
                  </td>
                  <td className="p-2 sm:p-3 text-center bg-blue-100">
                    {player.form}
                  </td>
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
                      className="cursor-pointer">
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
        <div className="flex flex-col justify-center items-center gap-2 text-center">
          <p className="text-gray-500">
            <AlertIcon />
          </p>
          <p className="text-gray-500 text-xl font-semibold">
            لا يوجد لاعبين مسجلين بعد
          </p>
        </div>
      )}
    </div>
  );
}
