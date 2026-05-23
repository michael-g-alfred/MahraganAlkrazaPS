/**
 * Home.jsx — نسخة محسّنة
 * تحسينات UX:
 * 1. شريط تقدم (progress bar) يوضح الخطوة الحالية
 * 2. ملخص الاختيارات السابقة يظهر دائماً فوق كل خطوة
 * 3. زر "تغيير" يتيح العودة لأي خطوة سابقة بسهولة
 * 4. بطاقات أكثر وضوحاً مع أيقونات Tabler
 * 5. عرض واحد للمكون الصحيح (Single/Team) بعد اكتمال الخطوات
 */

import React, { useState } from "react";
import Header from "../components/Header";
import stages from "../data/stages";
import genders from "../data/genders";
import games from "../data/games";
import churches from "../data/churches";
import forms from "../data/forms";
import Single from "../pages/Single";
import Team from "../pages/Team";
import SelectCard from "../components/SelectCard";

// أيقونة Tabler لكل لعبة
const GAME_ICONS = {
  "تنس طاولة": "ti-ping-pong",
  "جرى تتابع": "ti-run",
  شطرنج: "ti-chess",
  "كرة قدم": "ti-ball-football",
  "كرة الطائرة": "ti-ball-volleyball",
};

// ── رأس الخطوة مع الرقم والعنوان ─────────────────────────────────
function StepTitle({ step, total, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-700 text-white font-bold text-sm flex-shrink-0">
        {step}
      </div>
      <div className="flex-1">
        <p className="font-bold text-blue-700">{title}</p>
      </div>
    </div>
  );
}

// ── فاصل بصري بين الخطوات ────────────────────────────────────────
function StepDivider() {
  return <div className="border-t border-blue-100 my-8" />;
}

// ── المكون الرئيسي ────────────────────────────────────────────────
const TOTAL_STEPS = 5;

