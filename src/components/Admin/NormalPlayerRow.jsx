export default function NormalPlayerRow({
  name,
  score,
  isWinner,
  onChange,
  disabled,
  isRelay,
}) {
  const displayValue =
    isRelay && (score === "00:00:00" || !score) ? "" : (score ?? "");

  const displayName =
    name ?
      name.includes(" (") ?
        name.split(" (")[0]
      : name
    : "—";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        isWinner ?
          "bg-emerald-100 border border-emerald-200"
        : "bg-slate-50 border border-transparent"
      }`}>
      {isWinner && (
        <svg
          className="w-4 h-4 text-emerald-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}

      <span
        className={`flex-1 text-sm break-words min-w-0 leading-tight ${
          name && name !== "BYE" ? "text-slate-800" : "text-slate-300 italic"
        } ${isWinner ? "font-semibold text-emerald-900" : ""}`}>
        {displayName}
      </span>

      {isRelay ?
        <div
          className="flex items-center gap-1 flex-shrink-0"
          style={{ direction: "ltr" }}>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={displayValue}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 text-center border border-slate-200 rounded-lg py-1.5 px-2 text-sm
                     font-mono bg-white focus:border-blue-500 outline-none
                     disabled:bg-slate-50 disabled:text-slate-400
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-slate-400">ث</span>
        </div>
      : <input
          type="number"
          min="0"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-16 text-center border border-slate-200 rounded-lg py-1.5 px-2
                   text-sm font-mono bg-white focus:border-blue-500 outline-none
                   disabled:bg-slate-50 disabled:text-slate-400 flex-shrink-0"
          placeholder="0"
        />
      }
    </div>
  );
}
