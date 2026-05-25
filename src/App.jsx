
import { useEffect, useMemo, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, ADMIN_EMAIL } from "./firebase";
import { MATCHES, TEAMS } from "./data/worldCupData";
import { buildGroupTables, pointsForPrediction } from "./utils/scoring";
import "./index.css";

const tabs = [
  ["home","🏠","Inicio"],
  ["predict","🎯","Pronosticar"],
  ["groups","📊","Grupos"],
  ["teams","🌍","Equipos"],
  ["ranking","🏆","Ranking"],
  ["profile","👤","Perfil"],
  ["admin","🛠️","Admin"],
];

function asNumberString(v){ return v === undefined || v === null ? "" : String(v); }

export default function App() {
  const [user,setUser]=useState(null);
  const [authMode,setAuthMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [tab,setTab]=useState("home");
  const [predictions,setPredictions]=useState({});
  const [results,setResults]=useState({});
  const [users,setUsers]=useState({});
  const [draftPred,setDraftPred]=useState({});
  const [draftResults,setDraftResults]=useState({});
  const [message,setMessage]=useState("");
  const [selectedTeam,setSelectedTeam]=useState(null);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(()=> onAuthStateChanged(auth, async (u)=>{
    setUser(u);
    if(u){
      const ref = doc(db,"users",u.uid);
      const snap = await getDoc(ref).catch(()=>null);
      if(!snap?.exists()){
        await setDoc(ref,{uid:u.uid,email:u.email,name:u.email?.split("@")[0] || "Jugador",role:u.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase()?"admin":"player",createdAt:serverTimestamp()},{merge:true}).catch(()=>{});
      }
    }
  }),[]);

  useEffect(()=>{
    const unsubUsers = onSnapshot(collection(db,"users"), snap=>{
      const obj={}; snap.forEach(d=> obj[d.id]=d.data()); setUsers(obj);
    },()=>{});
    const unsubPred = onSnapshot(collection(db,"predictions"), snap=>{
      const obj={}; snap.forEach(d=> obj[d.id]=d.data()); setPredictions(obj);
    },()=>{});
    const unsubRes = onSnapshot(collection(db,"results"), snap=>{
      const obj={}; snap.forEach(d=> obj[d.id]=d.data()); setResults(obj);
    },()=>{});
    return ()=>{unsubUsers();unsubPred();unsubRes();}
  },[]);

  async function handleAuth(e){
    e.preventDefault(); setMessage("");
    try{
      if(authMode==="register"){
        const cred = await createUserWithEmailAndPassword(auth,email,password);
        await setDoc(doc(db,"users",cred.user.uid),{uid:cred.user.uid,email,name:name || email.split("@")[0],role:email.toLowerCase()===ADMIN_EMAIL.toLowerCase()?"admin":"player",createdAt:serverTimestamp()},{merge:true});
      } else {
        await signInWithEmailAndPassword(auth,email,password);
      }
    }catch(err){ setMessage("Error de login: "+err.message); }
  }

  async function savePrediction(matchId){
    if(!user) return setMessage("Inicia sesión primero.");
    const d = draftPred[matchId] || {};
    if(d.homeGoals === "" || d.awayGoals === "" || d.homeGoals === undefined || d.awayGoals === undefined) return setMessage("Escribe los dos marcadores.");
    const payload={uid:user.uid,email:user.email,matchId,homeGoals:Number(d.homeGoals),awayGoals:Number(d.awayGoals),updatedAt:serverTimestamp()};
    try{
      await setDoc(doc(db,"predictions",`${user.uid}_${matchId}`),payload,{merge:true});
      setMessage("Pronóstico guardado ✅");
    }catch(err){ setMessage("No se pudo guardar en Firebase: "+err.message); }
  }

  async function saveResult(matchId){
    if(!isAdmin) return setMessage("Solo el admin puede guardar resultados.");
    const d = draftResults[matchId] || {};
    if(d.homeGoals === "" || d.awayGoals === "" || d.homeGoals === undefined || d.awayGoals === undefined) return setMessage("Escribe los dos marcadores.");
    const payload={matchId,homeGoals:Number(d.homeGoals),awayGoals:Number(d.awayGoals),status:"finished",updatedAt:serverTimestamp()};
    try{
      await setDoc(doc(db,"results",matchId),payload,{merge:true});
      setMessage("Resultado guardado y tablas actualizadas ✅");
    }catch(err){ setMessage("No se pudo guardar resultado: "+err.message); }
  }

  const myPredictions = useMemo(()=>{
    const obj={};
    Object.values(predictions).filter(p=>p.uid===user?.uid).forEach(p=>obj[p.matchId]=p);
    return obj;
  },[predictions,user]);

  const ranking = useMemo(()=>{
    const rows={};
    Object.values(users).forEach(u=> rows[u.uid]={uid:u.uid,name:u.name||u.email,email:u.email,pts:0,exactos:0,predCount:0});
    Object.values(predictions).forEach(p=>{
      if(!rows[p.uid]) rows[p.uid]={uid:p.uid,name:p.email,email:p.email,pts:0,exactos:0,predCount:0};
      const pts = pointsForPrediction(p, results[p.matchId]);
      rows[p.uid].pts += pts; rows[p.uid].predCount++;
      if(pts===5) rows[p.uid].exactos++;
    });
    return Object.values(rows).sort((a,b)=>b.pts-a.pts || b.exactos-a.exactos || a.name.localeCompare(b.name));
  },[predictions,results,users]);

  const tables = useMemo(()=> buildGroupTables(TEAMS, MATCHES, results),[results]);
  const groupMatches = MATCHES.filter(m=>m.stage==="Grupo");
  const playersCount = Math.max(Object.keys(users).length, user ? 1 : 0);
  const leader = ranking[0]?.name || "Sin líder";

  if(!user){
    return <div className="loginPage">
      <div className="loginCard">
        <h1>⚽ Mundial Predictor 2026</h1>
        <p>Liga privada de pronósticos</p>
        <form onSubmit={handleAuth}>
          {authMode==="register" && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre visible" />}
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Correo" type="email" required />
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" type="password" required />
          <button type="submit">{authMode==="login"?"Entrar":"Crear cuenta"}</button>
        </form>
        <button className="linkBtn" onClick={()=>setAuthMode(authMode==="login"?"register":"login")}>{authMode==="login"?"Crear cuenta nueva":"Ya tengo cuenta"}</button>
        {message && <div className="msg">{message}</div>}
      </div>
    </div>
  }

  return <div className="app">
    <header>
      <div><h1>⚽ Mundial Predictor 2026</h1><p>Liga privada de pronósticos</p></div>
      <button onClick={()=>signOut(auth)}>Salir</button>
    </header>

    {message && <div className="toast">{message}</div>}

    <main>
      {tab==="home" && <section>
        <div className="statsGrid">
          <div className="stat"><span>Jugadores</span><b>{playersCount}</b></div>
          <div className="stat"><span>Partidos</span><b>{MATCHES.length}</b><small>72 grupos + 32 eliminatorias</small></div>
          <div className="stat"><span>Líder</span><b>{leader}</b></div>
          <div className="stat"><span>Tus puntos</span><b>{ranking.find(r=>r.uid===user.uid)?.pts || 0}</b></div>
        </div>
        <h2>📅 Próximos partidos</h2>
        <div className="matchGrid">{groupMatches.slice(0,8).map(m=><MatchCard key={m.id} m={m} result={results[m.id]} />)}</div>
      </section>}

      {tab==="predict" && <section>
        <h2>🎯 Pronósticos</h2>
        <p className="hint">Escribe marcador y pulsa Guardar. Debe salir mensaje “Pronóstico guardado”.</p>
        <div className="matchGrid">
          {MATCHES.slice(0,72).map(m=>{
            const saved = myPredictions[m.id];
            const draft = draftPred[m.id] || saved || {};
            return <div className="card" key={m.id}>
              <div className="cardTop"><span>{m.stage} {m.group && "· Grupo "+m.group}</span><span className="badge">ABIERTO</span></div>
              <h3>{m.homeFlag} {m.home}</h3><h3>{m.awayFlag} {m.away}</h3>
              <div className="scoreEdit">
                <input type="number" min="0" value={asNumberString(draft.homeGoals)} onChange={e=>setDraftPred({...draftPred,[m.id]:{...draft,homeGoals:e.target.value}})} />
                <span>-</span>
                <input type="number" min="0" value={asNumberString(draft.awayGoals)} onChange={e=>setDraftPred({...draftPred,[m.id]:{...draft,awayGoals:e.target.value}})} />
              </div>
              <button className="primary" onClick={()=>savePrediction(m.id)}>Guardar pronóstico</button>
              {saved && <small>Guardado: {saved.homeGoals}-{saved.awayGoals}</small>}
            </div>
          })}
        </div>
      </section>}

      {tab==="groups" && <section>
        <h2>📊 Grupos</h2>
        {Object.keys(tables).sort().map(g=><div className="tableWrap" key={g}>
          <h3>Grupo {g}</h3>
          <table><thead><tr><th>País</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr></thead>
          <tbody>{tables[g].map(r=><tr key={r.team}><td>{r.flag} {r.team}</td><td>{r.pj}</td><td>{r.g}</td><td>{r.e}</td><td>{r.p}</td><td>{r.gf}</td><td>{r.gc}</td><td>{r.dg}</td><td><b>{r.pts}</b></td></tr>)}</tbody></table>
        </div>)}
      </section>}

      {tab==="teams" && <section>
        <h2>🌍 Equipos</h2>
        <p className="hint">Las plantillas finales se cargan cuando estén verificadas. La app está lista para 26 jugadores por selección.</p>
        <div className="teamGrid">{TEAMS.map(t=><button className="teamBtn" key={t.code} onClick={()=>setSelectedTeam(t)}>{t.flag}<b>{t.name}</b><span>Grupo {t.group}</span></button>)}</div>
        {selectedTeam && <div className="modal"><div className="modalContent"><button className="close" onClick={()=>setSelectedTeam(null)}>×</button><h2>{selectedTeam.flag} {selectedTeam.name}</h2><p>Grupo {selectedTeam.group}</p><h3>Plantilla</h3><p className="hint">Pendiente de lista oficial/verificada. Aquí aparecerán nombre, club, edad, nacimiento, altura, peso, número y posición.</p></div></div>}
      </section>}

      {tab==="ranking" && <section>
        <h2>🏆 Ranking</h2>
        <div className="tableWrap"><table><thead><tr><th>#</th><th>Jugador</th><th>Puntos</th><th>Exactos</th><th>Pronósticos</th></tr></thead><tbody>{ranking.map((r,i)=><tr key={r.uid}><td>{i+1}</td><td>{i===0?"👑 ":""}{r.name}</td><td><b>{r.pts}</b></td><td>{r.exactos}</td><td>{r.predCount}</td></tr>)}</tbody></table></div>
      </section>}

      {tab==="profile" && <section><h2>👤 Perfil</h2><div className="card"><h3>{user.email}</h3><p>Rol: {isAdmin?"Admin":"Jugador"}</p><p>Puntos: {ranking.find(r=>r.uid===user.uid)?.pts || 0}</p></div></section>}

      {tab==="admin" && <section>
        <h2>🛠️ Panel Admin</h2>
        {!isAdmin && <div className="card danger">No eres admin. Entra con {ADMIN_EMAIL}</div>}
        {isAdmin && <>
          <p className="hint">Escribe resultado oficial y pulsa Guardar. Las tablas de grupos y ranking se actualizan solas.</p>
          <div className="matchGrid">{MATCHES.slice(0,72).map(m=>{
            const saved = results[m.id];
            const draft = draftResults[m.id] || saved || {};
            return <div className="card" key={m.id}>
              <div className="cardTop"><span>Partido {m.matchNo} · Grupo {m.group}</span><span className={saved?"badge done":"badge"}>{saved?"FINAL":"PENDIENTE"}</span></div>
              <h3>{m.homeFlag} {m.home}</h3><h3>{m.awayFlag} {m.away}</h3>
              <div className="scoreEdit">
                <input type="number" min="0" value={asNumberString(draft.homeGoals)} onChange={e=>setDraftResults({...draftResults,[m.id]:{...draft,homeGoals:e.target.value}})} />
                <span>-</span>
                <input type="number" min="0" value={asNumberString(draft.awayGoals)} onChange={e=>setDraftResults({...draftResults,[m.id]:{...draft,awayGoals:e.target.value}})} />
              </div>
              <button className="primary" onClick={()=>saveResult(m.id)}>Guardar resultado</button>
              {saved && <small>Resultado guardado: {saved.homeGoals}-{saved.awayGoals}</small>}
            </div>
          })}</div>
        </>}
      </section>}
    </main>

    <nav>{tabs.map(([id,icon,label])=><button key={id} onClick={()=>setTab(id)} className={tab===id?"active":""}><span>{icon}</span><small>{label}</small></button>)}</nav>
  </div>
}

function MatchCard({m,result}){
  return <div className="card">
    <div className="cardTop"><span>{m.stage} {m.group && "· Grupo "+m.group}</span><span className={result?"badge done":"badge"}>{result?"FINAL":"ABIERTO"}</span></div>
    <h3>{m.homeFlag} {m.home}</h3>
    <h3>{m.awayFlag} {m.away}</h3>
    <div className="resultLine">{result ? `${result.homeGoals} - ${result.awayGoals}` : "-  -  -"}</div>
  </div>
}
