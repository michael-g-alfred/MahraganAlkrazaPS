import NormalPlayerRow from "./NormalPlayerRow";

export default function NormalMatchCard({
  match,
  matchIdx,
  saving,
  onScoreChange,
  onConfirm,
}) {
  const hasWinner = !!match.winner;
  const isBye = match.isBye;
  const waiting = !match.p1 || !match.p2;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm transition-all ${
        isBye ? "border-slate-100 opacity-70"
        : hasWinner ? "border-emerald-300"
        : "border-slate-200"
      }`}>
      <div className="p-4">
        <NormalPlayerRow
          name={match.p1}
          score={match.score1}
          isWinner={match.winner === match.p1 && !isBye}
          disabled={isBye || hasWinner || waiting}
          isRelay={match.isRelay}
          onChange={(val) => onScoreChange(matchIdx, "score1", val)}
        />

        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-slate-100"></div>
          <span className="text-xs font-bold text-slate-300 tracking-widest">
            VS
          </span>
          <div className="flex-1 h-px bg-slate-100"></div>
        </div>

        <NormalPlayerRow
          name={match.p2}
          score={match.score2}
          isWinner={match.winner === match.p2 && !isBye}
          disabled={isBye || hasWinner || waiting}
          isRelay={match.isRelay}
          onChange={(val) => onScoreChange(matchIdx, "score2", val)}
        />
      </div>

      <div className="px-4 pb-4">
        {!hasWinner && !isBye && !waiting && (
          <button
            onClick={() => onConfirm(matchIdx)}
            disabled={saving}
            className="w-full py-2.5 bg-blue-700 text-white rounded-xl
                       text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
            تأكيد الفائز ✓
          </button>
        )}

        {isBye && (
          <div className="py-2 px-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-semibold text-center">
            تأهل تلقائي
          </div>
        )}

        {!hasWinner && !isBye && waiting && (
          <div className="py-2 text-center text-xs text-slate-400 italic">
            في انتظار نتائج الدور السابق...
          </div>
        )}
      </div>
    </div>
  );
}
