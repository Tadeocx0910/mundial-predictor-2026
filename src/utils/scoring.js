export function matchPoints(pred, result) {
  if (!pred || pred.home === '' || pred.away === '' || result?.home === '' || result?.away === '' || result?.home == null || result?.away == null) return 0;
  const ph = Number(pred.home), pa = Number(pred.away), rh = Number(result.home), ra = Number(result.away);
  if ([ph,pa,rh,ra].some(Number.isNaN)) return 0;
  if (ph === rh && pa === ra) return 5;
  const predSign = Math.sign(ph - pa);
  const realSign = Math.sign(rh - ra);
  const diffOk = (ph-pa) === (rh-ra);
  if (predSign === realSign && diffOk) return 4;
  if (predSign === realSign) return 3;
  if (ph === rh || pa === ra) return 1;
  return 0;
}

export function buildStandings(groups, matches, results) {
  const tables = {};
  groups.forEach(g => {
    tables[g.id] = g.teams.map(t => ({...t, PJ:0, G:0, E:0, P:0, GF:0, GC:0, DG:0, PTS:0}));
  });
  matches.filter(m => m.stage === 'Grupos').forEach(m => {
    const r = results[m.id];
    if (!r || r.home === '' || r.away === '' || r.home == null || r.away == null) return;
    const hg = Number(r.home), ag = Number(r.away);
    if (Number.isNaN(hg) || Number.isNaN(ag)) return;
    const table = tables[m.group];
    const h = table.find(t => t.name === m.home.name);
    const a = table.find(t => t.name === m.away.name);
    h.PJ++; a.PJ++; h.GF += hg; h.GC += ag; a.GF += ag; a.GC += hg;
    h.DG = h.GF-h.GC; a.DG = a.GF-a.GC;
    if (hg > ag) { h.G++; h.PTS += 3; a.P++; }
    else if (hg < ag) { a.G++; a.PTS += 3; h.P++; }
    else { h.E++; a.E++; h.PTS++; a.PTS++; }
  });
  Object.keys(tables).forEach(k => tables[k].sort((a,b) => b.PTS-a.PTS || b.DG-a.DG || b.GF-a.GF || a.name.localeCompare(b.name)));
  return tables;
}
