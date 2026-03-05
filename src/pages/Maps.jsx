import React, { useState, useMemo } from "react";
import Loader from "../components/Loader";
import GameSection from "../components/GamesSection";
import useFetch from "../hooks/useFetch";
import SelectBox from "../components/SelectBox";
import AlertIcon from "../icons/AlertIcon";

export default function Maps() {
  const [loadingFetch, errorFetch, players] = useFetch();
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedGame, setSelectedGame] = useState("");

  // Fields are plain strings after normalization in useFetch
  const games = useMemo(
    () => [...new Set(players.map((p) => p.game).filter(Boolean))],
    [players]
  );

  const filteredStages = useMemo(
    () =>
      [
        ...new Set(
          players
            .filter((p) => p.game === selectedGame)
            .map((p) => p.stage)
            .filter(Boolean)
        ),
      ],
    [players, selectedGame]
  );

  const filteredData = useMemo(
    () =>
      players.filter(
        (p) => p.stage === selectedStage && p.game === selectedGame
      ),
    [players, selectedStage, selectedGame]
  );

  return (
    <div className="min-h-screen">
      {loadingFetch && (
        <div className="flex justify-center items-center py-12" role="status" aria-label="جاري التحميل">
          <Loader />
        </div>
      )}

      {!loadingFetch && errorFetch && (
        <div role="alert" className="flex justify-center items-center text-red-500 text-xl font-semibold py-12">
          {errorFetch}
        </div>
      )}

      {!loadingFetch && !errorFetch && players.length > 0 && (
        <div
          className="mx-auto flex justify-center items-center gap-4 mb-6"
          role="search"
          aria-label="تصفية الألعاب والمراحل"
        >
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
          data={filteredData}
        />
      )}

      {!loadingFetch && !errorFetch && players.length === 0 && (
        <div
          className="flex flex-col justify-center items-center gap-2 text-center py-16"
          role="status"
        >
          <span className="text-gray-500" aria-hidden="true">
            <AlertIcon />
          </span>
          <p className="text-gray-500 text-xl font-semibold">
            لا يوجد لاعبين مسجلين بعد
          </p>
        </div>
      )}
    </div>
  );
}
