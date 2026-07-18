import React, { useMemo, useState } from "react";
import useAllBrackets from "../hooks/useAllBrackets";
import useEditableBracket from "../hooks/useEditableBracket";
import { useAuth } from "../context/AuthContext";
import { getPrivileges } from "../utils/permissions";
import Loader from "../components/Loader";
import RoundTabs from "../components/Admin/RoundTabs";
import ChampionCard from "../components/Admin/ChampionCard";
import RelayChurchCard from "../components/Admin/RelayChurchCard";
import NormalMatchCard from "../components/Admin/NormalMatchCard";
import {
  ReadOnlyChampionCard,
  ReadOnlyMatchCard,
  ReadOnlyChurchCard,
} from "../components/Brackets/ReadOnlyCards";

// يفكّ مفتاح القرعة (game__gender__form__stage) لعنوان مقروء
function parseBracketKey(id) {
  const [game, gender, form, stage] = id.split("__");
  return { game, gender, form, stage };
}

function BracketBlock({ bracket, canEdit }) {
  const { game, gender, form, stage } = parseBracketKey(bracket.id);

  // ── الأدمن الكامل بيقدر يدخل نتائج ويأكد فائزين مباشرة من هنا ──
  const editable = useEditableBracket(bracket.id, bracket);
  const [readOnlyRoundIdx, setReadOnlyRoundIdx] = useState(0);

  const activeRoundIdx = canEdit ? editable.activeRoundIdx : readOnlyRoundIdx;
  const setActiveRoundIdx =
    canEdit ? editable.setActiveRoundIdx : setReadOnlyRoundIdx;

  const displayedBracket = canEdit ? editable.localBracket : bracket;
  const currentRound = displayedBracket?.rounds?.[activeRoundIdx];
  const isRelayGroupRound = !!currentRound?.matches?.[0]?.players;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm font-bold text-blue-700">{game}</span>
        <span className="text-slate-300">•</span>
        <span className="text-xs text-slate-500">{stage}</span>
        <span className="text-slate-300">•</span>
        <span className="text-xs text-slate-500">{gender}</span>
        <span className="text-slate-300">•</span>
        <span className="text-xs text-slate-500">{form}</span>
      </div>

      {displayedBracket?.rounds?.length > 0 ?
        <>
          <RoundTabs
            rounds={displayedBracket.rounds}
            activeRoundIdx={activeRoundIdx}
            onSelect={setActiveRoundIdx}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentRound?.matches.map((match, matchIdx) => {
              if (match.isChampion) {
                return canEdit ?
                    <ChampionCard key={match.id} match={match} />
                  : <ReadOnlyChampionCard key={match.id} match={match} />;
              }

              if (isRelayGroupRound) {
                return canEdit ?
                    <RelayChurchCard
                      key={match.id}
                      match={match}
                      matchIdx={matchIdx}
                      saving={editable.saving}
                      onScoreChange={editable.handleRelayPlayerScoreChange}
                      onConfirm={editable.handleSetChurchWinner}
                    />
                  : <ReadOnlyChurchCard key={match.id} match={match} />;
              }

              return canEdit ?
                  <NormalMatchCard
                    key={match.id}
                    match={match}
                    matchIdx={matchIdx}
                    saving={editable.saving}
                    onScoreChange={editable.handleNormalScoreChange}
                    onConfirm={editable.handleSetNormalMatchWinner}
                  />
                : <ReadOnlyMatchCard key={match.id} match={match} />;
            })}
          </div>
        </>
      : <p className="text-sm text-slate-400 text-center py-6">
          لا توجد بيانات لهذه القرعة
        </p>
      }
    </div>
  );
}

export default function Brackets() {
  const { user } = useAuth();
  const privileges = getPrivileges(user?.email);
  const { brackets, loading, error } = useAllBrackets();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return brackets;
    const q = search.trim();
    return brackets.filter((b) => b.id.includes(q));
  }, [brackets, search]);

  return (
    <div className="min-h-screen max-w-6xl mx-auto" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-700 text-white px-5 py-3.5 rounded-2xl shadow-md mb-5">
        <h1 className="text-base font-bold leading-none">كل القرعات</h1>
        <span className="text-xs text-white font-mono bg-blue-900 px-2.5 py-0.5 rounded-full border border-blue-600/30">
          {brackets.length} قرعة
        </span>
      </div>

      {brackets.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم (لعبة / مرحلة / نوع / استمارة)"
          className="w-full mb-4 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        />
      )}

      {loading ?
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      : error ?
        <p className="text-red-500 text-center font-medium">{error}</p>
      : filtered.length === 0 ?
        <div className="flex flex-col items-center gap-3 py-20 text-center text-slate-400">
          <p className="font-semibold text-slate-500">
            لا توجد قرعات منشأة بعد
          </p>
          <p className="text-sm">هتظهر هنا فور إنشائها من لوحة الأدمن</p>
        </div>
      : filtered.map((bracket) => (
          <BracketBlock
            key={bracket.id}
            bracket={bracket}
            canEdit={privileges.canRegisterResults}
          />
        ))
      }
    </div>
  );
}
