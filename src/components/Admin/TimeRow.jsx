export default function TimeRow({ name, score, onChange, disabled }) {
  const displayValue = score === "00:00:00" || !score ? "" : score;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex-1 text-sm text-slate-700 break-words min-w-0 leading-tight">
        {name}
      </span>
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
                     font-mono bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                     outline-none transition disabled:bg-slate-50 disabled:text-slate-400
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-slate-400 font-medium">ث</span>
      </div>
    </div>
  );
}
