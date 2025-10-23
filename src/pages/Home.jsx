import React, { useState } from "react";
import StepHeader from "../components/StepHeader";
import form from "../data/form";
import Header from "../components/Header";
import SelectCard from "../components/SelectCard";
import stages from "../data/stages";
import games from "../data/games";
import churches from "../data/churches";
import Single from "../pages/Single";
import Team from "../pages/Team";

export default function Home() {
  const [selection, setSelection] = useState({
    stage: null,
    game: null,
    church: null,
    form: null,
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="px-6 pb-12">
        {/* Step 1: اختر المرحلة */}
        <div className="mb-12">
          <StepHeader step={1} title="اختر المرحلة" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {stages.map((stage, i) => (
              <SelectCard
                key={i}
                isSelected={selection.stage === stage}
                onClick={() => {
                  setSelection({
                    stage: stage,
                    game: null,
                    church: null,
                    form: null,
                  });
                }}>
                <div>{stage.name}</div>
                <div className="text-sm text-gray-500">{stage.age}</div>
              </SelectCard>
            ))}
          </div>
        </div>

        {/* Step 2: اختر اللعبة */}
        {selection.stage && (
          <div className="mb-12">
            <StepHeader step={2} title="اختر اللعبة" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {games.map((game, i) => (
                <SelectCard
                  key={i}
                  isSelected={selection.game === game}
                  onClick={() => {
                    setSelection({
                      ...selection,
                      game: game,
                      church: null,
                      form: null,
                    });
                  }}>
                  {game.name}
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: اختر الكنيسة */}
        {selection.game && (
          <div className="mb-12">
            <StepHeader step={3} title="اختر الكنيسة" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {churches.map((church, i) => (
                <SelectCard
                  key={i}
                  isSelected={selection.church === church}
                  onClick={() => {
                    setSelection({
                      ...selection,
                      church: church,
                      form: null,
                    });
                  }}>
                  {church.name}
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: اختر نوع الإستمارة */}
        {selection.church && (
          <div className="mb-12">
            <StepHeader step={4} title="اختر نوع الإستمارة" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-7xl mx-auto">
              {(selection.game &&
              (selection.game.name === "كرة قدم" ||
                selection.game.name === "كرة الطائرة")
                ? form.filter((f) => f.name === "جماعى")
                : selection.game.name === "جرى تتابع"
                ? form.filter((f) => f.name === "فردى")
                : form
              ).map((f, i) => (
                <SelectCard
                  key={i}
                  isSelected={selection.form === f}
                  onClick={() => setSelection({ ...selection, form: f })}>
                  {f.name}
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {/* عرض مكون Single إذا كانت الاستمارة فردية */}
        {selection?.form?.name === "فردى" && (
          <Single data={selection} onUpdateSelection={setSelection} />
        )}
        {/* عرض مكون Team إذا كانت الاستمارة جماعية */}
        {selection?.form?.name === "جماعى" && (
          <Team data={selection} onUpdateSelection={setSelection} />
        )}
      </div>
    </div>
  );
}
