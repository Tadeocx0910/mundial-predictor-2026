export function pointsForPrediction(pred, result) {
  if (!pred || !result || result.homeGoals === "" || result.awayGoals === "") return 0;
  const ph = Number(pred.homeGoals);
  const pa = Number(pred.awayGoals);
  const rh = Number(result.homeGoals);
  const ra = Number(result.awayGoals);
  if ([ph,pa,rh,ra].some(Number.isNaN)) return 0;
  if (ph === rh && pa === ra) return 5;
  const predDiff = Math.sign(ph - pa);
  const realDiff = Math.sign(rh - ra);
  if (predDiff === realDiff) {
    if ((ph - pa) === (rh - ra)) return 3;
    return 2;
  }
  let pts = 0;
  if (ph === rh) pts += 1;
  if (pa === ra) pts += 1;
  return pts;
}

export function emptyTable(teams) {
  const table = {};
  teams.forEach(t => {
    table[t.name] = { team: t.name, flag: t.flag, group: t.group, pj:0, g:0, e:0, p:0, gf:0, gc:0, dg:0, pts:0 };
  });
  return table;
}

export function buildGroupTables(teams, matches, results) {
  const table = emptyTable(teams);
  matches.filter(m => m.stage === "Grupo").forEach(m => {
    const r = results[m.id];
    if (!r || r.homeGoals === "" || r.awayGoals === "") return;
    const hg = Number(r.homeGoals), ag = Number(r.awayGoals);
    if (Number.isNaN(hg) || Number.isNaN(ag)) return;
    const home = table[m.home], away = table[m.away];
    if (!home || !away) return;
    home.pj++; away.pj++;
    home.gf += hg; home.gc += ag;
    away.gf += ag; away.gc += hg;
    if (hg > ag) { home.g++; away.p++; home.pts += 3; }
    else if (hg < ag) { away.g++; home.p++; away.pts += 3; }
    else { home.e++; away.e++; home.pts += 1; away.pts += 1; }
    home.dg = home.gf - home.gc;
    away.dg = away.gf - away.gc;
  });
  const grouped = {};
  Object.values(table).forEach(row => {
    grouped[row.group] ||= [];
    grouped[row.group].push(row);
  });
  Object.keys(grouped).forEach(g => grouped[g].sort((a,b)=> b.pts-a.pts || b.dg-a.dg || b.gf-a.gf || a.team.localeCompare(b.team)));
  return grouped;
}
