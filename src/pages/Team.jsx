import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addPlayer } from "../redux/features/PlayerSlice";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Loader from "../components/Loader";
import useFetch from "../hooks/useFetch";

const BASE_URL = import.meta.env.VITE_FIREBASE_URL;

export default function Team({ data, onUpdateSelection }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [players, setPlayers] = useState([]);

  const [loadingFetch, errorFetch, playersData] = useFetch();

  const teamsArr = [...new Set(playersData.map((t) => t.team).filter(Boolean))];

  // إنشاء الفورمات الفارغة بعد تحديد العدد
  const handleGeneratePlayers = () => {
    const newPlayers = Array.from({ length: playerCount }, () => ({
      name: "",
      phone: "",
      birthdate: "",
      imageUrl: null,
    }));
    setPlayers(newPlayers);
  };

  const handlePlayerChange = (index, field, value) => {
    setPlayers((prev) =>
      prev.map((player, i) =>
        i === index ? { ...player, [field]: value } : player
      )
    );
  };

  const handleImageChange = (index, url) => {
    setPlayers((prev) =>
      prev.map((player, i) =>
        i === index ? { ...player, imageUrl: url } : player
      )
    );
  };

  const isTeamValid =
    teamName &&
    !teamsArr.includes(teamName) &&
    players.length > 0 &&
    players.every((p) => p.name && p.phone && p.birthdate && p.imageUrl) &&
    !loading;

  async function saveTeam() {
    setLoading(true);
    try {
      for (const player of players) {
        const playerData = {
          name: player.name,
          image: player.imageUrl || "",
          gender: data?.gender?.name || "",
          game: data?.game?.name || "",
          stage: data?.stage?.name || "",
          church: data?.church?.name || "",
          phone: player.phone,
          birthdate: player.birthdate,
          form: data?.form?.name || "",
          team: teamName,
        };

        const response = await fetch(`${BASE_URL}/players.json`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(playerData),
        });

        if (!response.ok) throw new Error("Failed to save team data");

        dispatch(addPlayer(playerData));
      }

      toast.success("تم حفظ الفريق بالكامل بنجاح 🎉");
      if (onUpdateSelection) {
        onUpdateSelection({
          gender: null,
          game: null,
          stage: null,
          church: null,
          form: null,
        });
      }
      setTeamName("");
      setPlayers([]);
      setPlayerCount(1);
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الفريق ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="max-w-5xl mx-auto border-2 border-blue-700 p-6 rounded-3xl bg-white/80 backdrop-blur-lg grid gap-6"
      dir="rtl">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <div className="mb-2">
            <span className="text-blue-700 font-semibold">اسم الفريق </span>

            {loadingFetch ? (
              <Loader size={4} />
            ) : errorFetch ? (
              <div className="text-red-500">{errorFetch}</div>
            ) : (
              playersData.length > 0 && (
                <div className="text-gray-500 italic">
                  الفرق المسجلة مسبقًا: (
                  <span className="font-bold">{teamsArr.join(", ")}</span>) —
                  اختر اسمًا جديدًا لا يكون اسم كنيسة.
                </div>
              )
            )}
          </div>
          <input
            type="text"
            placeholder="لا يكون اسم كنيسة - مثال: المحبة"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-700"
          />
        </label>

        <label className="flex flex-col gap-2" dir="rtl">
          <div className="mb-2 text-blue-700 font-semibold">
            عدد اللاعبين بالفريق
          </div>
          <input
            type="number"
            min="2"
            max="12"
            pattern=""
            placeholder="عدد اللاعبين بالفريق (٢: ١٢) بالإنجليزية"
            value={playerCount}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[1-9]*$/.test(value)) {
                setPlayerCount(value);
              }
            }}
            className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-700"
          />
        </label>

        <button
          onClick={handleGeneratePlayers}
          disabled={!teamName || playerCount < 2}
          className={`p-3 rounded-lg font-semibold transition ${
            !teamName || playerCount < 2
              ? "bg-gray-300 text-gray-400 cursor-not-allowed"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}>
          تسجيل اللاعبين
        </button>
      </div>

      {teamName && playerCount > 0 && players.length > 0 && (
        <>
          {players.map((player, index) => (
            <div key={index} className="mb-4">
              <Card
                formData={player}
                handleInputChange={(e) =>
                  handlePlayerChange(index, e.target.name, e.target.value)
                }
                handleImageChange={(url) => handleImageChange(index, url)}
              />
              {index < players.length - 1 && (
                <hr className="mt-4 border-t-2 border-gray-500" />
              )}
            </div>
          ))}
        </>
      )}

      {players.length > 0 && (
        <button
          onClick={saveTeam}
          disabled={!isTeamValid}
          className={`rounded-lg p-4 font-semibold transition ${
            !isTeamValid
              ? "bg-gray-300 text-gray-400 cursor-not-allowed"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}>
          {loading ? "جارٍ الحفظ..." : "حفظ الفريق"}
        </button>
      )}
    </div>
  );
}
