import TimeRow from "./TimeRow";

export default function RelayChurchCard({
  match,
  matchIdx,
  saving,
  onScoreChange,
  onConfirm,
}) {
  const hasChurchWinner = !!match.winner;
  const winnerNames =
    hasChurchWinner ?
      match.winner
        .split("\n")
        .map((line) => line.split("-")[0])
        .join(" و ")
    : "";

  return (
    <div
      className={`bg-white rounded-2xl p-4 border shadow-sm transition-all ${
        hasChurchWinner ?
          "border-emerald-300 bg-emerald-50/30"
        : "border-slate-200"
      }`}>
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
        <div className="w-2 h-2 rounded-full bg-blue-700"></div>
        <p className="text-sm font-bold text-slate-700">{match.churchName}</p>
      </div>

      <div className="flex flex-col divide-y divide-slate-100">
        {match.players.map((player, pIdx) => (
          <TimeRow
            key={pIdx}
            name={player.name}
            score={player.score}
            disabled={hasChurchWinner}
            onChange={(val) => onScoreChange(matchIdx, pIdx, val)}
          />
        ))}
      </div>

      {!hasChurchWinner ?
        <button
          onClick={() => onConfirm(matchIdx)}
          disabled={saving}
          className="mt-3 w-full py-2.5 bg-blue-700 text-white rounded-xl
                     text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
          تأكيد نتيجة الكنيسة ✓
        </button>
      : <div className="mt-3 py-2.5 px-4 bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-2">
          <svg
            className="w-4 h-4 text-emerald-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-sm font-semibold text-emerald-800">
            {winnerNames.includes(" و ") ? "أسرع اللاعبين" : "أسرع لاعب"}:{" "}
            {winnerNames}
          </p>
        </div>
      }
    </div>
  );
}
