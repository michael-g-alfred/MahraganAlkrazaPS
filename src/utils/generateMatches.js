function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function generateMatches(playersOrTeams) {
  const shuffled = shuffleArray(playersOrTeams);
  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const team1 = shuffled[i];
    const team2 = shuffled[i + 1];
    if (team2) {
      matches.push(
        `${
          team1.name?.name || team1.name || team1.team?.name || team1.team
        } 🆚 ${
          team2.name?.name || team2.name || team2.team?.name || team2.team
        }`
      );
    } else {
      matches.push(
        `${
          team1.name?.name || team1.name || team1.team?.name || team1.team
        } 🏅 تأهل تلقائيًا`
      );
    }
  }
  return matches;
}

export default generateMatches;
