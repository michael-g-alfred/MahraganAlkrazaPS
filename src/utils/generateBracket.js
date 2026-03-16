function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function generateBracket(items, isTeam = false) {
  // deduplicate teams
  const unique =
    isTeam ? [...new Map(items.map((p) => [p.team, p])).values()] : items;

  const shuffled = shuffleArray(unique);

  const getName = (x) => (isTeam ? x.team : x.name) || "؟";

  // pad to next power of 2 with "bye"
  let size = 1;
  while (size < shuffled.length) size *= 2;

  const padded = [...shuffled];
  while (padded.length < size) padded.push(null); // null = bye

  const roundNames = [
    "دور الـ" + size,
    "ربع النهائي",
    "نصف النهائي",
    "النهائي",
  ];
  // dynamic round names
  const getRoundName = (totalRounds, roundIndex) => {
    const fromEnd = totalRounds - 1 - roundIndex;
    if (fromEnd === 0) return "النهائي";
    if (fromEnd === 1) return "نصف النهائي";
    if (fromEnd === 2) return "ربع النهائي";
    return `دور الـ${Math.pow(2, fromEnd + 1)}`;
  };

  const totalRounds = Math.log2(size);
  const rounds = [];

  // Round 1 - real players
  const firstRoundMatches = [];
  for (let i = 0; i < padded.length; i += 2) {
    const p1 = padded[i];
    const p2 = padded[i + 1];
    const isBye = !p2; // p1 gets auto-advance if bye
    firstRoundMatches.push({
      id: `r0_m${i / 2}`,
      p1: p1 ? getName(p1) : "BYE",
      p2: p2 ? getName(p2) : "BYE",
      score1: isBye ? 1 : null,
      score2: isBye ? 0 : null,
      winner:
        isBye ?
          p1 ? getName(p1)
          : null
        : null,
      isBye,
    });
  }
  rounds.push({
    roundName: getRoundName(totalRounds, 0),
    matches: firstRoundMatches,
  });

  // Subsequent rounds — empty slots waiting for winners
  let prevCount = firstRoundMatches.length;
  for (let r = 1; r < totalRounds; r++) {
    const matches = [];
    for (let m = 0; m < prevCount / 2; m++) {
      matches.push({
        id: `r${r}_m${m}`,
        p1: null,
        p2: null,
        score1: null,
        score2: null,
        winner: null,
        isBye: false,
      });
    }
    rounds.push({ roundName: getRoundName(totalRounds, r), matches });
    prevCount = matches.length;
  }

  // Auto-advance byes into round 2
  propagateWinners(rounds);

  return { rounds, generatedAt: new Date().toISOString() };
}

export function propagateWinners(rounds) {
  for (let r = 0; r < rounds.length - 1; r++) {
    const currentMatches = rounds[r].matches;
    const nextMatches = rounds[r + 1].matches;
    currentMatches.forEach((match, mIdx) => {
      if (!match.winner) return;
      const nextMatchIdx = Math.floor(mIdx / 2);
      const slot = mIdx % 2 === 0 ? "p1" : "p2";
      if (nextMatches[nextMatchIdx]) {
        nextMatches[nextMatchIdx][slot] = match.winner;
      }
    });
  }
}
