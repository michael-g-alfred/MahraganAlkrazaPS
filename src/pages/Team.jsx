import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPlayer } from "../redux/features/PlayerSlice";
import toast from "react-hot-toast";
import Card from "../components/Card";

const BASE_URL = import.meta.env.VITE_FIREBASE_URL;

export default function Team({ data, onUpdateSelection }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [players, setPlayers] = useState([]);

  const [teamsData, setTeamsData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState(null);

  const teamsArr = [...new Set(teamsData.map((t) => t.team).filter(Boolean))];

  useEffect(() => {
    setLoadingData(true);
    setErrorData(null);

    const BASE_URL = import.meta.env.VITE_FIREBASE_URL;
    fetch(`${BASE_URL}/players.json`)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then((data) => {
        if (data) {
          const playersArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setTeamsData(playersArray);
        } else {
          setTeamsData([]);
        }
        setLoadingData(false);
        setErrorData(null);
      })
      .catch(() => {
        setTeamsData([]);
        setErrorData("فشل تحميل أسماء الفرق المسجلة");
        setLoadingData(false);
      });
  }, []);

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
          stage: data?.stage?.name || "",
          game: data?.game?.name || "",
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
          stage: null,
          game: null,
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

            {loadingData ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
            ) : errorData ? (
              <div className="text-red-500">{errorData}</div>
            ) : (
              teamsArr.length > 0 && (
                <div className="text-gray-500 italic">
                  الفرق المسجلة مسبقًا: (
                  <span className="font-bold">{teamsArr.join(", ")}</span>) —
                  اختر اسمًا جديدًا للفرق.
                </div>
              )
            )}
          </div>
          <input
            type="text"
            placeholder="اسم الفريق"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-700"
          />
        </label>

        <input
          type="number"
          min="1"
          max="12"
          placeholder="عدد اللاعبين"
          value={playerCount}
          onChange={(e) => setPlayerCount(Number(e.target.value))}
          className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-700"
        />

        <button
          onClick={handleGeneratePlayers}
          disabled={!teamName || playerCount < 1}
          className={`p-3 rounded-lg font-semibold transition ${
            !teamName || playerCount < 1
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
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
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}>
          {loading ? "جارٍ الحفظ..." : "حفظ الفريق"}
        </button>
      )}
    </div>
  );
}
