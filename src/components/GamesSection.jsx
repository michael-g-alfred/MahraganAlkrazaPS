import React from "react";
import divisions from "../data/divisions";
import generateMatches from "../utils/generateMatches";

export default function GameSection({ title, data }) {
  const boysSingle = data.filter(
    (p) => p.gender === "بنين" && p.form === "فردى"
  );

  const girlsSingle = data.filter(
    (p) => p.gender === "بنات" && p.form === "فردى"
  );

  const boysTeam = data.filter(
    (p) => p.gender === "بنين" && p.form === "جماعى"
  );

  const girlsTeam = data.filter(
    (p) => p.gender === "بنات" && p.form === "جماعى"
  );

  const [boysSingleMatches, setBoysSingleMatches] = React.useState([]);
  const [boysTeamMatches, setBoysTeamMatches] = React.useState([]);
  const [girlsSingleMatches, setGirlsSingleMatches] = React.useState([]);
  const [girlsTeamMatches, setGirlsTeamMatches] = React.useState([]);

  return (
    <div className="bg-white shadow-sm rounded-xl p-4 mb-8 border-2 border-blue-700">
      <h2 className="text-white font-bold text-xl mb-4 text-center bg-blue-700 rounded-full p-2">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6">
        {/* جدول بنين فردي */}
        <div className="border border-blue-500 rounded-lg p-3">
          <div className="flex justify-center mb-2 gap-2">
            <h3 className="text-blue-700 bg-blue-100 font-semibold flex-1 rounded-full text-center">
              بنين فردي
            </h3>
            <button
              onClick={() => setBoysSingleMatches(generateMatches(boysSingle))}
              disabled={boysSingle.length === 0}
              className={`text-white text-sm px-3 rounded-full transition cursor-pointer disabled:cursor-not-allowed ${
                boysSingle.length === 0
                  ? "bg-gray-300 text-gray-400"
                  : "bg-green-700 hover:bg-green-900"
              }`}>
              عمل قرعة
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-xl overflow-hidden text-xs sm:text-sm md:text-base w-full">
              <thead className="bg-blue-700 text-white text-sm">
                <tr>
                  <th className="p-2 ">#</th>
                  <th className="p-2 ">الاسم</th>
                  <th className="p-2 ">الكنيسة</th>
                </tr>
              </thead>
              <tbody>
                {boysSingle.map((player, index) => (
                  <tr
                    key={player.id}
                    className="border-t border-blue-300 hover:bg-blue-100 transition">
                    <td className="p-2 text-center font-semibold bg-blue-50">
                      {index + 1}
                    </td>
                    <td className="p-2 text-center bg-blue-100">
                      {player.name?.name || player.name}
                    </td>
                    <td className="p-2 text-center bg-blue-50">
                      {player.church?.name || player.church}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {boysSingleMatches.length > 0 && (
              <ul className="mt-3 list-disc list-inside text-blue-700">
                {boysSingleMatches.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* جدول بنين جماعي */}
        <div className="border border-blue-500 rounded-lg p-3">
          <div className="flex justify-center mb-2 gap-2">
            <h3 className="text-blue-700 bg-blue-100 font-semibold flex-1 rounded-full text-center">
              بنين جماعي
            </h3>
            <button
              onClick={() => setBoysTeamMatches(generateMatches(boysTeam))}
              disabled={boysTeam.length === 0}
              className={`text-white text-sm px-3 rounded-full transition cursor-pointer disabled:cursor-not-allowed ${
                boysTeam.length === 0
                  ? "bg-gray-300 text-gray-400"
                  : "bg-green-700 hover:bg-green-900"
              }`}>
              عمل قرعة
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-xl overflow-hidden text-xs sm:text-sm md:text-base w-full">
              <thead className="bg-blue-700 text-white text-sm">
                <tr>
                  <th className="p-2 ">#</th>
                  <th className="p-2 ">الكنيسة</th>
                  <th className="p-2 ">الفريق</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...new Map(
                    boysTeam.map((p) => [p.team?.name || p.team, p])
                  ).values(),
                ].map((player, index) => (
                  <tr
                    key={index}
                    className="border-t border-blue-300 hover:bg-blue-100 transition">
                    <td className="p-2 text-center font-semibold bg-blue-50">
                      {index + 1}
                    </td>
                    <td className="p-2 text-center bg-blue-100">
                      {player.church?.name || player.church || "-"}
                    </td>
                    <td className="p-2 text-center bg-blue-50">
                      {player.team?.name || player.team}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {boysTeamMatches.length > 0 && (
              <ul className="mt-3 list-disc list-inside text-blue-700">
                {boysTeamMatches.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* جدول بنات فردي */}
        <div className="border border-blue-500 rounded-lg p-3">
          <div className="flex justify-center mb-2 gap-2">
            <h3 className="text-blue-700 bg-blue-100 font-semibold flex-1 rounded-full text-center">
              بنات فردي
            </h3>
            <button
              onClick={() =>
                setGirlsSingleMatches(generateMatches(girlsSingle))
              }
              disabled={girlsSingle.length === 0}
              className={`text-white text-sm px-3 rounded-full transition cursor-pointer disabled:cursor-not-allowed ${
                girlsSingle.length === 0
                  ? "bg-gray-300 text-gray-400"
                  : "bg-green-700 hover:bg-green-900"
              }`}>
              عمل قرعة
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-xl overflow-hidden text-xs sm:text-sm md:text-base w-full">
              <thead className="bg-blue-700 text-white text-sm">
                <tr>
                  <th className="p-2 ">#</th>
                  <th className="p-2 ">الاسم</th>
                  <th className="p-2 ">الكنيسة</th>
                </tr>
              </thead>
              <tbody>
                {girlsSingle.map((player, index) => (
                  <tr
                    key={player.id}
                    className="border-t border-blue-300 hover:bg-blue-100 transition">
                    <td className="p-2 text-center font-semibold bg-blue-50">
                      {index + 1}
                    </td>
                    <td className="p-2 text-center bg-blue-100">
                      {player.name?.name || player.name}
                    </td>
                    <td className="p-2 text-center bg-blue-50">
                      {player.church?.name || player.church}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {girlsSingleMatches.length > 0 && (
              <ul className="mt-3 list-disc list-inside text-blue-700">
                {girlsSingleMatches.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* جدول بنات جماعي */}
        <div className="border border-blue-500 rounded-lg p-3">
          <div className="flex justify-center mb-2 gap-2">
            <h3 className="text-blue-700 bg-blue-100 font-semibold flex-1 rounded-full text-center">
              بنات جماعي
            </h3>
            <button
              onClick={() => setGirlsTeamMatches(generateMatches(girlsTeam))}
              disabled={girlsTeam.length === 0}
              className={`text-white text-sm px-3 rounded-full transition cursor-pointer disabled:cursor-not-allowed ${
                girlsTeam.length === 0
                  ? "bg-gray-300 text-gray-400"
                  : "bg-green-700 hover:bg-green-900"
              }`}>
              عمل قرعة
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-xl overflow-hidden text-xs sm:text-sm md:text-base w-full">
              <thead className="bg-blue-700 text-white text-sm">
                <tr>
                  <th className="p-2 ">#</th>
                  <th className="p-2 ">الكنيسة</th>
                  <th className="p-2 ">الفريق</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...new Map(
                    girlsTeam.map((p) => [p.team?.name || p.team, p])
                  ).values(),
                ].map((player, index) => (
                  <tr
                    key={index}
                    className="border-t border-blue-300 hover:bg-blue-100 transition">
                    <td className="p-2 text-center font-semibold bg-blue-50">
                      {index + 1}
                    </td>
                    <td className="p-2 text-center bg-blue-100">
                      {player.church?.name || player.church || "-"}
                    </td>
                    <td className="p-2 text-center bg-blue-50">
                      {player.team?.name || player.team}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {girlsTeamMatches.length > 0 && (
              <ul className="mt-3 list-disc list-inside text-blue-700">
                {girlsTeamMatches.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
