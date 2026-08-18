import { Project, HydraulicResult } from "@/types/project";

const esc = (s: string) => s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const T = (x:number,y:number,s:string,size=13,anchor="start", cls="txt") => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" class="${cls}">${esc(s)}</text>`;
const box=(x:number,y:number,w:number,h:number)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="box"/>`;

// ---- pipe rendering (double-line "tube" style instead of thin single lines) ----
const PIPE_FILL: Record<string,string> = { pipeBlue:"url(#bluePipe)", pipeGreen:"url(#pehdPattern)", pipeOrange:"url(#orangePipe)" };
const PIPE_STROKE: Record<string,string> = { pipeBlue:"#0d2fa8", pipeGreen:"#2f7d00", pipeOrange:"#c95c00" };
const PIPE_WIDTH: Record<string,number> = { pipeBlue:12, pipeGreen:12, pipeOrange:8 };

const L = (x1:number,y1:number,x2:number,y2:number,cls="pipeBlue") => {
  const th = PIPE_WIDTH[cls] ?? 9;
  const dx=x2-x1, dy=y2-y1;
  const len=Math.hypot(dx,dy)||1;
  const px=-dy/len*th/2, py=dx/len*th/2;
  const pts=[[x1+px,y1+py],[x2+px,y2+py],[x2-px,y2-py],[x1-px,y1-py]].map(pt=>pt.join(",")).join(" ");
  const highlight = cls==="pipeBlue" && y1===y2
    ? `<line x1="${x1}" y1="${y1-th*0.2}" x2="${x2}" y2="${y2-th*0.2}" stroke="#8fb0ff" stroke-width="${Math.max(1.5,th*0.18)}" stroke-linecap="round" opacity="0.75"/>`
    : "";
  return `<g><polygon points="${pts}" fill="${PIPE_FILL[cls] ?? "#999"}" stroke="${PIPE_STROKE[cls] ?? "#333"}" stroke-width="1.6" stroke-linejoin="round"/>${highlight}</g>`;
};

// small flange/elbow marker at pipe joints and direction changes
const J = (x:number,y:number) => `<rect x="${x-5}" y="${y-5}" width="10" height="10" fill="#222" stroke="#000" stroke-width="0.5" rx="1"/>`;

// isolation valve — bowtie with flange caps
const V = (x:number,y:number) => `<g class="sym">
  <rect x="${x-16}" y="${y-3}" width="6" height="6" fill="#fff" stroke="#111" stroke-width="1.5"/>
  <path d="M${x-9} ${y-11}L${x} ${y}L${x-9} ${y+11}Z" fill="#fff" stroke="#111" stroke-width="2"/>
  <path d="M${x+9} ${y-11}L${x} ${y}L${x+9} ${y+11}Z" fill="#fff" stroke="#111" stroke-width="2"/>
  <rect x="${x+10}" y="${y-3}" width="6" height="6" fill="#fff" stroke="#111" stroke-width="1.5"/>
</g>`;

// check valve — triangle + stop bar with flange cap
const C = (x:number,y:number) => `<g class="sym">
  <rect x="${x-14}" y="${y-3}" width="5" height="6" fill="#fff" stroke="#111" stroke-width="1.5"/>
  <path d="M${x-9} ${y-10}L${x+8} ${y}L${x-9} ${y+10}Z" fill="#fff" stroke="#111" stroke-width="2"/>
  <line x1="${x+10}" y1="${y-12}" x2="${x+10}" y2="${y+12}" stroke="#111" stroke-width="2.5"/>
</g>`;

// pump with radial shading
const P = (x:number,y:number,label:string) => `<g><circle cx="${x}" cy="${y}" r="28" fill="url(#pumpGrad)" stroke="#7a0e14" stroke-width="3"/><path d="M${x-13} ${y+7}Q${x} ${y-15} ${x+15} ${y+4}" stroke="#fff" stroke-width="4" fill="none"/><path d="M${x+8} ${y-5}L${x+17} ${y+4}L${x+5} ${y+8}" stroke="#fff" stroke-width="4" fill="none"/><text x="${x}" y="${y+51}" text-anchor="middle" class="pumpLabel">${esc(label)}</text></g>`;

