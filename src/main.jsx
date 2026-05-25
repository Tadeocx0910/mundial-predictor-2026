import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, doc, getDocs, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, ADMIN_EMAILS } from './firebase'
import { groups, buildInitialMatches, teamFlag } from './data/worldCupData'
import { teamProfiles } from './data/teamProfiles'
import { calculateRanking, calculateStandings } from './utils/scoring'
import './index.css'

function cls(...x){ return x.filter(Boolean).join(' ') }

function AuthScreen(){
  const [mode,setMode]=useState('login')
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const submit=async(e)=>{
    e.preventDefault(); setError('')
    try{
      if(mode==='login') await signInWithEmailAndPassword(auth,email,password)
      else{
        const cred=await createUserWithEmailAndPassword(auth,email,password)
        await setDoc(doc(db,'users',cred.user.uid),{ uid:cred.user.uid, name:name || email.split('@')[0], email, role: ADMIN_EMAILS.includes(email.toLowerCase())?'admin':'player', createdAt:Date.now() })
      }
    }catch(err){ setError('Revisa tu correo/contraseña o intenta crear cuenta.') }
  }
  return <div className="min-h-screen bg-[#07111F] flex items-center justify-center p-5">
    <div className="w-full max-w-md bg-[#0B1727] rounded-[32px] p-8 border border-white/10 shadow-2xl">
      <h1 className="text-4xl font-black text-yellow-400">⚽ Mundial Predictor 2026</h1>
      <p className="text-gray-300 mt-3">Entra para pronosticar, competir y ver el ranking.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode==='register' && <input className="w-full bg-[#07111F] border border-white/10 rounded-2xl p-4 outline-none focus:border-yellow-400" placeholder="Nombre visible" value={name} onChange={e=>setName(e.target.value)} />}
        <input className="w-full bg-[#07111F] border border-white/10 rounded-2xl p-4 outline-none focus:border-yellow-400" placeholder="Correo" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full bg-[#07111F] border border-white/10 rounded-2xl p-4 outline-none focus:border-yellow-400" placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        {error && <p className="text-red-300 text-sm">{error}</p>}
        <button className="w-full bg-yellow-400 text-black font-black rounded-2xl p-4 hover:bg-yellow-300">{mode==='login'?'Entrar':'Crear cuenta'}</button>
      </form>
      <button onClick={()=>setMode(mode==='login'?'register':'login')} className="mt-5 text-yellow-300 underline">
        {mode==='login'?'Crear cuenta nueva':'Ya tengo cuenta'}
      </button>
    </div>
  </div>
}

function BottomNav({tab,setTab,isAdmin}){
  const items=[['home','🏠','Inicio'],['predict','🎯','Pronosticar'],['groups','📊','Grupos'],['teams','🌍','Equipos'],['ranking','🏆','Ranking'],['profile','👤','Perfil']]
  if(isAdmin) items.push(['admin','🛠','Admin'])
  return <div className="fixed bottom-0 left-0 right-0 bg-[#0B1727]/95 border-t border-white/10 backdrop-blur z-50">
    <div className="max-w-5xl mx-auto grid" style={{gridTemplateColumns:`repeat(${items.length},1fr)`}}>
      {items.map(([id,icon,label])=><button key={id} onClick={()=>setTab(id)} className={cls('py-3 text-xs flex flex-col items-center gap-1',tab===id?'text-yellow-300':'text-gray-400')}><span className="text-xl">{icon}</span>{label}</button>)}
    </div>
  </div>
}

function MatchCard({m,onPredict,pred}){
  return <div className="bg-[#0B1727] border border-white/10 rounded-3xl p-5">
    <div className="flex justify-between items-center text-sm text-gray-400"><span>{m.round}</span><span className={cls('px-3 py-1 rounded-full text-xs font-bold',m.status==='open'?'bg-green-500/15 text-green-300':'bg-red-500/15 text-red-300')}>{m.status==='open'?'ABIERTO':'CERRADO'}</span></div>
    <div className="mt-5 space-y-3 text-xl font-black">
      <div className="flex justify-between"><span>{teamFlag(m.home)} {m.home}</span><span>{m.status==='finished'?m.homeScore:'-'}</span></div>
      <div className="flex justify-between"><span>{teamFlag(m.away)} {m.away}</span><span>{m.status==='finished'?m.awayScore:'-'}</span></div>
    </div>
    {m.status==='open' && <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
      <input type="number" min="0" placeholder="0" value={pred?.homeScore ?? ''} onChange={e=>onPredict(m.id,'homeScore',e.target.value)} className="w-20 bg-[#07111F] border border-white/10 rounded-2xl p-3 text-center text-2xl font-black outline-none focus:border-yellow-400" />
      <span className="text-gray-500 font-black">-</span>
      <input type="number" min="0" placeholder="0" value={pred?.awayScore ?? ''} onChange={e=>onPredict(m.id,'awayScore',e.target.value)} className="w-20 bg-[#07111F] border border-white/10 rounded-2xl p-3 text-center text-2xl font-black outline-none focus:border-yellow-400" />
      <span className="text-xs text-green-300">Guardado automático</span>
    </div>}
  </div>
}

