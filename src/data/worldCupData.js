export const groups = {
  A: ['México', 'Sudáfrica', 'Corea del Sur', 'República Checa'],
  B: ['Canadá', 'Bosnia y Herzegovina', 'Qatar', 'Suiza'],
  C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  D: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'],
  E: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
  F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
  H: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'],
  I: ['Francia', 'Senegal', 'Irak', 'Noruega'],
  J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  K: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá']
}

const flag = {
  México:'🇲🇽', Sudáfrica:'🇿🇦', 'Corea del Sur':'🇰🇷', 'República Checa':'🇨🇿',
  Canadá:'🇨🇦', 'Bosnia y Herzegovina':'🇧🇦', Qatar:'🇶🇦', Suiza:'🇨🇭',
  Brasil:'🇧🇷', Marruecos:'🇲🇦', Haití:'🇭🇹', Escocia:'🏴',
  'Estados Unidos':'🇺🇸', Paraguay:'🇵🇾', Australia:'🇦🇺', Turquía:'🇹🇷',
  Alemania:'🇩🇪', Curazao:'🇨🇼', 'Costa de Marfil':'🇨🇮', Ecuador:'🇪🇨',
  'Países Bajos':'🇳🇱', Japón:'🇯🇵', Suecia:'🇸🇪', Túnez:'🇹🇳',
  Bélgica:'🇧🇪', Egipto:'🇪🇬', Irán:'🇮🇷', 'Nueva Zelanda':'🇳🇿',
  España:'🇪🇸', 'Cabo Verde':'🇨🇻', 'Arabia Saudita':'🇸🇦', Uruguay:'🇺🇾',
  Francia:'🇫🇷', Senegal:'🇸🇳', Irak:'🇮🇶', Noruega:'🇳🇴',
  Argentina:'🇦🇷', Argelia:'🇩🇿', Austria:'🇦🇹', Jordania:'🇯🇴',
  Portugal:'🇵🇹', 'RD Congo':'🇨🇩', Uzbekistán:'🇺🇿', Colombia:'🇨🇴',
  Inglaterra:'🏴', Croacia:'🇭🇷', Ghana:'🇬🇭', Panamá:'🇵🇦'
}
export const teamFlag = (team) => flag[team] || '🏳️'

export function buildInitialMatches() {
  const pairs = [[0,1],[2,3],[0,2],[3,1],[1,2],[3,0]]
  const matches = []
  Object.entries(groups).forEach(([group, teams]) => {
    pairs.forEach(([a,b], index) => {
      matches.push({
        id: `${group}-${index+1}`,
        group,
        round: `Grupo ${group}`,
        home: teams[a],
        away: teams[b],
        homeScore: '',
        awayScore: '',
        status: 'open',
        kickoff: '',
        stadium: '',
        phase: 'groups'
      })
    })
  })
  return matches
}
