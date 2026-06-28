// تحويل الوقت بصيغة MM:SS:cs إلى centiseconds للمقارنة
export function timeToMs(timeValue) {
  if (
    timeValue === undefined ||
    timeValue === null ||
    timeValue === "" ||
    timeValue === "00:00:00"
  )
    return Infinity;

  const str = String(timeValue).trim();

  // صيغة MM:SS:cs
  const parts = str.split(":");
  if (parts.length === 3) {
    const mm = parseInt(parts[0], 10);
    const ss = parseInt(parts[1], 10);
    const cs = parseInt(parts[2], 10);
    if (isNaN(mm) || isNaN(ss) || isNaN(cs)) return Infinity;
    if (ss > 59 || cs > 99) return Infinity;
    return mm * 6000 + ss * 100 + cs;
  }

  return Infinity;
}

// التحقق من صحة صيغة الوقت MM:SS:cs
export function isValidTime(timeValue) {
  if (!timeValue || String(timeValue).trim() === "") return false;
  const str = String(timeValue).trim();
  // الصيغة: أرقام:أرقام:أرقام
  if (!/^\d+:\d{2}:\d{2}$/.test(str)) return false;
  const parts = str.split(":");
  const ss = parseInt(parts[1], 10);
  const cs = parseInt(parts[2], 10);
  return ss <= 59 && cs <= 99;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// توليد الهيكل المبدئي للقرعة
export default function generateBracket(items, isTeam = false) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    const p = items[0];
    const name = p.church ? `${p.name}-${p.church}` : p.name || "؟";
    return {
      rounds: [
        {
          roundName: "بطل المسابقة",
          matches: [
            {
              id: "champion_box",
              p1: name,
              winner: name,
              isChampion: true,
              isBye: true,
            },
          ],
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  const isRelay = items[0]?.game && items[0].game.includes("تتابع");
  const firstRoundMatches = [];

  if (isRelay) {
    const churchGroups = {};
    items.forEach((p) => {
      const cName = p.church || "كنيسة غير معروفة";
      if (!churchGroups[cName]) churchGroups[cName] = [];
      churchGroups[cName].push(isTeam ? p.team : p.name);
    });

    Object.keys(churchGroups).forEach((churchName, idx) => {
      firstRoundMatches.push({
        id: `r0_c${idx}`,
        churchName: churchName,
        players: churchGroups[churchName].map((pName) => ({
          name: pName,
          score: "",
        })),
        winner: null,
        isRelay: true,
      });
    });
  } else {
    const unique =
      isTeam ? [...new Map(items.map((p) => [p.team, p])).values()] : items;
    const shuffled = shuffleArray(unique);
    const getName = (x) => {
      if (isTeam) return x.team || "؟";
      return x.church ? `${x.name}-${x.church}` : x.name || "؟";
    };
    const players = shuffled.map((p) => getName(p));

    for (let i = 0; i < players.length; i += 2) {
      const p1 = players[i];
      const p2 = players[i + 1];

      if (p2) {
        firstRoundMatches.push({
          id: `r0_m${firstRoundMatches.length}`,
          p1: p1,
          p2: p2,
          score1: null,
          score2: null,
          winner: null,
          isBye: false,
          isRelay: false,
        });
      } else {
        firstRoundMatches.push({
          id: `r0_m${firstRoundMatches.length}`,
          p1: p1,
          p2: "BYE",
          score1: 1,
          score2: 0,
          winner: p1,
          isBye: true,
          isRelay: false,
        });
      }
    }
  }

  const rounds = [
    {
      roundName: "الدور الأول (تصفيات الكنائس)",
      matches: firstRoundMatches,
    },
  ];

  propagateWinners(rounds);
  return { rounds, generatedAt: new Date().toISOString() };
}

// دالة التصعيد للأدوار المتقدمة
export function propagateWinners(rounds) {
  let currentRoundIdx = 0;

  if (rounds[rounds.length - 1]?.roundName === "بطل المسابقة") {
    rounds.pop();
  }

  while (currentRoundIdx < rounds.length) {
    const currentRound = rounds[currentRoundIdx];
    const allMatchesFinished = currentRound.matches.every(
      (m) => m.winner !== null,
    );

    if (allMatchesFinished && currentRound.matches.length > 0) {
      const rawWinners = currentRound.matches
        .map((m) => m.winner)
        .filter(Boolean);

      if (rawWinners.length <= 1) {
        if (rawWinners.length === 1) {
          rounds.push({
            roundName: "بطل المسابقة",
            matches: [
              {
                id: "champion_box",
                p1: rawWinners[0],
                winner: rawWinners[0],
                isChampion: true,
                isBye: true,
              },
            ],
          });
        }
        break;
      }

      const nextRoundIdx = currentRoundIdx + 1;
      const nextRoundExists = !!rounds[nextRoundIdx];
      const isRelay = currentRound.matches[0]?.isRelay;

      let winners = [];
      if (nextRoundExists) {
        const existingMatches = rounds[nextRoundIdx].matches;
        existingMatches.forEach((m) => {
          if (m.p1 && m.p1 !== "BYE") winners.push(m.p1);
          if (m.p2 && m.p2 !== "BYE") winners.push(m.p2);
        });
        if (winners.length !== rawWinners.length) winners = rawWinners;
      } else {
        winners = shuffleArray(rawWinners);
      }

      let nextRoundName = `الدور التالي`;
      if (winners.length <= 2) nextRoundName = "النهائي";
      else if (winners.length <= 4) nextRoundName = "نصف النهائي";
      else if (winners.length <= 8) nextRoundName = "ربع النهائي";

      const nextRoundMatches = [];
      for (let i = 0; i < winners.length; i += 2) {
        const p1 = winners[i];
        const p2 = winners[i + 1];

        if (p2) {
          nextRoundMatches.push({
            id: `r${nextRoundIdx}_m${nextRoundMatches.length}`,
            p1: p1,
            p2: p2,
            score1: isRelay ? "" : null,
            score2: isRelay ? "" : null,
            winner: null,
            isBye: false,
            isRelay: isRelay,
          });
        } else {
          nextRoundMatches.push({
            id: `r${nextRoundIdx}_m${nextRoundMatches.length}`,
            p1: p1,
            p2: "BYE",
            score1: isRelay ? "" : 1,
            score2: isRelay ? "999:99:99" : 0,
            winner: p1,
            isBye: true,
            isRelay: isRelay,
          });
        }
      }

      if (nextRoundExists) {
        const existingRound = rounds[nextRoundIdx];
        nextRoundMatches.forEach((newMatch, idx) => {
          if (existingRound.matches[idx]) {
            if (
              existingRound.matches[idx].p1 === newMatch.p1 &&
              existingRound.matches[idx].p2 === newMatch.p2
            ) {
              newMatch.score1 = existingRound.matches[idx].score1;
              newMatch.score2 = existingRound.matches[idx].score2;
              newMatch.winner = existingRound.matches[idx].winner;
            }
          }
        });
        rounds[nextRoundIdx] = {
          roundName: nextRoundName,
          matches: nextRoundMatches,
        };
      } else {
        rounds.push({ roundName: nextRoundName, matches: nextRoundMatches });
      }
    } else {
      break;
    }
    currentRoundIdx++;
  }
}