function App(){
  const [user,setUser]=useState(null), [profile,setProfile]=useState(null), [tab,setTab]=useState('home')
  const [users,setUsers]=useState([]), [matches,setMatches]=useState([]), [preds,setPreds]=useState([])
  useEffect(()=>onAuthStateChanged(auth,async(u)=>{ setUser(u); if(u){ const snap=await getDocs(collection(db,'users')); const existing=snap.docs.find(d=>d.id===u.uid); if(!existing){ await setDoc(doc(db,'users',u.uid),{uid:u.uid,email:u.email,name:u.email?.split('@')[0],role:ADMIN_EMAILS.includes((u.email||'').toLowerCase())?'admin':'player',createdAt:Date.now()}) } } }),[])
  useEffect(()=>{ if(!user) return; return onSnapshot(collection(db,'users'),s=>{ const arr=s.docs.map(d=>d.data()); setUsers(arr); setProfile(arr.find(x=>x.uid===user.uid)||null) }) },[user])
  useEffect(()=>{ if(!user) return; return onSnapshot(collection(db,'matches'),s=>setMatches(s.docs.map(d=>d.data()).sort((a,b)=>a.id.localeCompare(b.id)))) },[user])
  useEffect(()=>{ if(!user) return; return onSnapshot(collection(db,'predictions'),s=>setPreds(s.docs.map(d=>d.data()))) },[user])
  const isAdmin = profile?.role==='admin' || ADMIN_EMAILS.includes((user?.email||'').toLowerCase())
  const ranking = useMemo(()=>calculateRanking(users,preds,matches),[users,preds,matches])
  const standings = useMemo(()=>calculateStandings(groups,matches),[matches])
  const myPreds = useMemo(()=>Object.fromEntries(preds.filter(p=>p.userId===user?.uid).map(p=>[p.matchId,p])),[preds,user])
  const savePrediction = async(matchId,field,value)=>{ const id=`${user.uid}_${matchId}`; const old=myPreds[matchId]||{}; await setDoc(doc(db,'predictions',id),{ id, userId:user.uid, userName:profile?.name||user.email, matchId, ...old, [field]:value, updatedAt:Date.now() },{merge:true}) }
  const seed = async()=>{ const initial=buildInitialMatches(); for(const m of initial) await setDoc(doc(db,'matches',m.id),m); alert('Torneo inicializado con grupos y partidos.') }
  const updateResult = async(m,homeScore,awayScore,status='finished')=>{ await updateDoc(doc(db,'matches',m.id),{homeScore,awayScore,status}) }
  if(!user) return <AuthScreen />
  const nextMatches = matches.length?matches.filter(m=>m.status==='open').slice(0,6):buildInitialMatches().slice(0,6)
  return <div className="min-h-screen bg-[#07111F] text-white pb-24">
    <header className="p-5 sticky top-0 bg-[#07111F]/90 backdrop-blur z-40 border-b border-white/5"><div className="max-w-6xl mx-auto flex justify-between gap-4 items-center"><div><h1 className="text-2xl md:text-4xl font-black text-yellow-400">⚽ Mundial Predictor 2026</h1><p className="text-gray-400 text-sm">Liga privada de pronósticos</p></div><button onClick={()=>signOut(auth)} className="bg-white/10 px-4 py-2 rounded-xl">Salir</button></div></header>
    <main className="max-w-6xl mx-auto p-5">
      {tab==='home' && <section className="space-y-6"><div className="grid md:grid-cols-4 gap-4"><Stat t="Jugadores" v={users.length||1}/><Stat t="Partidos" v={matches.length||72}/><Stat t="Líder" v={ranking[0]?.name||'—'}/><Stat t="Tus puntos" v={ranking.find(r=>r.uid===user.uid)?.points||0}/></div><h2 className="text-3xl font-black">📅 Próximos partidos</h2><div className="grid md:grid-cols-2 gap-4">{nextMatches.map(m=><MatchCard key={m.id} m={m} onPredict={savePrediction} pred={myPreds[m.id]} />)}</div></section>}
      {tab==='predict' && <section className="space-y-5"><h2 className="text-3xl font-black">🎯 Pronósticos</h2><div className="grid md:grid-cols-2 gap-4">{(matches.length?matches:buildInitialMatches()).filter(m=>m.status==='open').map(m=><MatchCard key={m.id} m={m} onPredict={savePrediction} pred={myPreds[m.id]} />)}</div></section>}
      {tab==='groups' && <section className="space-y-6"><h2 className="text-3xl font-black">📊 Grupos oficiales</h2>{Object.entries(standings).map(([g,rows])=><div key={g} className="bg-[#0B1727] rounded-3xl p-5 border border-white/10 overflow-auto"><h3 className="text-2xl font-black mb-4 text-yellow-300">Grupo {g}</h3><table className="w-full text-sm"><thead className="text-gray-400"><tr><th className="text-left">País</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.team} className="border-t border-white/5"><td className="py-3 font-bold">{i<2?'✅ ':''}{teamFlag(r.team)} {r.team}</td><td className="text-center">{r.pj}</td><td className="text-center">{r.g}</td><td className="text-center">{r.e}</td><td className="text-center">{r.p}</td><td className="text-center">{r.gf}</td><td className="text-center">{r.gc}</td><td className="text-center">{r.dg}</td><td className="text-center font-black text-yellow-300">{r.pts}</td></tr>)}</tbody></table></div>)}</section>}

      {tab==='teams' && <section className="space-y-6"><div><h2 className="text-3xl font-black">🌍 Selecciones y jugadores</h2><p className="text-gray-400 mt-2">Ficha editable para cada país: grupo, entrenador, plantilla, club, edad, nacimiento, altura y peso. No se inventan datos; puedes completar los campos oficiales desde Admin o editando la base.</p></div><div className="grid md:grid-cols-2 gap-4">{teamProfiles.map(team=><div key={team.team} className="bg-[#0B1727] rounded-3xl p-5 border border-white/10"><div className="flex items-center justify-between"><h3 className="text-2xl font-black">{teamFlag(team.team)} {team.team}</h3><span className="bg-yellow-400/15 text-yellow-300 px-3 py-1 rounded-xl text-sm font-bold">Grupo {team.group}</span></div><p className="text-gray-400 mt-2">DT: {team.coach}</p><div className="mt-5 space-y-3">{team.players.map((pl,idx)=><div key={idx} className="bg-[#07111F] rounded-2xl p-4 border border-white/5"><div className="flex items-center justify-between gap-3"><div><p className="font-black text-lg">{pl.number ? `#${pl.number} ` : ''}{pl.name}</p><p className="text-gray-400 text-sm">{pl.position} · {pl.club}</p></div><div className="text-right text-xs text-gray-400"><p>Edad: {pl.age || '—'}</p><p>Altura: {pl.height || '—'}</p><p>Peso: {pl.weight || '—'}</p></div></div><p className="text-xs text-gray-500 mt-2">Nacimiento: {pl.birthDate || '—'}</p></div>)}</div></div>)}</div></section>}

      {tab==='ranking' && <section><h2 className="text-3xl font-black mb-5">🏆 Ranking</h2><div className="space-y-3">{ranking.map((r,i)=><div key={r.uid} className="bg-[#0B1727] rounded-2xl p-5 flex justify-between border border-white/10"><span className="font-black text-xl">{i+1}. {i===0?'👑 ':''}{r.name}</span><span className="text-green-300 font-black">{r.points} pts · 🎯 {r.exactos}</span></div>)}</div></section>}
      {tab==='profile' && <section className="bg-[#0B1727] rounded-3xl p-6 border border-white/10"><h2 className="text-3xl font-black">👤 {profile?.name}</h2><p className="text-gray-400 mt-2">{user.email}</p><p className="mt-4">Rol: <b>{isAdmin?'Administrador':'Jugador'}</b></p></section>}
      {tab==='admin' && isAdmin && <Admin matches={matches} seed={seed} updateResult={updateResult}/>} 
    </main><BottomNav tab={tab} setTab={setTab} isAdmin={isAdmin}/>
  </div>
}
function Stat({t,v}){return <div className="bg-[#0B1727] rounded-3xl p-5 border border-white/10"><p className="text-gray-400 text-sm">{t}</p><h3 className="text-3xl font-black mt-2">{v}</h3></div>}
function Admin({matches,seed,updateResult}){ const [scores,setScores]=useState({}); return <section className="space-y-5"><h2 className="text-3xl font-black">🛠 Panel Admin</h2><button onClick={seed} className="bg-yellow-400 text-black px-5 py-3 rounded-2xl font-black">Inicializar grupos y partidos</button><div className="grid md:grid-cols-2 gap-4">{matches.map(m=><div key={m.id} className="bg-[#0B1727] rounded-3xl p-5 border border-white/10"><p className="text-gray-400">{m.round}</p><h3 className="text-xl font-black mt-2">{teamFlag(m.home)} {m.home} vs {teamFlag(m.away)} {m.away}</h3><div className="flex gap-3 mt-4"><input type="number" placeholder="Local" className="w-24 bg-[#07111F] border border-white/10 rounded-xl p-3" onChange={e=>setScores({...scores,[m.id]:{...(scores[m.id]||{}),h:e.target.value}})} /><input type="number" placeholder="Visita" className="w-24 bg-[#07111F] border border-white/10 rounded-xl p-3" onChange={e=>setScores({...scores,[m.id]:{...(scores[m.id]||{}),a:e.target.value}})} /><button onClick={()=>updateResult(m,scores[m.id]?.h ?? 0,scores[m.id]?.a ?? 0,'finished')} className="bg-green-400 text-black px-4 rounded-xl font-bold">Guardar resultado</button></div></div>)}</div></section>}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
