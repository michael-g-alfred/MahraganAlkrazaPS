export default function RoundTabs({ rounds, activeRoundIdx, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-none">
      {rounds.map((round, idx) => {
        const isDone = round.matches.every((m) => m.winner);
        return (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full
                       text-xs font-semibold transition-all duration-200 border ${
                         activeRoundIdx === idx ?
                           "bg-blue-700 text-white border-blue-700 shadow-sm"
                         : isDone ? "bg-blue-100 text-blue-700 border-blue-700"
                         : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                       }`}>
            {isDone && activeRoundIdx !== idx && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {round.roundName}
          </button>
        );
      })}
    </div>
  );
}
