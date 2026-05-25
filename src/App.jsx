import { useEffect, useMemo, useState } from 'react';
import { auth, db, ADMIN_EMAIL } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { groups, matches, teams } from './data/worldCupData';
import { buildStandings, matchPoints } from './utils/scoring';

function AuthScreen(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState(''); const [mode,setMode]=useState('login'); const [err,setErr]=useState('');
  async function submit(){
    setErr('');
    try{
      if(mode==='register'){
        const cred = await createUserWithEmailAndPassword(auth,email,password);
        await setDoc(doc(db,'users',cred.user.uid),{name:name||email.split('@')[0], email, points:0, createdAt:Date.now()},{merge:true});
      }else{
        await signInWithEmailAndPassword(auth,email,password);
      }
    }catch(e){ setErr(e.message); }
  }
  return <div className="auth"><div className="authbox"><h1>⚽ Mundial Predictor 2026</h1><p className="small">Liga privada de pronósticos</p>{mode==='register'&&<input className="input" placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)} />}<input className="input" placeholder="Correo" value={email} onChange={e=>setEmail(e.target.value)} /><input className="input" placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />{err&&<p className="error">{err}</p>}<button onClick={submit}>{mode==='login'?'Entrar':'Crear cuenta'}</button><button className="secondary" style={{marginLeft:10}} onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Crear cuenta':'Ya tengo cuenta'}</button></div></div>
}

