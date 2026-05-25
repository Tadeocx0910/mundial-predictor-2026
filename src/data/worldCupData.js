export const groups = [
  { id: 'A', teams: [
    { code:'MX', name:'México', flag:'🇲🇽' }, { code:'ZA', name:'Sudáfrica', flag:'🇿🇦' }, { code:'KR', name:'Corea del Sur', flag:'🇰🇷' }, { code:'CZ', name:'República Checa', flag:'🇨🇿' }
  ]},
  { id: 'B', teams: [
    { code:'CA', name:'Canadá', flag:'🇨🇦' }, { code:'BA', name:'Bosnia y Herzegovina', flag:'🇧🇦' }, { code:'QA', name:'Qatar', flag:'🇶🇦' }, { code:'CH', name:'Suiza', flag:'🇨🇭' }
  ]},
  { id: 'C', teams: [
    { code:'BR', name:'Brasil', flag:'🇧🇷' }, { code:'MA', name:'Marruecos', flag:'🇲🇦' }, { code:'HT', name:'Haití', flag:'🇭🇹' }, { code:'GB-SCT', name:'Escocia', flag:'🏴' }
  ]},
  { id: 'D', teams: [
    { code:'US', name:'Estados Unidos', flag:'🇺🇸' }, { code:'PY', name:'Paraguay', flag:'🇵🇾' }, { code:'AU', name:'Australia', flag:'🇦🇺' }, { code:'TR', name:'Turquía', flag:'🇹🇷' }
  ]},
  { id: 'E', teams: [
    { code:'DE', name:'Alemania', flag:'🇩🇪' }, { code:'CW', name:'Curazao', flag:'🇨🇼' }, { code:'CI', name:'Costa de Marfil', flag:'🇨🇮' }, { code:'EC', name:'Ecuador', flag:'🇪🇨' }
  ]},
  { id: 'F', teams: [
    { code:'NL', name:'Países Bajos', flag:'🇳🇱' }, { code:'JP', name:'Japón', flag:'🇯🇵' }, { code:'SE', name:'Suecia', flag:'🇸🇪' }, { code:'TN', name:'Túnez', flag:'🇹🇳' }
  ]},
  { id: 'G', teams: [
    { code:'BE', name:'Bélgica', flag:'🇧🇪' }, { code:'EG', name:'Egipto', flag:'🇪🇬' }, { code:'IR', name:'Irán', flag:'🇮🇷' }, { code:'NZ', name:'Nueva Zelanda', flag:'🇳🇿' }
  ]},
  { id: 'H', teams: [
    { code:'ES', name:'España', flag:'🇪🇸' }, { code:'CV', name:'Cabo Verde', flag:'🇨🇻' }, { code:'SA', name:'Arabia Saudita', flag:'🇸🇦' }, { code:'UY', name:'Uruguay', flag:'🇺🇾' }
  ]},
  { id: 'I', teams: [
    { code:'FR', name:'Francia', flag:'🇫🇷' }, { code:'SN', name:'Senegal', flag:'🇸🇳' }, { code:'IQ', name:'Irak', flag:'🇮🇶' }, { code:'NO', name:'Noruega', flag:'🇳🇴' }
  ]},
  { id: 'J', teams: [
    { code:'AR', name:'Argentina', flag:'🇦🇷' }, { code:'DZ', name:'Argelia', flag:'🇩🇿' }, { code:'AT', name:'Austria', flag:'🇦🇹' }, { code:'JO', name:'Jordania', flag:'🇯🇴' }
  ]},
  { id: 'K', teams: [
    { code:'PT', name:'Portugal', flag:'🇵🇹' }, { code:'CD', name:'RD Congo', flag:'🇨🇩' }, { code:'UZ', name:'Uzbekistán', flag:'🇺🇿' }, { code:'CO', name:'Colombia', flag:'🇨🇴' }
  ]},
  { id: 'L', teams: [
    { code:'GB-ENG', name:'Inglaterra', flag:'🏴' }, { code:'HR', name:'Croacia', flag:'🇭🇷' }, { code:'GH', name:'Ghana', flag:'🇬🇭' }, { code:'PA', name:'Panamá', flag:'🇵🇦' }
  ]}
];

function groupMatches() {
  const matches = [];
  let n = 1;
  groups.forEach(group => {
    const t = group.teams;
    const pairs = [[0,1],[2,3],[0,2],[3,1],[3,0],[1,2]];
    pairs.forEach((p, idx) => {
      matches.push({
        id: `G${group.id}-${idx+1}`,
        number: n++,
        stage: 'Grupos',
        group: group.id,
        home: t[p[0]],
        away: t[p[1]],
        status: 'open'
      });
    });
  });
  return matches;
}

function knockoutMatches() {
  const slots = [];
  let n = 73;
  for (let i=1;i<=16;i++) slots.push({ id:`R32-${i}`, number:n++, stage:'Dieciseisavos', home:{name:`Clasificado ${i}A`, flag:'🏆'}, away:{name:`Clasificado ${i}B`, flag:'🏆'}, status:'locked' });
  for (let i=1;i<=8;i++) slots.push({ id:`R16-${i}`, number:n++, stage:'Octavos', home:{name:`Ganador R32-${i*2-1}`, flag:'🏆'}, away:{name:`Ganador R32-${i*2}`, flag:'🏆'}, status:'locked' });
  for (let i=1;i<=4;i++) slots.push({ id:`QF-${i}`, number:n++, stage:'Cuartos', home:{name:`Ganador Octavos ${i*2-1}`, flag:'🏆'}, away:{name:`Ganador Octavos ${i*2}`, flag:'🏆'}, status:'locked' });
  for (let i=1;i<=2;i++) slots.push({ id:`SF-${i}`, number:n++, stage:'Semifinal', home:{name:`Ganador Cuartos ${i*2-1}`, flag:'🏆'}, away:{name:`Ganador Cuartos ${i*2}`, flag:'🏆'}, status:'locked' });
  slots.push({ id:'THIRD', number:n++, stage:'Tercer puesto', home:{name:'Perdedor SF1', flag:'🥉'}, away:{name:'Perdedor SF2', flag:'🥉'}, status:'locked' });
  slots.push({ id:'FINAL', number:n++, stage:'Final', home:{name:'Ganador SF1', flag:'🏆'}, away:{name:'Ganador SF2', flag:'🏆'}, status:'locked' });
  return slots;
}

export const matches = [...groupMatches(), ...knockoutMatches()];
export const teams = groups.flatMap(g => g.teams.map(t => ({...t, group:g.id})));
