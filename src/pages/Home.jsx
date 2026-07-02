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
import useSiteSettings from "../hooks/useSiteSettings";

// أيقونة Tabler لكل لعبة
const GAME_ICONS = {
  "تنس طاولة": "ti-ping-pong",
  جرى: "ti-run",
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

// ── شاشة التسجيل مغلق ────────────────────────────────────────────
function RegistrationClosedScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-6">
      {/* أيقونة القفل */}
      <div className="relative">
        {/* دائرة خارجية بلون أزرق فاتح */}
        <div className="w-32 h-32 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-red-700 flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM16 7a4 4 0 00-8 0v4h8V7z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* النص */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-red-700">التسجيل مغلق الآن</h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
          تم إغلاق باب التسجيل في المسابقة الرياضية.
          <br />
          تواصل مع المسؤولين لمزيد من المعلومات.
        </p>
      </div>
    </div>
  );
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

  // ── حالة التسجيل + الظاهر من الألعاب/المراحل من Firestore (real-time) ──
  const { closed: registrationClosed, loading: loadingRegStatus, visibility } =
    useSiteSettings();

  // الخطوة الحالية المفتوحة
  const currentStep =
    !selection.gender ? 1
    : !selection.game ? 2
    : !selection.stage ? 3
    : !selection.church ? 4
    : !selection.form ? 5
    : 6;

  // الألعاب الظاهرة فقط (حسب اختيار الأدمن)
  const visibleGames = games.filter((g) => visibility.games[g.name] !== false);

  // فلترة المراحل حسب اللعبة + إظهار الأدمن
  const filteredStages =
    selection.game ?
      stages
        .filter((stage) =>
          selection.game.name === "جرى" ?
            stage.name === "المرحلة الأولى (أ)" ||
            stage.name === "المرحلة الأولى (ب)"
          : stage.name !== "المرحلة الأولى (أ)" &&
            stage.name !== "المرحلة الأولى (ب)",
        )
        .filter((stage) => visibility.stages[stage.name] !== false)
    : [];

  // فلترة الاستمارات حسب اللعبة
  const filteredForms =
    selection.game ?
      (
        selection.game.name === "كرة قدم" ||
        selection.game.name === "كرة الطائرة"
      ) ?
        forms.filter((f) => f.name === "جماعى")
      : selection.game.name === "جرى" ? forms.filter((f) => f.name === "فردى")
      : forms
    : forms;

  // ── شاشة التحميل الأولية ─────────────────────────────────────
  if (loadingRegStatus) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="px-4 pb-16 max-w-4xl mx-auto">
        {/* ═══ شاشة التسجيل مغلق ══════════════════════════════════ */}
        {registrationClosed ?
          <RegistrationClosedScreen />
        : <>
            {/* ═══ الخطوة 1: النوع ══════════════════════════════════ */}
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

            {/* ═══ الخطوة 2: اللعبة ═══════════════════════════════ */}
            {currentStep >= 2 && (
              <>
                <StepDivider />
                <section>
                  <StepTitle step={2} total={TOTAL_STEPS} title="اختر اللعبة" />
                  <div className="grid grid-cols-2 gap-3">
                    {visibleGames.map((g) => (
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

            {/* ═══ الخطوة 3: المرحلة ══════════════════════════════ */}
            {currentStep >= 3 && (
              <>
                <StepDivider />
                <section>
                  <StepTitle
                    step={3}
                    total={TOTAL_STEPS}
                    title="اختر المرحلة"
                  />
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

            {/* ═══ الخطوة 4: الكنيسة ══════════════════════════════ */}
            {currentStep >= 4 && (
              <>
                <StepDivider />
                <section>
                  <StepTitle
                    step={4}
                    total={TOTAL_STEPS}
                    title="اختر الكنيسة"
                  />
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

            {/* ═══ الخطوة 5: نوع الإستمارة ════════════════════════ */}
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
                        subtitle={
                          f.name === "فردى" ? "لاعب واحد" : "أكثر من لاعب"
                        }
                      />
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* ═══ نموذج التسجيل ══════════════════════════════════ */}
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
          </>
        }
      </div>
    </div>
  );
}