export default function App(){
  const [user,setUser]=useState(null); const [profile,setProfile]=useState(null); const [tab,setTab]=useState('home');
  const [users,setUsers]=useState([]); const [predictions,setPredictions]=useState({}); const [results,setResults]=useState({}); const [adminDraft,setAdminDraft]=useState({});
  useEffect(()=>onAuthStateChanged(auth,async u=>{setUser(u); if(u){ await setDoc(doc(db,'users',u.uid),{email:u.email,name:u.email===ADMIN_EMAIL?'Tadeo Bazurto':u.email.split('@')[0],lastLogin:Date.now()},{merge:true}); }}),[]);
  useEffect(()=>{ if(!user) return; const unsub=onSnapshot(collection(db,'users'),snap=>{ const arr=snap.docs.map(d=>({id:d.id,...d.data()})); setUsers(arr); setProfile(arr.find(x=>x.id===user.uid)); }); return unsub; },[user]);
  useEffect(()=>{ if(!user) return; const unsub=onSnapshot(collection(db,'predictions'),snap=>{ const obj={}; snap.docs.forEach(d=>obj[d.id]=d.data()); setPredictions(obj); }); return unsub; },[user]);
  useEffect(()=>{ if(!user) return; const unsub=onSnapshot(collection(db,'results'),snap=>{ const obj={}; snap.docs.forEach(d=>obj[d.id]=d.data()); setResults(obj); }); return unsub; },[user]);
  const isAdmin = user?.email === ADMIN_EMAIL;
  const standings = useMemo(()=>buildStandings(groups,matches,results),[results]);
  const ranking = useMemo(()=>{
    const rows = users.map(u=>{ let pts=0, exactos=0; matches.forEach(m=>{ const p=predictions[`${u.id}_${m.id}`]; const r=results[m.id]; const mp=matchPoints(p,r); pts+=mp; if(mp===5) exactos++; }); return {...u,points:pts,exactos}; });
    return rows.sort((a,b)=>b.points-a.points||b.exactos-a.exactos||String(a.name).localeCompare(String(b.name)));
  },[users,predictions,results]);
  const myPoints = ranking.find(r=>r.id===user?.uid)?.points || 0;
  const nextMatches = matches.filter(m=>m.stage==='Grupos').slice(0,8);
  async function savePrediction(matchId, home, away){ await setDoc(doc(db,'predictions',`${user.uid}_${matchId}`),{userId:user.uid,matchId,home,away,updatedAt:Date.now()},{merge:true}); }
  async function saveResult(matchId){ const d=adminDraft[matchId]||results[matchId]||{}; await setDoc(doc(db,'results',matchId),{home:d.home??'',away:d.away??'',updatedAt:Date.now()},{merge:true}); }
  if(!user) return <AuthScreen />;
  return <div className="app"><header className="top"><div className="brand"><div className="logo">⚽</div><div><h1>Mundial Predictor 2026</h1><p>Liga privada de pronósticos</p></div></div><button className="secondary" onClick={()=>signOut(auth)}>Salir</button></header>
    {tab==='home'&&<><div className="grid"><Stat label="Jugadores" value={users.length||1}/><Stat label="Partidos" value={matches.length}/><Stat label="Líder" value={ranking[0]?.name||'—'}/><Stat label="Tus puntos" value={myPoints}/></div><h2 className="section-title">📅 Próximos partidos</h2><MatchList list={nextMatches} predictions={predictions} results={results} user={user} savePrediction={savePrediction}/></>}
    {tab==='predict'&&<><h2 className="section-title">🎯 Pronósticos</h2><p className="small">Toca los cuadros y escribe el marcador. Se guarda con el botón.</p><MatchList list={matches.filter(m=>m.stage==='Grupos')} predictions={predictions} results={results} user={user} savePrediction={savePrediction}/></>}
    {tab==='groups'&&<GroupsView standings={standings}/>} {tab==='teams'&&<TeamsView/>} {tab==='ranking'&&<Ranking rows={ranking}/>} {tab==='profile'&&<Profile profile={profile} rank={ranking.findIndex(r=>r.id===user.uid)+1} points={myPoints}/>} {tab==='admin'&&<Admin isAdmin={isAdmin} results={results} adminDraft={adminDraft} setAdminDraft={setAdminDraft} saveResult={saveResult}/>}<Nav tab={tab} setTab={setTab}/></div>
}
function Stat({label,value}){return <div className="card"><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>}
function MatchList({list,predictions,results,user,savePrediction}){return <div className="match-grid">{list.map(m=><PredictionCard key={m.id} m={m} pred={predictions[`${user.uid}_${m.id}`]||{home:'',away:''}} result={results[m.id]} savePrediction={savePrediction}/>)}</div>}
function PredictionCard({m,pred,result,savePrediction}){ const [home,setHome]=useState(pred.home??''); const [away,setAway]=useState(pred.away??''); useEffect(()=>{setHome(pred.home??'');setAway(pred.away??'')},[pred.home,pred.away]); return <div className="match"><div className="match-head"><span>{m.stage}{m.group?` • Grupo ${m.group}`:''}</span><span className="pill">{result?'FINALIZADO':'ABIERTO'}</span></div><div className="teams"><div className="teamrow"><span className="flag">{m.home.flag}</span>{m.home.name}</div><div className="teamrow"><span className="flag">{m.away.flag}</span>{m.away.name}</div></div>{result&&<p className="small">Resultado: {result.home} - {result.away}</p>}<div className="score-row"><input className="score-input" type="number" min="0" value={home} onChange={e=>setHome(e.target.value)} /><b>-</b><input className="score-input" type="number" min="0" value={away} onChange={e=>setAway(e.target.value)} /><button onClick={()=>savePrediction(m.id,home,away)}>Guardar</button></div></div>}
function GroupsView({standings}){return <><h2 className="section-title">📊 Grupos</h2>{groups.map(g=><div className="card" key={g.id} style={{marginBottom:16}}><h3>Grupo {g.id}</h3><div className="table-wrap"><table className="standings"><thead><tr><th>País</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr></thead><tbody>{standings[g.id].map(t=><tr key={t.name}><td><span className="flag">{t.flag}</span>{t.name}</td><td>{t.PJ}</td><td>{t.G}</td><td>{t.E}</td><td>{t.P}</td><td>{t.GF}</td><td>{t.GC}</td><td>{t.DG}</td><td><b>{t.PTS}</b></td></tr>)}</tbody></table></div></div>)}</>}
function TeamsView(){const [q,setQ]=useState(''); const filtered=teams.filter(t=>t.name.toLowerCase().includes(q.toLowerCase())); return <><h2 className="section-title">🌍 Equipos y jugadores</h2><input className="input" placeholder="Buscar país" value={q} onChange={e=>setQ(e.target.value)}/><div className="match-grid">{filtered.map(t=><div className="card" key={t.name}><h3><span className="flag">{t.flag}</span>{t.name}</h3><p className="small">Grupo {t.group}</p><p>Plantilla editable pendiente de cargar con datos oficiales.</p><div className="team-card"><b>Jugador</b><span className="small">Club • Edad • Altura • Peso</span></div></div>)}</div></>}
function Ranking({rows}){return <><h2 className="section-title">🏆 Ranking</h2>{rows.map((r,i)=><div className="rank-row" key={r.id}><div className="rank-left"><div className={`pos ${i===0?'first':''}`}>{i+1}</div><div><b>{i===0?'👑 ':''}{r.name}</b><div className="small">{r.exactos} exactos</div></div></div><h2>{r.points} pts</h2></div>)}</>}
function Profile({profile,rank,points}){return <div className="card"><h2>👤 Perfil</h2><p><b>{profile?.name||'Usuario'}</b></p><p>{profile?.email}</p><p>Posición: #{rank||'—'}</p><p>Puntos: {points}</p></div>}
function Admin({isAdmin,results,adminDraft,setAdminDraft,saveResult}){ if(!isAdmin)return <div className="card"><h2>Admin</h2><p>No tienes permisos de administrador.</p></div>; const list=matches.filter(m=>m.stage==='Grupos'); return <><h2 className="section-title">🛠️ Panel Admin</h2><p className="small">Edita resultados reales. Al guardar, se actualizan grupos y ranking automáticamente.</p>{list.map(m=>{ const d=adminDraft[m.id]||results[m.id]||{home:'',away:''}; return <div className="match" key={m.id} style={{marginBottom:12}}><div className="admin-row"><div><b>{m.home.flag} {m.home.name} vs {m.away.flag} {m.away.name}</b><div className="small">Grupo {m.group} • Partido {m.number}</div></div><div className="admin-score"><input className="score-input" type="number" min="0" value={d.home??''} onChange={e=>setAdminDraft(s=>({...s,[m.id]:{...d,home:e.target.value}}))}/><b>-</b><input className="score-input" type="number" min="0" value={d.away??''} onChange={e=>setAdminDraft(s=>({...s,[m.id]:{...d,away:e.target.value}}))}/><button onClick={()=>saveResult(m.id)}>Guardar</button></div></div></div>})}</>}
function Nav({tab,setTab}){const items=[['home','🏠','Inicio'],['predict','🎯','Pronosticar'],['groups','📊','Grupos'],['teams','🌍','Equipos'],['ranking','🏆','Ranking'],['profile','👤','Perfil'],['admin','🛠️','Admin']]; return <nav className="bottom-nav">{items.map(i=><button key={i[0]} className={tab===i[0]?'active':''} onClick={()=>setTab(i[0])}><div>{i[1]}</div><span>{i[2]}</span></button>)}</nav>}
