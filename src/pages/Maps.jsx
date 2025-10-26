import React, { useState } from "react";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import GameSection from "../components/GamesSection";
import useFetch from "../hooks/useFetch";
import SelectBox from "../components/SelectBox";
import AlertIcon from "../icons/AlertIcon";

export default function Games() {
  const [loadingFetch, errorFetch, players] = useFetch();
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedGame, setSelectedGame] = useState("");

  const games = [
    ...new Set(
      players.map((p) => (typeof p.game === "object" ? p.game.name : p.game))
    ),
  ];

  const filteredStages = [
    ...new Set(
      players
        .filter(
          (p) =>
            (typeof p.game === "object" ? p.game.name : p.game) === selectedGame
        )
        .map((p) => (typeof p.stage === "object" ? p.stage.name : p.stage))
    ),
  ];

  return (
    <div className="min-h-screen">
      {loadingFetch && (
        <div className="flex justify-center items-center">
          <Loader />
        </div>
      )}

      {!loadingFetch && errorFetch && (
        <div className="flex justify-center items-center text-red-500 text-xl font-semibold">
          {errorFetch}
        </div>
      )}

      {!loadingFetch && !errorFetch && players.length > 0 && (
        <div className="mx-auto flex justify-center items-center gap-4 mb-6">
          <SelectBox
            label="اختر اللعبة"
            value={selectedGame}
            onChange={(e) => {
              setSelectedGame(e.target.value);
              setSelectedStage("");
            }}
            options={games}
          />
          <SelectBox
            label="اختر المرحلة"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            options={filteredStages}
          />
        </div>
      )}

      {selectedGame && selectedStage && (
        <GameSection
          title={`${selectedGame} - ${selectedStage}`}
          data={players.filter(
            (p) =>
              (typeof p.stage === "object" ? p.stage.name : p.stage) ===
                selectedStage &&
              (typeof p.game === "object" ? p.game.name : p.game) ===
                selectedGame
          )}
        />
      )}

      {!loadingFetch && !errorFetch && players.length === 0 && (
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
