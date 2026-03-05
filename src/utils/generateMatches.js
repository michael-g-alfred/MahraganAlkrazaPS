function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @param {Array} items - array of players or teams
 * @param {boolean} isTeam - if true, deduplicate by team name first
 */
function generateMatches(items, isTeam = false) {
  // لو فرق → نشيل المكرر ونخلي كل فريق مرة واحدة بس
  const unique = isTeam
    ? [...new Map(items.map((p) => [p.team, p])).values()]
    : items;

  const shuffled = shuffleArray(unique);
  const matches = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];

    // اسم العنصر: لو فريق نأخذ team، لو فردي نأخذ name
    const nameOf = (x) => (isTeam ? x.team : x.name) || "؟";

    if (b) {
      matches.push(`${nameOf(a)} 🆚 ${nameOf(b)}`);
    } else {
      matches.push(`${nameOf(a)} 🏅 تأهل تلقائيًا`);
    }
  }

  return matches;
}

export default generateMatches;
