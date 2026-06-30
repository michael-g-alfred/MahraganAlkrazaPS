export default function ChampionCard({ match }) {
  const winners = match.p1.split("\n");
  const isMultiple = winners.length > 1;

  return (
    <div className="border-2 border-amber-300 rounded-2xl p-6 bg-amber-50 text-center shadow-sm">
      <div className="w-16 h-16 bg-amber-100 border-2 border-amber-300 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg
          className="w-8 h-8 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 21h8M12 17v4M12 17c-3.314 0-6-2.686-6-6V4h12v7c0 3.314-2.686 6-6 6zM4 7H2M20 7h2"
          />
        </svg>
      </div>
      <p className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">
        {isMultiple ? "أبطال المسابقة" : "بطل المسابقة"}
      </p>
      <div className="flex flex-col gap-1">
        {winners.map((name, idx) => (
          <p key={idx} className="text-lg font-bold text-amber-900 break-words">
            {name}
          </p>
        ))}
      </div>
    </div>
  );
}
