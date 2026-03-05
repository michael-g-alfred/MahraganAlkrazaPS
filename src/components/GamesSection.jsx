import React, { memo } from "react";
import generateMatches from "../utils/generateMatches";

const GameTable = memo(function GameTable({
  title,
  players,
  isTeam,
  matches,
  onDraw,
}) {
  const isEmpty = players.length === 0;

  return (
    <div className="border border-blue-500 rounded-lg p-3">
      <div className="flex justify-center mb-2 gap-2">
        <h3 className="text-blue-700 bg-blue-100 font-semibold flex-1 rounded-full text-center py-1">
          {title}
        </h3>
        <button
          onClick={onDraw}
          disabled={isEmpty}
          aria-label={`عمل قرعة ${title}`}
          className={`text-white text-sm px-3 rounded-full transition ${
            isEmpty
              ? "bg-gray-300 text-gray-400 cursor-not-allowed"
              : "bg-green-700 hover:bg-green-900 cursor-pointer"
          }`}
        >
          عمل قرعة
        </button>
      </div>

      <div className="overflow-x-auto">
        <table
          className="min-w-full rounded-xl overflow-hidden text-xs sm:text-sm md:text-base w-full"
          aria-label={`جدول ${title}`}
        >
          <thead className="bg-blue-700 text-white text-sm">
            <tr>
              <th scope="col" className="p-2">#</th>
              {isTeam ? (
                <>
                  <th scope="col" className="p-2">الكنيسة</th>
                  <th scope="col" className="p-2">الفريق</th>
                </>
              ) : (
                <>
                  <th scope="col" className="p-2">الاسم</th>
                  <th scope="col" className="p-2">الكنيسة</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {isTeam
              ? [...new Map(players.map((p) => [p.team, p])).values()].map(
                  (player, index) => (
                    <tr key={index} className="border-t border-blue-300 hover:bg-blue-100 transition">
                      <td className="p-2 text-center font-semibold bg-blue-50">{index + 1}</td>
                      <td className="p-2 text-center bg-blue-100">{player.church || "-"}</td>
                      <td className="p-2 text-center bg-blue-50">{player.team}</td>
                    </tr>
                  )
                )
              : players.map((player, index) => (
                  <tr key={player.id} className="border-t border-blue-300 hover:bg-blue-100 transition">
                    <td className="p-2 text-center font-semibold bg-blue-50">{index + 1}</td>
                    <td className="p-2 text-center bg-blue-100">{player.name}</td>
                    <td className="p-2 text-center bg-blue-50">{player.church}</td>
                  </tr>
                ))}
          </tbody>
        </table>

        {matches.length > 0 && (
          <ul className="mt-3 list-disc list-inside text-blue-700" aria-label={`نتائج قرعة ${title}`}>
            {matches.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

export default function GameSection({ title, data }) {
  const [boysSingleMatches, setBoysSingleMatches] = React.useState([]);
  const [boysTeamMatches, setBoysTeamMatches] = React.useState([]);
  const [girlsSingleMatches, setGirlsSingleMatches] = React.useState([]);
  const [girlsTeamMatches, setGirlsTeamMatches] = React.useState([]);

  const boysSingle = data.filter((p) => p.gender === "بنين" && p.form === "فردى");
  const girlsSingle = data.filter((p) => p.gender === "بنات" && p.form === "فردى");
  const boysTeam   = data.filter((p) => p.gender === "بنين" && p.form === "جماعى");
  const girlsTeam  = data.filter((p) => p.gender === "بنات" && p.form === "جماعى");

  return (
    <div className="bg-white shadow-sm rounded-xl p-4 mb-8 border-2 border-blue-700">
      <h2 className="text-white font-bold text-xl mb-4 text-center bg-blue-700 rounded-full p-2">
        {title}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GameTable title="بنين فردي" players={boysSingle} isTeam={false} matches={boysSingleMatches} onDraw={() => setBoysSingleMatches(generateMatches(boysSingle, false))} />
        <GameTable title="بنين جماعي" players={boysTeam} isTeam={true} matches={boysTeamMatches} onDraw={() => setBoysTeamMatches(generateMatches(boysTeam, true))} />
        <GameTable title="بنات فردي" players={girlsSingle} isTeam={false} matches={girlsSingleMatches} onDraw={() => setGirlsSingleMatches(generateMatches(girlsSingle, false))} />
        <GameTable title="بنات جماعي" players={girlsTeam} isTeam={true} matches={girlsTeamMatches} onDraw={() => setGirlsTeamMatches(generateMatches(girlsTeam, true))} />
      </div>
    </div>
  );
}