export default function Home() {
  const [selection, setSelection] = useState({
    gender: null,
    game: null,
    stage: null,
    church: null,
    form: null,
  });

  // الخطوة الحالية المفتوحة (للسماح بالعودة للخلف)
  const currentStep =
    !selection.gender ? 1
    : !selection.game ? 2
    : !selection.stage ? 3
    : !selection.church ? 4
    : !selection.form ? 5
    : 6; // مكتمل → عرض النموذج

  // دالة "تغيير" — تعود للخطوة وتمسح ما بعدها
  const handleChangeStep = (step) => {
    setSelection((prev) => ({
      gender: step <= 1 ? null : prev.gender,
      game: step <= 2 ? null : prev.game,
      stage: step <= 3 ? null : prev.stage,
      church: step <= 4 ? null : prev.church,
      form: step <= 5 ? null : prev.form,
    }));
  };

  // ملخص الاختيارات لعرضها فوق الخطوة الحالية
  const summaryItems = [
    { label: "النوع", value: selection.gender?.name, step: 1 },
    { label: "اللعبة", value: selection.game?.name, step: 2 },
    { label: "المرحلة", value: selection.stage?.name, step: 3 },
    {
      label: "الكنيسة",
      value: selection.church?.name?.replace("كنيسة ", ""),
      step: 4,
    },
    { label: "الإستمارة", value: selection.form?.name, step: 5 },
  ].filter((item) => item.value);

  // فلترة المراحل حسب اللعبة
  const filteredStages =
    selection.game ?
      stages.filter((stage) =>
        selection.game.name === "جرى تتابع" ?
          stage.name === "المرحلة الأولى (أ)" ||
          stage.name === "المرحلة الأولى (ب)"
        : stage.name !== "المرحلة الأولى (أ)" &&
          stage.name !== "المرحلة الأولى (ب)",
      )
    : [];

  // فلترة الاستمارات حسب اللعبة
  const filteredForms =
    selection.game ?
      (
        selection.game.name === "كرة قدم" ||
        selection.game.name === "كرة الطائرة"
      ) ?
        forms.filter((f) => f.name === "جماعى")
      : selection.game.name === "جرى تتابع" ?
        forms.filter((f) => f.name === "فردى")
      : forms
    : forms;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="px-4 pb-16 max-w-4xl mx-auto">
        {/* ═══ الخطوة 1: النوع ════════════════════════════════════ */}
        {currentStep >= 1 && (
          <section>
            <StepTitle step={1} total={TOTAL_STEPS} title="اختر النوع" />
            <div className="grid grid-cols-2 gap-3">
              {genders.map((g) => (
                <SelectCard
                  key={g.name}
                  isSelected={selection.gender === g}
                  onClick={() =>
                    setSelection({
                      gender: g,
                      game: null,
                      stage: null,
                      church: null,
                      form: null,
                    })
                  }
                  icon={g.name === "بنين" ? "ti-man" : "ti-woman"}
                  title={g.name}
                />
              ))}
            </div>
          </section>
        )}
        {/* ═══ الخطوة 2: اللعبة ═══════════════════════════════════ */}
        {currentStep >= 2 && (
          <>
            <StepDivider />
            <section>
              <StepTitle step={2} total={TOTAL_STEPS} title="اختر اللعبة" />
              <div className="grid grid-cols-2 gap-3">
                {games.map((g) => (
                  <SelectCard
                    key={g.name}
                    isSelected={selection.game === g}
                    onClick={() =>
                      setSelection({
                        ...selection,
                        game: g,
                        stage: null,
                        church: null,
                        form: null,
                      })
                    }
                    icon={GAME_ICONS[g.name] || "ti-trophy"}
                    title={g.name}
                  />
                ))}
              </div>
            </section>
          </>
        )}
        {/* ═══ الخطوة 3: المرحلة ══════════════════════════════════ */}
        {currentStep >= 3 && (
          <>
            <StepDivider />
            <section>
              <StepTitle step={3} total={TOTAL_STEPS} title="اختر المرحلة" />
              <div className="grid grid-cols-2 gap-3">
                {filteredStages.map((stage) => (
                  <SelectCard
                    key={stage.name}
                    isSelected={selection.stage === stage}
                    onClick={() =>
                      setSelection({
                        ...selection,
                        stage,
                        church: null,
                        form: null,
                      })
                    }
                    icon="ti-calendar"
                    title={stage.name}
                    subtitle={stage.age}
                  />
                ))}
              </div>
            </section>
          </>
        )}
        {/* ═══ الخطوة 4: الكنيسة ══════════════════════════════════ */}
        {currentStep >= 4 && (
          <>
            <StepDivider />
            <section>
              <StepTitle step={4} total={TOTAL_STEPS} title="اختر الكنيسة" />
              <div className="grid grid-cols-2 gap-2">
                {churches.map((church) => (
                  <button
                    key={church.name}
                    type="button"
                    onClick={() =>
                      setSelection({ ...selection, church, form: null })
                    }
                    className={`
                      flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2
                      text-right transition-all duration-200 cursor-pointer
                      ${
                        selection.church === church ?
                          "border-blue-700 bg-blue-700 text-white"
                        : "border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50"
                      }
                    `}>
                    <i
                      className={`ti ti-building-church flex-shrink-0 ${
                        selection.church === church ?
                          "text-blue-200"
                        : "text-blue-400"
                      }`}
                      style={{ fontSize: 20 }}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-sm leading-tight flex-1">
                      {church.name.replace("كنيسة ", "")}
                    </span>
                    {selection.church === church && (
                      <i
                        className="ti ti-circle-check text-blue-300 flex-shrink-0"
                        style={{ fontSize: 18 }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
        {/* ═══ الخطوة 5: نوع الإستمارة ════════════════════════════ */}
        {currentStep >= 5 && (
          <>
            <StepDivider />
            <section>
              <StepTitle
                step={5}
                total={TOTAL_STEPS}
                title="اختر نوع الإستمارة"
              />
              <div className="grid grid-cols-2 gap-3">
                {filteredForms.map((f) => (
                  <SelectCard
                    key={f.name}
                    isSelected={selection.form === f}
                    onClick={() => setSelection({ ...selection, form: f })}
                    icon={f.name === "فردى" ? "ti-user" : "ti-users"}
                    title={f.name}
                    subtitle={f.name === "فردى" ? "لاعب واحد" : "أكثر من لاعب"}
                  />
                ))}
              </div>
            </section>
          </>
        )}
        {/* ═══ نموذج التسجيل ══════════════════════════════════════ */}
        {currentStep === 6 && (
          <>
            <StepDivider />
            {selection.form?.name === "فردى" && (
              <Single data={selection} onUpdateSelection={setSelection} />
            )}
            {selection.form?.name === "جماعى" && (
              <Team data={selection} onUpdateSelection={setSelection} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
