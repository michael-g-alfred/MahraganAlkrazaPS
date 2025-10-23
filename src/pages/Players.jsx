import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import toast from "react-hot-toast";
import AlertIcon from "../icons/AlertIcon";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [filter, setFilter] = useState({
    church: "",
    game: "",
    form: "",
    stage: "",
    team: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function handleDeleteItem(player) {
    if (window.confirm(`هل أنت متأكد من حذف ${player.name}؟`)) {
      const prevPlayers = [...players];
      setPlayers((prev) => prev.filter((p) => p.id !== player.id));

      fetch(
        `https://mahragan-alkraza-ps-default-rtdb.firebaseio.com/players/${player.id}.json`,
        { method: "DELETE" }
      )
        .then((res) => {
          if (!res.ok) throw new Error("فشل في الحذف");
          toast.success("تم حذف اللاعب بنجاح ✅");
        })
        .catch(() => {
          setPlayers(prevPlayers);
          toast.error("حدث خطأ أثناء الحذف ❌ - تم استرجاع اللاعب");
        });
    }
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(
      "https://mahragan-alkraza-ps-default-rtdb.firebaseio.com/players.json"
    )
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const playersArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setPlayers(playersArray);
        } else {
          setPlayers([]);
        }
        setLoading(false);
        setError(null);
      })
      .catch(() => {
        setPlayers([]);
        setError("فشل تحميل البيانات");
        setLoading(false);
      });
  }, []);

  const filteredPlayers = players.filter((p) => {
    if (filter.church && p.church !== filter.church) return false;
    if (filter.game && p.game !== filter.game) return false;
    if (filter.form && p.form !== filter.form) return false;
    if (filter.stage && p.stage !== filter.stage) return false;
    if (filter.team && p.team !== filter.team) return false;
    return true;
  });

  const churches = [...new Set(players.map((p) => p.church))];
  const games = [...new Set(players.map((p) => p.game))];
  const forms = [...new Set(players.map((p) => p.form))];
  const stages = [...new Set(players.map((p) => p.stage))];
  const teams = [...new Set(players.map((p) => p.team).filter(Boolean))];

  return (
    <div className="min-h-screen">
      <Header />
      {loading && (
        <div className="flex justify-center items-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
        </div>
      )}
      {!loading && error && (
        <div className="flex justify-center items-center  text-red-500 text-xl font-semibold">
          {error}
        </div>
      )}
      {!loading && !error && players.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <select
            className="border border-blue-700 rounded-lg p-2 text-blue-700 bg-blue-50"
            value={filter.church}
            onChange={(e) => setFilter({ ...filter, church: e.target.value })}>
            <option value="">كل الكنائس</option>
            {churches.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>

          <select
            className="border border-blue-700 rounded-lg p-2 text-blue-700 bg-blue-50"
            value={filter.form}
            onChange={(e) => setFilter({ ...filter, form: e.target.value })}>
            <option value="">كل المسابقات</option>
            {forms.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <select
            className="border border-blue-700 rounded-lg p-2 text-blue-700 bg-blue-50"
            value={filter.game}
            onChange={(e) => setFilter({ ...filter, game: e.target.value })}>
            <option value="">كل الألعاب</option>
            {games.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            className="border border-blue-700 rounded-lg p-2 text-blue-700 bg-blue-50"
            value={filter.stage}
            onChange={(e) => setFilter({ ...filter, stage: e.target.value })}>
            <option value="">كل المراحل</option>
            {stages.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <select
            className="border border-green-700 rounded-lg p-2 text-green-700 bg-green-50"
            value={filter.team}
            onChange={(e) => setFilter({ ...filter, team: e.target.value })}>
            <option value="">كل الفرق</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              setFilter({
                church: "",
                game: "",
                form: "",
                stage: "",
                team: "",
              })
            }
            className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition">
            مسح الفلاتر
          </button>
        </div>
      )}

      {!loading && !error && players.length > 0 && (
        <div className="text-center mb-4 space-y-2">
          <p className="text-blue-700 font-bold text-lg">
            عدد اللاعبين: {filteredPlayers.length}
          </p>
          {teams.length > 0 && (
            <p className="text-green-700 font-semibold">
              عدد الفرق المسجلة: {teams.length}
            </p>
          )}
        </div>
      )}

      {!loading && !error && filteredPlayers.length > 0 && (
        <div className="overflow-x-auto max-w-7xl mx-auto shadow-sm rounded-xl">
          <table className="min-w-full rounded-xl overflow-hidden text-xs sm:text-sm md:text-base w-full">
            <thead className="bg-blue-700 text-white text-sm">
              <tr>
                <th className="p-2 sm:p-3 text-center">#</th>
                <th className="p-2 sm:p-3 text-center">الصورة</th>
                <th className="p-2 sm:p-3 text-center">الاسم</th>

                <th className="p-2 sm:p-3 text-center">الكنيسة</th>
                <th className="p-2 sm:p-3 text-center">المسابقة</th>
                <th className="p-2 sm:p-3 text-center">اللعبة</th>
                <th className="p-2 sm:p-3 text-center">المرحلة</th>
                <th className="p-2 sm:p-3 text-center">تاريخ الميلاد</th>
                <th className="p-2 sm:p-3 text-center">رقم التليفون</th>
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
                  className="border-t border-blue-300 bg-blue-50 hover:bg-blue-100 transition">
                  <td className="p-2 sm:p-3 text-center font-semibold">
                    {index + 1}
                  </td>
                  <td className="p-2 sm:p-3 flex justify-center items-center text-center">
                    <img
                      src={player.image}
                      alt={player.name}
                      className="w-16 h-16 object-cover rounded-md border-2 border-blue-700"
                    />
                  </td>
                  <td className="p-2 sm:p-3 font-bold text-center">
                    {player.name}
                  </td>

                  <td className="p-2 sm:p-3 text-center">{player.church}</td>
                  <td className="p-2 sm:p-3 text-center">{player.form}</td>
                  <td className="p-2 sm:p-3 text-center">{player.game}</td>
                  <td className="p-2 sm:p-3 text-center">{player.stage}</td>
                  <td className="p-2 sm:p-3 text-center">{player.birthdate}</td>
                  <td className="p-2 sm:p-3 text-center font-mono">
                    {player.phone}
                  </td>
                  <td className="p-2 sm:p-3 text-center bg-green-50">
                    {player.team ? (
                      <span className="font-semibold text-green-800 bg-green-200 px-3 py-1 rounded-full">
                        {player.team}
                      </span>
                    ) : (
                      <span className="font-semibold text-green-700">فردي</span>
                    )}
                  </td>
                  <td className="p-2 sm:p-3 text-center">
                    <button
                      onClick={() => handleDeleteItem(player)}
                      className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition">
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && !error && players.length === 0 && (
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
