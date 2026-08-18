import { Project, HydraulicResult } from "@/types/project";

const esc = (s: string) => s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const T = (x:number,y:number,s:string,size=13,anchor="start", cls="txt") => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" class="${cls}">${esc(s)}</text>`;
const L = (x1:number,y1:number,x2:number,y2:number,cls="pipeBlue") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
const V = (x:number,y:number) => `<g class="sym"><path d="M${x-12} ${y-10}L${x} ${y}L${x-12} ${y+10}Z"/><path d="M${x+12} ${y-10}L${x} ${y}L${x+12} ${y+10}Z"/></g>`;
const C = (x:number,y:number) => `<g class="sym"><path d="M${x-10} ${y-9}L${x+8} ${y}L${x-10} ${y+9}Z"/><line x1="${x+9}" y1="${y-11}" x2="${x+9}" y2="${y+11}"/></g>`;
const P = (x:number,y:number,label:string) => `<g><circle cx="${x}" cy="${y}" r="28" class="pump"/><path d="M${x-13} ${y+7}Q${x} ${y-15} ${x+15} ${y+4}" class="pumpWhite"/><path d="M${x+8} ${y-5}L${x+17} ${y+4}L${x+5} ${y+8}" class="pumpWhite"/><text x="${x}" y="${y+51}" text-anchor="middle" class="pumpLabel">${esc(label)}</text></g>`;
const box=(x:number,y:number,w:number,h:number)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="box"/>`;

export function renderSchematic(p: Project, h: HydraulicResult): string {
  const W=1700,H=980;
  const tank={x:1180,y:260,w:390,h:360};
  const pumpY=690, suctionY=790, dischargeY=510;
  const count=p.pumps.length;
  const spacing=Math.max(115,Math.min(170,650/Math.max(1,count)));
  const center=620;

  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <style>
  .txt{font-family:Arial,Helvetica,sans-serif;fill:#1b2430}.title{font-family:Arial,Helvetica,sans-serif;font-weight:700;fill:#101827}
  .pipeBlue{stroke:#1749e8;stroke-width:5;fill:none}.pipeGreen{stroke:#3aa800;stroke-width:5;fill:none}.pipeOrange{stroke:#f47b20;stroke-width:4;fill:none}
  .sym{stroke:#111;stroke-width:2;fill:white}.pump{fill:#d9222e;stroke:#8f1018;stroke-width:3}.pumpWhite{stroke:#fff;stroke-width:4;fill:none}
  .pumpLabel{font-family:Arial,sans-serif;font-size:14px;font-weight:700;fill:#20242b}.box{fill:white;stroke:#6e7784;stroke-width:2}
  .note{font-family:Arial,sans-serif;fill:#075e9c;font-size:13px}.dim{font-family:Arial,sans-serif;fill:#c21f2b;font-size:16px}
  .tank{fill:#fbfdff;stroke:#78a6ff;stroke-width:3}.water{fill:#dff4ff;opacity:.8}
  </style><rect width="100%" height="100%" fill="white"/>
  ${T(W/2,34,p.projectName,25,"middle","title")}
  ${T(W/2,57,`${p.client} · ${p.location} · ${p.systemType}`,13,"middle")}
  `;

  if(p.equipment.controlPanel){
    s+=`<g>${box(735,75,150,120)}<rect x="755" y="95" width="28" height="16" fill="#fff" stroke="#111"/>`;
    for(let i=0;i<15;i++){const x=805+(i%3)*28,y=103+Math.floor(i/3)*22;s+=`<circle cx="${x}" cy="${y}" r="6" fill="${i%4===0?"#dc2626":"#16a34a"}" stroke="#111"/>`}
    s+=T(810,220,"COFFRET DE COMMANDE",11,"middle")+" </g>";
  }

  // inlet
  s+=T(70,105,"ARRIVÉE EAU DE VILLE",15,"start","title");
  s+=T(70,128,`${p.piping.inletMaterial} / ${p.piping.inletDiameter}`,11);
  s+=L(80,155,300,155,"pipeGreen")+V(245,155)+L(300,155,430,155,"pipeGreen");
  s+=T(365,139,"Vanne / réduction",10,"middle");
  s+=C(500,155)+L(430,155,500,155,"pipeGreen")+L(510,155,650,155,"pipeGreen");
  s+=T(500,130,"Clapet anti-retour",10,"middle");
  s+=L(650,155,900,155,"pipeGreen")+L(900,155,1180,320,"pipeGreen");

  // tank
  s+=`<g><rect x="${tank.x}" y="${tank.y}" width="${tank.w}" height="${tank.h}" class="tank"/><path d="M${tank.x} ${tank.y+70}Q${tank.x+tank.w/2} ${tank.y+35} ${tank.x+tank.w} ${tank.y+70}" fill="none" stroke="#5bb8ff" stroke-width="2"/><rect x="${tank.x+55}" y="${tank.y+20}" width="105" height="55" fill="none" stroke="#78a6ff" stroke-width="3"/>${T(tank.x+107,tank.y+54,"TRAPPE",12,"middle")}<rect x="${tank.x+1}" y="${tank.y+230}" width="${tank.w-2}" height="128" class="water"/></g>`;
  s+=box(tank.x+75,tank.y-90,240,58)+T(tank.x+195,tank.y-64,"CAPACITÉ BÂCHE À EAU",14,"middle","title")+T(tank.x+195,tank.y-42,`${p.tank.capacityM3} m³`,16,"middle","title");
  s+=T(tank.x+tank.w/2,tank.y+tank.h+38,`${p.tank.lengthM.toFixed(2)} m`,16,"middle","dim");
  s+=T(tank.x+tank.w+45,tank.y+tank.h/2,`${p.tank.heightM.toFixed(2)} m`,16,"middle","dim");
  if(p.equipment.highLevel){s+=L(tank.x+285,tank.y+90,tank.x+285,tank.y+135,"pipeOrange")+T(tank.x+300,tank.y+108,"NIVEAU HAUT",10);}
  if(p.equipment.lowLevel){s+=L(tank.x+310,tank.y+180,tank.x+310,tank.y+225,"pipeOrange")+T(tank.x+325,tank.y+198,"NIVEAU BAS",10);}
  if(p.equipment.floatSwitch){s+=`<circle cx="${tank.x+340}" cy="${tank.y+150}" r="7" fill="#f47b20"/>${T(tank.x+355,tank.y+155,"FLOTTEUR",10)}`;}
  s+=L(tank.x+75,tank.y+230,tank.x+75,tank.y+130,"pipeBlue")+T(tank.x+90,tank.y+145,`TROP-PLEIN ${p.tank.overflowDiameter}`,10);
  s+=L(tank.x+195,tank.y+tank.h,tank.x+195,tank.y+tank.h+60,"pipeBlue")+T(tank.x+210,tank.y+tank.h+34,`VIDANGE ${p.tank.drainDiameter}`,10);

  // suction header
  s+=L(260,suctionY,1030,suctionY)+T(645,suctionY+34,`COLLECTEUR ASPIRATION ${p.piping.suctionDiameter}`,15,"middle","title");
  s+=T(265,suctionY-15,`${p.piping.suctionMaterial} · L=${p.piping.suctionLengthM} m`,10);
  s+=L(1030,suctionY,tank.x+30,tank.y+tank.h-30,"pipeGreen");
  if(p.equipment.suctionStrainer){C(1050,suctionY);T(1050,suctionY-22,"Crépine",10,"middle");}
  if(p.equipment.drainValve){L(430,suctionY,430,suctionY+45);V(430,suctionY+45);T(430,suctionY+70,"VIDANGE",9,"middle");}

  // pumps
  p.pumps.forEach((pump,i)=>{
    const x=center+(i-(count-1)/2)*spacing;
    L(x,suctionY,x,suctionY-92);
    if(p.equipment.isolationValvePerPump){V(x,suctionY-108);}
    P(x,pumpY,`P${pump.id} · ${pump.duty.toUpperCase()}`);
    L(x,pumpY-28,x,dischargeY+35);
    if(p.equipment.checkValvePerPump){C(x,dischargeY+18);}
    if(p.equipment.isolationValvePerPump){V(x,dischargeY-12);}
    L(x,dischargeY-32,x,dischargeY);
    if(pump.flowM3h>0)T(x,pumpY+75,`${pump.flowM3h} m³/h · ${pump.headM} m`,10,"middle");
  });

  // discharge header
  s+=L(260,dischargeY,1030,dischargeY)+T(645,dischargeY-22,`COLLECTEUR REFOULEMENT ${p.piping.dischargeDiameter}`,15,"middle","title");
  s+=T(265,dischargeY-40,`${p.piping.dischargeMaterial} · L=${p.piping.dischargeLengthM} m`,10);
  s+=L(1030,dischargeY,1030,330)+L(1030,330,tank.x,330)+T(1080,312,`DÉPART RÉSEAU ${p.piping.dischargeDiameter}`,10);
  if(p.equipment.pressureGauge){s+=`<circle cx="820" cy="${dischargeY-40}" r="14" class="sym"/>${T(820,dischargeY-66,"MANOMÈTRE",9,"middle")}`;}
  if(p.pressure.expansionVesselL>0){s+=`<ellipse cx="315" cy="${dischargeY-85}" rx="35" ry="55" fill="#df1e2a" stroke="#8f1018" stroke-width="3"/>${T(315,dischargeY-150,`VASE ${p.pressure.expansionVesselL} L`,10,"middle")}`;}

  // calculation card
  s+=box(55,845,420,105);
  s+=T(72,870,`Q SERVICE : ${h.dutyFlowM3h.toFixed(1)} m³/h`,13,"start","note");
  s+=T(72,893,`HMT ESTIMÉE : ${h.estimatedTotalHeadM.toFixed(1)} m`,13,"start","note");
  s+=T(72,916,`VITESSE ASP. : ${h.suctionVelocityMS.toFixed(2)} m/s · REFOU. : ${h.dischargeVelocityMS.toFixed(2)} m/s`,11,"start","note");
  s+=T(72,938,`DIAMÈTRES CONSEILLÉS : ${h.recommendedSuctionDiameter} / ${h.recommendedDischargeDiameter}`,11,"start","note");

  // legend
  const lx=1190,ly=690;
  s+=box(lx,ly,390,160)+T(lx+195,ly+24,"LÉGENDE",14,"middle","title");
  s+=L(lx+20,ly+50,lx+70,ly+50)+T(lx+90,ly+54,"Canalisation pression",11);
  s+=L(lx+20,ly+78,lx+70,ly+78,"pipeGreen")+T(lx+90,ly+82,"PEHD PN10",11);
  s+=`<circle cx="${lx+45}" cy="${ly+106}" r="7" fill="#f47b20"/>${T(lx+90,ly+110,"Flotteur / niveau",11)}`;
  s+=V(lx+45,ly+132)+T(lx+90,ly+136,"Vanne d'isolement",11);
  s+=C(lx+45,ly+158)+T(lx+90,ly+162,"Clapet anti-retour",11);

  s+="</svg>";
  return s;
}