// dimension lines with arrowheads (technical drafting style)
const dimH = (x1:number,x2:number,y:number,label:string) => `<g>
  <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#c21f2b" stroke-width="1.5"/>
  <line x1="${x1}" y1="${y-7}" x2="${x1}" y2="${y+7}" stroke="#c21f2b" stroke-width="1.5"/>
  <line x1="${x2}" y1="${y-7}" x2="${x2}" y2="${y+7}" stroke="#c21f2b" stroke-width="1.5"/>
  <polygon points="${x1},${y} ${x1+9},${y-4} ${x1+9},${y+4}" fill="#c21f2b"/>
  <polygon points="${x2},${y} ${x2-9},${y-4} ${x2-9},${y+4}" fill="#c21f2b"/>
  ${T((x1+x2)/2,y-9,label,15,"middle","dim")}
</g>`;
const dimV = (x:number,y1:number,y2:number,label:string) => `<g>
  <line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#c21f2b" stroke-width="1.5"/>
  <line x1="${x-7}" y1="${y1}" x2="${x+7}" y2="${y1}" stroke="#c21f2b" stroke-width="1.5"/>
  <line x1="${x-7}" y1="${y2}" x2="${x+7}" y2="${y2}" stroke="#c21f2b" stroke-width="1.5"/>
  <polygon points="${x},${y1} ${x-4},${y1+9} ${x+4},${y1+9}" fill="#c21f2b"/>
  <polygon points="${x},${y2} ${x-4},${y2-9} ${x+4},${y2-9}" fill="#c21f2b"/>
  ${T(x+16,(y1+y2)/2,label,15,"middle","dim")}
</g>`;

// tank drawn in pseudo-3D (roof + side face + front face + water fill), like the reference plan
function tankSVG(tank:{x:number,y:number,w:number,h:number}) {
  const {x,y,w,h}=tank;
  const skx=75, sky=-58;
  const topPts = `${x},${y} ${x+w},${y} ${x+w+skx},${y+sky} ${x+skx},${y+sky}`;
  const waterY = y + h*0.62;
  let out = `<g>`;
  out += `<polygon points="${x+w},${y} ${x+w+skx},${y+sky} ${x+w+skx},${y+sky+h} ${x+w},${y+h}" fill="#eaf4ff" stroke="#5b93e0" stroke-width="2"/>`;
  out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fbfdff" stroke="#5b93e0" stroke-width="2.5"/>`;
  out += `<rect x="${x+2}" y="${waterY}" width="${w-4}" height="${y+h-waterY-2}" fill="url(#waterGrad)"/>`;
  out += `<line x1="${x+2}" y1="${waterY}" x2="${x+w-2}" y2="${waterY}" stroke="#8fd0ff" stroke-width="2"/>`;
  out += `<polygon points="${topPts}" fill="#f2f9ff" stroke="#5b93e0" stroke-width="2.5"/>`;
  const tw=95, thh=45, tx=x+70, ty=y+sky+18;
  out += `<rect x="${tx}" y="${ty}" width="${tw}" height="${thh}" fill="url(#hatchPattern)" stroke="#5b93e0" stroke-width="2"/>`;
  out += T(tx+tw/2, ty+thh/2+4, "TRAPPE", 11, "middle");
  out += "</g>";
  return out;
}

