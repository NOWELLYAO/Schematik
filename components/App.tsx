"use client";

import { useMemo, useState } from "react";
import { defaultProject } from "@/lib/defaults";
import { calculateHydraulics } from "@/lib/hydraulics";
import { buildBom } from "@/lib/bom";
import { normalizeProject } from "@/lib/project";
import { renderSchematic } from "@/lib/svg-engine";
import { Project } from "@/types/project";
import Schematic from "./Schematic";

type Tab="schema"|"calcul"|"bom";

const DN=["DN50","DN65","DN80","DN100","DN125","DN150","DN200"];

export default function App(){
  const [p,setP]=useState<Project>(defaultProject);
  const [tab,setTab]=useState<Tab>("schema");
  const [ai,setAi]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  const h=useMemo(()=>calculateHydraulics(p),[p]);
  const bom=useMemo(()=>buildBom(p),[p]);
  const svg=useMemo(()=>renderSchematic(p,h),[p,h]);

  const set=(fn:(x:Project)=>Project)=>setP(x=>fn(structuredClone(x)));
  const update=(path:string,value:any)=>{
    set(x=>{
      const parts=path.split(".");
      let obj:any=x;
      for(let i=0;i<parts.length-1;i++) obj=obj[parts[i]];
      obj[parts.at(-1)!]=value;
      return x;
    });
  };
  const n=(v:string,d=0)=>Number.isFinite(Number(v))?Number(v):d;

  function addPump(){
    if(p.pumps.length>=6)return;
    const id=p.pumps.length+1;
    set(x=>({...x,pumps:[...x.pumps,{id,model:`Pompe ${id}`,duty:"secours",flowM3h:0,headM:0,powerKW:0}]}));
  }
  function removePump(){ if(p.pumps.length>1)set(x=>({...x,pumps:x.pumps.slice(0,-1)})); }
  function pumpUpdate(i:number,key:string,value:any){set(x=>({...x,pumps:x.pumps.map((q,j)=>j===i?{...q,[key]:value}:q)}));}

  function download(name:string,blob:Blob){
    const url=URL.createObjectURL(blob); const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  function exportSvg(){download("pump-schematic.svg",new Blob([svg],{type:"image/svg+xml"}));}
  function exportJson(){download("pump-project.json",new Blob([JSON.stringify(p,null,2)],{type:"application/json"}));}
  function importJson(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{try{setP(normalizeProject(JSON.parse(String(reader.result))));setMessage("Projet importé.");}catch{setMessage("JSON invalide.");}};
    reader.readAsText(file); e.target.value="";
  }
  function exportPng(){
    const image=new Image();
    image.onload=()=>{
      const canvas=document.createElement("canvas");canvas.width=1700;canvas.height=980;
      const ctx=canvas.getContext("2d")!;ctx.fillStyle="#fff";ctx.fillRect(0,0,1700,980);ctx.drawImage(image,0,0);
      canvas.toBlob(b=>b&&download("pump-schematic.png",b),"image/png");
    };
    image.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  }

  async function generateAI(){
    if(!ai.trim())return;
    setBusy(true);setMessage("");
    try{
      const r=await fetch("/api/ai-plan",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({description:ai,current:p})});
      const d=await r.json(); if(!r.ok)throw new Error(d.error||"Erreur");
      setP(normalizeProject(d.project)); setMessage("Configuration IA appliquée. Vérifie les données avant validation.");
    }catch(e:any){setMessage(e.message||"Erreur IA");}
    finally{setBusy(false);}
  }

  const field=(label:string,value:any,onChange:(v:any)=>void,type="text")=><label>{label}<input type={type} value={value} onChange={e=>onChange(type==="number"?n(e.target.value):e.target.value)}/></label>;
  const select=(label:string,value:string,onChange:(v:string)=>void,opts:string[])=><label>{label}<select value={value} onChange={e=>onChange(e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select></label>;

  return <div className="app">
    <header className="header">
      <div><div className="logo">PUMP<span>SCHEMATIC</span> PRO</div><div className="sub">Hydraulic Engineering Studio · deterministic schematic engine</div></div>
      <div className="actions"><button onClick={exportSvg}>SVG</button><button onClick={exportPng}>PNG</button><button onClick={()=>window.print()}>PDF</button><button onClick={exportJson}>JSON</button><label className="import">Importer<input type="file" accept=".json,application/json" onChange={importJson}/></label></div>
    </header>

    <div className="layout">
      <aside className="sidebar">
        <section><h3>Projet</h3>{field("Nom",p.projectName,v=>update("projectName",v))}<div className="two">{field("Client",p.client,v=>update("client",v))}{field("Lieu",p.location,v=>update("location",v))}</div>{field("Type d'installation",p.systemType,v=>update("systemType",v))}</section>

        <section><h3>Assistant IA</h3><textarea value={ai} onChange={e=>setAi(e.target.value)} placeholder="Ex. 3 pompes, 2 service + 1 secours, CRE 10-8, bâche 30 m³, aspiration DN100, refoulement DN80, 5 bar..."/><button className="ai" disabled={busy} onClick={generateAI}>{busy?"Analyse…":"Construire avec l'IA"}</button>{message&&<div className="message">{message}</div>}</section>

        <section><h3>Bâche</h3><div className="three">{field("Volume m³",p.tank.capacityM3,v=>update("tank.capacityM3",v),"number")}{field("Longueur m",p.tank.lengthM,v=>update("tank.lengthM",v),"number")}{field("Largeur m",p.tank.widthM,v=>update("tank.widthM",v),"number")}</div>{field("Hauteur m",p.tank.heightM,v=>update("tank.heightM",v),"number")}<div className="two">{select("Trop-plein",p.tank.overflowDiameter,v=>update("tank.overflowDiameter",v),DN)}{select("Vidange",p.tank.drainDiameter,v=>update("tank.drainDiameter",v),DN)}</div></section>

        <section><h3>Réseaux</h3><div className="two">{select("Aspiration",p.piping.suctionDiameter,v=>update("piping.suctionDiameter",v),DN)}{select("Refoulement",p.piping.dischargeDiameter,v=>update("piping.dischargeDiameter",v),DN)}</div><div className="two">{field("L aspiration m",p.piping.suctionLengthM,v=>update("piping.suctionLengthM",v),"number")}{field("L refoulement m",p.piping.dischargeLengthM,v=>update("piping.dischargeLengthM",v),"number")}</div><div className="two">{field("Élévation m",p.piping.elevationM,v=>update("piping.elevationM",v),"number")}{field("Coudes ref.",p.piping.dischargeElbows,v=>update("piping.dischargeElbows",v),"number")}</div><div className="two">{field("Matériau asp.",p.piping.suctionMaterial,v=>update("piping.suctionMaterial",v))}{field("Matériau ref.",p.piping.dischargeMaterial,v=>update("piping.dischargeMaterial",v))}</div></section>

        <section><h3>Pompes <span className="count">{p.pumps.length}/6</span></h3><div className="pumpbar"><button onClick={removePump}>−</button><b>{p.pumps.filter(x=>x.duty==="service").length} service · {p.pumps.filter(x=>x.duty==="secours").length} secours</b><button onClick={addPump}>+</button></div>
          {p.pumps.map((q,i)=><div className="pumpCard" key={q.id}><div className="pumpHead"><b>P{q.id}</b><select value={q.duty} onChange={e=>pumpUpdate(i,"duty",e.target.value)}><option value="service">Service</option><option value="secours">Secours</option></select></div>{field("Modèle",q.model,v=>pumpUpdate(i,"model",v))}<div className="three">{field("Q m³/h",q.flowM3h,v=>pumpUpdate(i,"flowM3h",v),"number")}{field("H m",q.headM,v=>pumpUpdate(i,"headM",v),"number")}{field("P kW",q.powerKW,v=>pumpUpdate(i,"powerKW",v),"number")}</div></div>)}
        </section>

        <section><h3>Pression</h3><div className="three">{field("Pmin bar",p.pressure.minBar,v=>update("pressure.minBar",v),"number")}{field("Pmax bar",p.pressure.maxBar,v=>update("pressure.maxBar",v),"number")}{field("Vase L",p.pressure.expansionVesselL,v=>update("pressure.expansionVesselL",v),"number")}</div></section>

        <section><h3>Équipements</h3><div className="checks">{[
          ["isolationValvePerPump","Vanne isolement"],["checkValvePerPump","Clapet par pompe"],["pressureGauge","Manomètre"],["suctionStrainer","Crépine aspiration"],["drainValve","Vidange"],["highLevel","Niveau haut"],["lowLevel","Niveau bas"],["floatSwitch","Flotteur"],["controlPanel","Coffret"]
        ].map(([k,l])=><label className="check" key={k}><input type="checkbox" checked={(p.equipment as any)[k]} onChange={e=>update(`equipment.${k}`,e.target.checked)}/>{l}</label>)}</div></section>
        <section>{field("Notes",p.notes,v=>update("notes",v))}</section>
      </aside>

      <main className="main">
        <nav className="tabs"><button className={tab==="schema"?"active":""} onClick={()=>setTab("schema")}>Schéma</button><button className={tab==="calcul"?"active":""} onClick={()=>setTab("calcul")}>Calcul hydraulique</button><button className={tab==="bom"?"active":""} onClick={()=>setTab("bom")}>Nomenclature</button></nav>

        {tab==="schema"&&<div className="stage"><div className="stageTop"><div><b>Schéma technique</b><small>SVG vectoriel · géométrie déterministe · {p.pumps.length} pompes</small></div><div className="live">● LIVE</div></div><div className="sheet"><Schematic project={p} hydraulic={h}/></div></div>}

        {tab==="calcul"&&<div className="cardGrid"><div className="metric"><small>Débit service</small><strong>{h.dutyFlowM3h.toFixed(1)} m³/h</strong></div><div className="metric"><small>HMT estimée</small><strong>{h.estimatedTotalHeadM.toFixed(1)} m</strong></div><div className="metric"><small>Puissance hydraulique</small><strong>{h.estimatedHydraulicPowerKW.toFixed(2)} kW</strong></div><div className="metric"><small>Vitesse aspiration</small><strong>{h.suctionVelocityMS.toFixed(2)} m/s</strong></div><div className="metric"><small>Vitesse refoulement</small><strong>{h.dischargeVelocityMS.toFixed(2)} m/s</strong></div><div className="metric"><small>Diamètres conseillés</small><strong>{h.recommendedSuctionDiameter} / {h.recommendedDischargeDiameter}</strong></div><div className="wide card"><h3>Décomposition de la HMT</h3><div className="rows"><span>Pression max</span><b>{(p.pressure.maxBar*10.197).toFixed(1)} m</b><span>Élévation statique</span><b>{h.staticHeadM.toFixed(1)} m</b><span>Pertes aspiration</span><b>{h.suctionLossM.toFixed(2)} m</b><span>Pertes refoulement</span><b>{h.dischargeLossM.toFixed(2)} m</b><span>Total estimé</span><b>{h.estimatedTotalHeadM.toFixed(1)} m</b></div></div><div className="wide card"><h3>Contrôles</h3>{h.warnings.length? h.warnings.map((w,i)=><div className="warning" key={i}>⚠ {w}</div>):<div className="ok">✓ Aucun avertissement de base.</div>}<p className="disclaimer">Ces calculs sont des estimations de pré-dimensionnement. Toujours vérifier les courbes fabricant, NPSH, matériaux, normes locales et conditions réelles du site.</p></div></div>}

        {tab==="bom"&&<div className="card"><div className="bomHead"><div><h2>Nomenclature</h2><p>Générée automatiquement à partir du schéma.</p></div><button onClick={()=>download("nomenclature.json",new Blob([JSON.stringify(bom,null,2)],{type:"application/json"}))}>Exporter JSON</button></div><table><thead><tr><th>Catégorie</th><th>Désignation</th><th>Qté</th><th>Spécification</th></tr></thead><tbody>{bom.map((x,i)=><tr key={i}><td>{x.category}</td><td>{x.designation}</td><td>{x.quantity}</td><td>{x.specification}</td></tr>)}</tbody></table></div>}
      </main>
    </div>
  </div>
}
