import React, { useState, useMemo, useEffect } from "react";
import usePlayerSave from "../hooks/usePlayerSave";
import Card from "../components/Card";
import Loader from "../components/Loader";
import useFetch from "../hooks/useFetch";

export default function Team({ data, onUpdateSelection }) {
  const { loading, saveTeam } = usePlayerSave(data, onUpdateSelection);
  const [teamName, setTeamName] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [players, setPlayers] = useState([]);

  const [loadingFetch, errorFetch, playersData] = useFetch();

  const teamsArr = useMemo(
    () => [...new Set(playersData.map((t) => t.team).filter(Boolean))],
    [playersData]
  );

  const parsedCount = parseInt(playerCount, 10);
  const countIsValid = !isNaN(parsedCount) && parsedCount >= 2 && parsedCount <= 12;

  // ✅ Reset players array when playerCount changes
  useEffect(() => {
    setPlayers([]);
  }, [playerCount]);

  const handleGeneratePlayers = () => {
    const newPlayers = Array.from({ length: parsedCount }, () => ({
      name: "",
      phone: "",
      birthdate: "",
      imageUrl: null,
    }));
    setPlayers(newPlayers);
  };

  const handlePlayerChange = (index, field, value) => {
    setPlayers((prev) =>
      prev.map((player, i) => (i === index ? { ...player, [field]: value } : player))
    );
  };

  const handleImageChange = (index, url) => {
    setPlayers((prev) =>
      prev.map((player, i) => (i === index ? { ...player, imageUrl: url } : player))
    );
  };

  const isTeamValid =
    teamName.trim() &&
    !teamsArr.includes(teamName.trim()) &&
    players.length >= 2 &&
    players.every((p) => p.name?.trim() && p.phone?.trim() && p.birthdate && p.imageUrl) &&
    !loading;

  const handleSave = async () => {
    await saveTeam(players, teamName.trim());
    setTeamName("");
    setPlayers([]);
    setPlayerCount("");
  };

  return (
    <div
      className="max-w-5xl mx-auto border-2 border-blue-700 p-6 rounded-3xl bg-white/80 backdrop-blur-lg grid gap-6"
      dir="rtl"
      aria-label="استمارة تسجيل فريق"
    >
      <div className="flex flex-col gap-4">
        {/* Team name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="teamName" className="text-blue-700 font-semibold">
            اسم الفريق
          </label>

          {loadingFetch ? (
            <Loader size={4} />
          ) : errorFetch ? (
            <p role="alert" className="text-red-500 text-sm">{errorFetch}</p>
          ) : (
            teamsArr.length > 0 && (
              <p className="text-gray-500 italic text-sm">
                الفرق المسجلة مسبقًا: (
                <span className="font-bold">{teamsArr.join(", ")}</span>) —
                اختر اسمًا جديدًا لا يكون اسم كنيسة.
              </p>
            )
          )}

          <input
            id="teamName"
            type="text"
            placeholder="لا يكون اسم كنيسة - مثال: المحبة"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-700"
          />

          {teamsArr.includes(teamName.trim()) && teamName.trim() && (
            <p role="alert" className="text-red-500 text-sm">
              هذا الاسم مستخدم بالفعل، اختر اسمًا آخر.
            </p>
          )}
        </div>

        {/* Player count */}
        <div className="flex flex-col gap-2">
          <label htmlFor="playerCount" className="text-blue-700 font-semibold">
            عدد اللاعبين بالفريق (من 2 إلى 12)
          </label>
          <input
            id="playerCount"
            type="number"
            min="2"
            max="12"
            placeholder="أدخل عدد اللاعبين (2 – 12)"
            value={playerCount}
            onChange={(e) => setPlayerCount(e.target.value)}
            className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-700"
          />
          {playerCount && !countIsValid && (
            <p role="alert" className="text-red-500 text-sm">
              العدد يجب أن يكون بين 2 و 12.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleGeneratePlayers}
          disabled={!teamName.trim() || !countIsValid}
          className={`p-3 rounded-lg font-semibold transition ${
            !teamName.trim() || !countIsValid
              ? "bg-gray-300 text-gray-400 cursor-not-allowed"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}
        >
          تسجيل اللاعبين
        </button>
      </div>

      {players.length > 0 && (
        <>
          {players.map((player, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-blue-700 font-bold mb-3">
                اللاعب {index + 1}
              </h3>
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

          <button
            type="button"
            onClick={handleSave}
            disabled={!isTeamValid}
            aria-disabled={!isTeamValid}
            className={`rounded-lg p-4 font-semibold transition ${
              !isTeamValid
                ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
          >
            {loading ? "جارٍ الحفظ..." : "حفظ الفريق"}
          </button>
        </>
      )}
    </div>
  );
}