export function renderSchematic(p: Project, h: HydraulicResult): string {
  const W=1700,H=980;
  const tank={x:1180,y:260,w:390,h:360};
  const pumpY=690, suctionY=790, dischargeY=510;
  const count=p.pumps.length;
  const spacing=Math.max(115,Math.min(170,650/Math.max(1,count)));
  const center=620;

  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <pattern id="pehdPattern" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)">
      <rect width="9" height="9" fill="#3aa800"/>
      <line x1="0" y1="0" x2="0" y2="9" stroke="#2b7000" stroke-width="3.5"/>
    </pattern>
    <linearGradient id="bluePipe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4d6dff"/><stop offset="0.5" stop-color="#1338c9"/><stop offset="1" stop-color="#3554e6"/>
    </linearGradient>
    <linearGradient id="orangePipe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb066"/><stop offset="0.5" stop-color="#f47b20"/><stop offset="1" stop-color="#e46c14"/>
    </linearGradient>
    <radialGradient id="pumpGrad" cx="35%" cy="30%" r="75%">
      <stop offset="0" stop-color="#ff5b63"/><stop offset="1" stop-color="#c21620"/>
    </radialGradient>
    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#cdeeff"/><stop offset="1" stop-color="#9fd8f7"/>
    </linearGradient>
    <pattern id="hatchPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#f7fbff"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="#b9d3f0" stroke-width="1.5"/>
    </pattern>
  </defs>
  <style>
  .txt{font-family:Arial,Helvetica,sans-serif;fill:#1b2430}.title{font-family:Arial,Helvetica,sans-serif;font-weight:700;fill:#101827}
  .sym{stroke:#111;stroke-width:2;fill:white}
  .pumpLabel{font-family:Arial,sans-serif;font-size:14px;font-weight:700;fill:#20242b}.box{fill:white;stroke:#6e7784;stroke-width:2}
  .note{font-family:Arial,sans-serif;fill:#075e9c;font-size:13px}.dim{font-family:Arial,sans-serif;fill:#c21f2b;font-size:16px;font-weight:600}
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
  s+=L(80,155,245,155,"pipeGreen")+V(245,155)+L(245,155,500,155,"pipeGreen");
  s+=T(365,139,"Vanne / réduction",10,"middle");
  s+=C(500,155)+L(500,155,900,155,"pipeGreen");
  s+=T(500,130,"Clapet anti-retour",10,"middle");
  s+=J(900,155)+L(900,155,1180,320,"pipeGreen")+J(1180,320);

  // tank
  s+=tankSVG(tank);
  s+=box(tank.x+75,tank.y-90,240,58)+T(tank.x+195,tank.y-64,"CAPACITÉ BÂCHE À EAU",14,"middle","title")+T(tank.x+195,tank.y-42,`${p.tank.capacityM3} m³`,16,"middle","title");
  s+=dimH(tank.x,tank.x+tank.w,tank.y+tank.h+45,`${p.tank.lengthM.toFixed(2)} m`);
  s+=dimV(tank.x+tank.w+95,tank.y,tank.y+tank.h,`${p.tank.heightM.toFixed(2)} m`);
  if(p.equipment.highLevel){s+=L(tank.x+285,tank.y+90,tank.x+285,tank.y+135,"pipeOrange")+T(tank.x+300,tank.y+108,"NIVEAU HAUT",10);}
  if(p.equipment.lowLevel){s+=L(tank.x+310,tank.y+180,tank.x+310,tank.y+225,"pipeOrange")+T(tank.x+325,tank.y+198,"NIVEAU BAS",10);}
  if(p.equipment.floatSwitch){s+=`<circle cx="${tank.x+340}" cy="${tank.y+150}" r="7" fill="#f47b20" stroke="#111"/>${T(tank.x+355,tank.y+155,"FLOTTEUR",10)}`;}
  s+=L(tank.x+75,tank.y+230,tank.x+75,tank.y+130,"pipeBlue")+T(tank.x+90,tank.y+145,`TROP-PLEIN ${p.tank.overflowDiameter}`,10);
  s+=J(tank.x+195,tank.y+tank.h)+L(tank.x+195,tank.y+tank.h,tank.x+195,tank.y+tank.h+60,"pipeBlue")+T(tank.x+210,tank.y+tank.h+34,`VIDANGE ${p.tank.drainDiameter}`,10);

  // suction header
  s+=L(260,suctionY,1030,suctionY,"pipeBlue")+T(645,suctionY+34,`COLLECTEUR ASPIRATION ${p.piping.suctionDiameter}`,15,"middle","title");
  s+=T(265,suctionY-15,`${p.piping.suctionMaterial} · L=${p.piping.suctionLengthM} m`,10);
  s+=J(1030,suctionY)+L(1030,suctionY,tank.x+30,tank.y+tank.h-30,"pipeGreen");
  if(p.equipment.suctionStrainer){s+=C(1050,suctionY)+T(1050,suctionY-22,"Crépine",10,"middle");}
  if(p.equipment.drainValve){s+=L(430,suctionY,430,suctionY+45,"pipeBlue")+V(430,suctionY+45)+T(430,suctionY+70,"VIDANGE",9,"middle");}

  // pumps
  p.pumps.forEach((pump,i)=>{
    const x=center+(i-(count-1)/2)*spacing;
    s+=L(x,suctionY,x,suctionY-92,"pipeBlue");
    if(p.equipment.isolationValvePerPump){s+=V(x,suctionY-108);}
    s+=P(x,pumpY,`P${pump.id} · ${pump.duty.toUpperCase()}`);
    s+=L(x,pumpY-28,x,dischargeY+35,"pipeBlue");
    if(p.equipment.checkValvePerPump){s+=C(x,dischargeY+18);}
    if(p.equipment.isolationValvePerPump){s+=V(x,dischargeY-12);}
    s+=L(x,dischargeY-32,x,dischargeY,"pipeBlue");
    if(pump.flowM3h>0)s+=T(x,pumpY+75,`${pump.flowM3h} m³/h · ${pump.headM} m`,10,"middle");
  });

  // discharge header
  s+=L(260,dischargeY,1030,dischargeY,"pipeBlue")+T(645,dischargeY-22,`COLLECTEUR REFOULEMENT ${p.piping.dischargeDiameter}`,15,"middle","title");
  s+=T(265,dischargeY-40,`${p.piping.dischargeMaterial} · L=${p.piping.dischargeLengthM} m`,10);
  s+=J(1030,dischargeY)+L(1030,dischargeY,1030,330,"pipeBlue")+J(1030,330)+L(1030,330,tank.x,330,"pipeBlue")+T(1080,312,`DÉPART RÉSEAU ${p.piping.dischargeDiameter}`,10);
  if(p.equipment.pressureGauge){s+=`<circle cx="820" cy="${dischargeY-40}" r="14" class="sym"/><circle cx="820" cy="${dischargeY-40}" r="4" fill="#111"/>${T(820,dischargeY-66,"MANOMÈTRE",9,"middle")}`;}
  if(p.pressure.expansionVesselL>0){s+=`<ellipse cx="315" cy="${dischargeY-85}" rx="35" ry="55" fill="#df1e2a" stroke="#8f1018" stroke-width="3"/><ellipse cx="308" cy="${dischargeY-115}" rx="10" ry="18" fill="#ffffff" opacity="0.25"/>${T(315,dischargeY-150,`VASE ${p.pressure.expansionVesselL} L`,10,"middle")}`;}

  // calculation card
  s+=box(55,845,420,105);
  s+=T(72,870,`Q SERVICE : ${h.dutyFlowM3h.toFixed(1)} m³/h`,13,"start","note");
  s+=T(72,893,`HMT ESTIMÉE : ${h.estimatedTotalHeadM.toFixed(1)} m`,13,"start","note");
  s+=T(72,916,`VITESSE ASP. : ${h.suctionVelocityMS.toFixed(2)} m/s · REFOU. : ${h.dischargeVelocityMS.toFixed(2)} m/s`,11,"start","note");
  s+=T(72,938,`DIAMÈTRES CONSEILLÉS : ${h.recommendedSuctionDiameter} / ${h.recommendedDischargeDiameter}`,11,"start","note");

  // legend
  const lx=1190,ly=690;
  s+=box(lx,ly,390,160)+T(lx+195,ly+24,"LÉGENDE",14,"middle","title");
  s+=L(lx+20,ly+45,lx+70,ly+45,"pipeBlue")+T(lx+90,ly+54,"Canalisation pression",11);
  s+=L(lx+20,ly+73,lx+70,ly+73,"pipeGreen")+T(lx+90,ly+82,"PEHD PN10",11);
  s+=`<circle cx="${lx+45}" cy="${ly+106}" r="7" fill="#f47b20" stroke="#111"/>${T(lx+90,ly+110,"Flotteur / niveau",11)}`;
  s+=V(lx+45,ly+132)+T(lx+90,ly+136,"Vanne d'isolement",11);
  s+=C(lx+45,ly+158)+T(lx+90,ly+162,"Clapet anti-retour",11);

  s+="</svg>";
  return s;
}
