import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addPlayer } from "../redux/features/PlayerSlice";
import toast from "react-hot-toast";
import Card from "../components/Card";

export default function Team({ data, onUpdateSelection }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [players, setPlayers] = useState([]);

  // إنشاء الفورمات الفارغة بعد تحديد العدد
  const handleGeneratePlayers = () => {
    console.log("Generating players:", playerCount);
    const newPlayers = Array.from({ length: playerCount }, () => ({
      name: "",
      phone: "",
      birthdate: "",
      imageUrl: null,
    }));
    setPlayers(newPlayers);
    console.log("Players generated:", newPlayers);
  };

  const handlePlayerChange = (index, field, value) => {
    console.log("Changing player:", index, field, value);
    setPlayers((prev) =>
      prev.map((player, i) =>
        i === index ? { ...player, [field]: value } : player
      )
    );
  };

  const handleImageChange = (index, url) => {
    console.log("Changing image for player:", index, url);
    setPlayers((prev) =>
      prev.map((player, i) =>
        i === index ? { ...player, imageUrl: url } : player
      )
    );
  };

  const isTeamValid =
    teamName &&
    players.length > 0 &&
    players.every((p) => p.name && p.phone && p.birthdate && p.imageUrl) &&
    !loading;

  async function saveTeam() {
    console.log("Saving team:", teamName, players);
    setLoading(true);
    try {
      for (const player of players) {
        const playerData = {
          name: player.name,
          phone: player.phone,
          birthdate: player.birthdate,
          church: data?.church?.name || "",
          game: data?.game?.name || "",
          stage: data?.stage?.name || "",
          image: player.imageUrl,
          form: data?.form?.name || "",
          team: teamName,
        };

        console.log("Saving player:", playerData);

        const response = await fetch(
          "https://mahragan-alkraza-ps-default-rtdb.firebaseio.com/players.json",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(playerData),
          }
        );

        if (!response.ok) throw new Error("Failed to save team data");

        dispatch(addPlayer(playerData));
        console.log("Player saved successfully:", player.name);
      }

      toast.success("تم حفظ الفريق بالكامل بنجاح 🎉");
      if (onUpdateSelection) {
        onUpdateSelection({
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
      console.error("Error saving team:", error);
      toast.error("حدث خطأ أثناء حفظ الفريق ❌");
    } finally {
      setLoading(false);
      console.log("Finished saving team");
    }
  }

  return (
    <div
      className="max-w-5xl mx-auto border-2 border-blue-700 p-6 rounded-3xl bg-white/80 backdrop-blur-lg grid gap-6"
      dir="rtl">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="mb-2 text-blue-700 font-semibold">
            اسم الفريق{" "}
            <span className="text-red-600">
              (يجب أن يكون مميز وليس باسم كنيسة)
            </span>
          </span>
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
