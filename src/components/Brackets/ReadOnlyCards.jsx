// مكونات عرض فقط (read-only) لعرض القرعة في صفحة /brackets
// نفس تصميم كروت الأدمن بالظبط لكن من غير أي تفاعل أو تعديل

export function ReadOnlyChampionCard({ match }) {
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

function ReadOnlyPlayerRow({ name, score, isWinner, isRelay }) {
  const displayValue =
    isRelay && (score === "00:00:00" || !score) ? null : score;
  const displayName =
    name ?
      name.includes(" (") ?
        name.split(" (")[0]
      : name
    : "—";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span
        className={`flex-1 text-sm break-words min-w-0 leading-tight ${
          name && name !== "BYE" ? "text-slate-800" : "text-slate-300 italic"
        } ${isWinner ? "font-semibold text-emerald-900" : ""}`}>
        {displayName}
      </span>
      {displayValue != null && (
        <span className="text-xs font-mono text-slate-500 flex-shrink-0">
          {displayValue}
          {isRelay ? " ث" : ""}
        </span>
      )}
    </div>
  );
}

export function ReadOnlyMatchCard({ match }) {
  const hasWinner = !!match.winner;
  const isBye = match.isBye;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm ${
        isBye ? "border-slate-100 opacity-70"
        : hasWinner ? "border-emerald-300"
        : "border-slate-200"
      }`}>
      <div className="p-4">
        <ReadOnlyPlayerRow
          name={match.p1}
          score={match.score1}
          isWinner={match.winner === match.p1 && !isBye}
          isRelay={match.isRelay}
        />
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-slate-100"></div>
          <span className="text-xs font-bold text-slate-300 tracking-widest">
            VS
          </span>
          <div className="flex-1 h-px bg-slate-100"></div>
        </div>
        <ReadOnlyPlayerRow
          name={match.p2}
          score={match.score2}
          isWinner={match.winner === match.p2 && !isBye}
          isRelay={match.isRelay}
        />
      </div>

      <div className="px-4 pb-4">
        {isBye && (
          <div className="py-2 px-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-semibold text-center">
            تأهل تلقائي
          </div>
        )}
        {!hasWinner && !isBye && (
          <div className="py-2 text-center text-xs text-slate-400 italic">
            لم تُحدد النتيجة بعد
          </div>
        )}
      </div>
    </div>
  );
}

export function ReadOnlyChurchCard({ match }) {
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
      className={`bg-white rounded-2xl p-4 border shadow-sm ${
        hasChurchWinner ? "border-emerald-300 bg-emerald-50/30" : (
          "border-slate-200"
        )
      }`}>
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
        <div className="w-2 h-2 rounded-full bg-blue-700"></div>
        <p className="text-sm font-bold text-slate-700">{match.churchName}</p>
      </div>

      <div className="flex flex-col divide-y divide-slate-100">
        {match.players.map((player, pIdx) => (
          <div
            key={pIdx}
            className="flex items-center gap-3 py-2.5 justify-between">
            <span className="flex-1 text-sm text-slate-700 break-words min-w-0 leading-tight">
              {player.name}
            </span>
            <span className="text-xs font-mono text-slate-500 flex-shrink-0">
              {player.score && player.score !== "00:00:00" ?
                `${player.score} ث`
              : "—"}
            </span>
          </div>
        ))}
      </div>

      {hasChurchWinner && (
        <div className="mt-3 py-2.5 px-4 bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-2">
          <svg
            className="w-4 h-4 text-emerald-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-semibold text-emerald-800">
            {winnerNames.includes(" و ") ? "أسرع اللاعبين" : "أسرع لاعب"}:{" "}
            {winnerNames}
          </p>
        </div>
      )}
    </div>
  );
}
