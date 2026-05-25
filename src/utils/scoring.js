export function predictionPoints(prediction, match) {
  const hs = Number(match.homeScore)
  const as = Number(match.awayScore)
  const ph = Number(prediction.homeScore)
  const pa = Number(prediction.awayScore)
  if ([hs, as, ph, pa].some((n) => Number.isNaN(n))) return 0
  if (hs === ph && as === pa) return 5
  const realOutcome = Math.sign(hs - as)
  const predOutcome = Math.sign(ph - pa)
  const realDiff = hs - as
  const predDiff = ph - pa
  let pts = 0
  if (realOutcome === predOutcome) pts += 3
  if (realDiff === predDiff) pts += 1
  return pts
}

export function calculateStandings(groups, matches) {
  const standings = {}
  Object.entries(groups).forEach(([group, teams]) => {
    const rows = teams.map((team) => ({ team, pj:0, g:0, e:0, p:0, gf:0, gc:0, dg:0, pts:0 }))
    const byTeam = Object.fromEntries(rows.map((r) => [r.team, r]))
    matches.filter((m) => m.group === group && m.status === 'finished').forEach((m) => {
      const h = byTeam[m.home], a = byTeam[m.away]
      const hs = Number(m.homeScore), as = Number(m.awayScore)
      if (!h || !a || Number.isNaN(hs) || Number.isNaN(as)) return
      h.pj++; a.pj++
      h.gf += hs; h.gc += as; h.dg = h.gf - h.gc
      a.gf += as; a.gc += hs; a.dg = a.gf - a.gc
      if (hs > as) { h.g++; h.pts += 3; a.p++ }
      else if (hs < as) { a.g++; a.pts += 3; h.p++ }
      else { h.e++; a.e++; h.pts++; a.pts++ }
    })
    standings[group] = rows.sort((x,y) => y.pts-x.pts || y.dg-x.dg || y.gf-x.gf || x.team.localeCompare(y.team))
  })
  return standings
}

export function calculateRanking(users, predictions, matches) {
  const finished = Object.fromEntries(matches.filter(m => m.status === 'finished').map(m => [m.id, m]))
  return users.map((u) => {
    const userPredictions = predictions.filter(p => p.userId === u.uid)
    let points = 0, exactos = 0
    userPredictions.forEach((p) => {
      const match = finished[p.matchId]
      if (!match) return
      const pts = predictionPoints(p, match)
      points += pts
      if (pts === 5) exactos++
    })
    return { ...u, points, exactos }
  }).sort((a,b) => b.points-a.points || b.exactos-a.exactos || (a.name || '').localeCompare(b.name || ''))
}
