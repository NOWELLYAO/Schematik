import { Project, HydraulicResult } from "@/types/project";
import { calculateLayout, Point, SchematicLayout } from "@/lib/layout-engine";

const esc = (s: string) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const T = (
  x: number,
  y: number,
  s: string,
  size = 13,
  anchor = "start",
  cls = "txt"
) =>
  `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" class="${cls}">${esc(s)}</text>`;

const box = (x: number, y: number, w: number, h: number, cls = "box") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;

type PipeClass = "pipeBlue" | "pipeGreen" | "pipeOrange";

const PIPE_WIDTH: Record<PipeClass, number> = {
  pipeBlue: 12,
  pipeGreen: 12,
  pipeOrange: 8,
};

const PIPE_FILL: Record<PipeClass, string> = {
  pipeBlue: "url(#bluePipe)",
  pipeGreen: "url(#pehdPattern)",
  pipeOrange: "url(#orangePipe)",
};

const PIPE_STROKE: Record<PipeClass, string> = {
  pipeBlue: "#123fc4",
  pipeGreen: "#2f7d00",
  pipeOrange: "#d36a00",
};

function segment(
  a: Point,
  b: Point,
  cls: PipeClass = "pipeBlue",
  arrow = false
) {
  const th = PIPE_WIDTH[cls];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * th / 2;
  const py = (dx / len) * th / 2;

  const pts = [
    [a.x + px, a.y + py],
    [b.x + px, b.y + py],
    [b.x - px, b.y - py],
    [a.x - px, a.y - py],
  ]
    .map((p) => p.join(","))
    .join(" ");

  const highlight =
    cls === "pipeBlue"
      ? `<line x1="${a.x}" y1="${a.y - th * 0.18}" x2="${b.x}" y2="${b.y - th * 0.18}" stroke="#9ab2ff" stroke-width="2" opacity=".72"/>`
      : "";

  const arrowSvg = arrow
    ? `<polygon points="${b.x},${b.y} ${b.x - dx / len * 16 + dy / len * 7},${b.y - dy / len * 16 - dx / len * 7} ${b.x - dx / len * 16 - dy / len * 7},${b.y - dy / len * 16 + dx / len * 7}" fill="${PIPE_STROKE[cls]}"/>`
    : "";

  return `<g><polygon points="${pts}" fill="${PIPE_FILL[cls]}" stroke="${PIPE_STROKE[cls]}" stroke-width="1.6" stroke-linejoin="round"/>${highlight}${arrowSvg}</g>`;
}

function pipe(
  points: Point[],
  cls: PipeClass = "pipeBlue",
  arrowAtEnd = false
) {
  return points
    .slice(0, -1)
    .map((p, i) =>
      segment(p, points[i + 1], cls, arrowAtEnd && i === points.length - 2)
    )
    .join("");
}

const J = (x: number, y: number) =>
  `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="1" fill="#222" stroke="#000" stroke-width=".6"/>`;

const V = (x: number, y: number, vertical = false) => {
  const rot = vertical ? ` transform="rotate(90 ${x} ${y})"` : "";
  return `<g class="sym"${rot}>
    <path d="M${x - 12} ${y - 12}L${x} ${y}L${x - 12} ${y + 12}Z" fill="#fff"/>
    <path d="M${x + 12} ${y - 12}L${x} ${y}L${x + 12} ${y + 12}Z" fill="#fff"/>
  </g>`;
};

const C = (x: number, y: number, vertical = false) => {
  const rot = vertical ? ` transform="rotate(90 ${x} ${y})"` : "";
  return `<g class="sym"${rot}>
    <path d="M${x - 11} ${y - 12}L${x + 10} ${y}L${x - 11} ${y + 12}Z" fill="#fff"/>
    <line x1="${x + 11}" y1="${y - 14}" x2="${x + 11}" y2="${y + 14}"/>
  </g>`;
};

function pumpSVG(x: number, y: number, label: string) {
  return `<g>
    <rect x="${x - 27}" y="${y - 40}" width="54" height="80" rx="9" fill="url(#pumpGrad)" stroke="#7b1018" stroke-width="3"/>
    <rect x="${x - 19}" y="${y - 61}" width="38" height="24" rx="5" fill="#777" stroke="#333" stroke-width="2"/>
    <circle cx="${x}" cy="${y - 49}" r="7" fill="#e8e8e8" stroke="#333" stroke-width="1.5"/>
    <path d="M${x - 15} ${y + 8} Q${x} ${y - 18} ${x + 15} ${y + 8}" fill="none" stroke="#fff" stroke-width="4"/>
    <path d="M${x + 7} ${y + 1} L${x + 18} ${y + 9} L${x + 5} ${y + 12}" fill="none" stroke="#fff" stroke-width="4"/>
    <text x="${x}" y="${y + 63}" text-anchor="middle" class="pumpLabel">${esc(label)}</text>
  </g>`;
}

const dimH = (x1: number, x2: number, y: number, label: string) => `<g class="dimension">
  <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>
  <line x1="${x1}" y1="${y - 7}" x2="${x1}" y2="${y + 7}"/>
  <line x1="${x2}" y1="${y - 7}" x2="${x2}" y2="${y + 7}"/>
  <polygon points="${x1},${y} ${x1 + 9},${y - 4} ${x1 + 9},${y + 4}"/>
  <polygon points="${x2},${y} ${x2 - 9},${y - 4} ${x2 - 9},${y + 4}"/>
  ${T((x1 + x2) / 2, y - 9, label, 14, "middle", "dimText")}
</g>`;

const dimV = (x: number, y1: number, y2: number, label: string) => `<g class="dimension">
  <line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>
  <line x1="${x - 7}" y1="${y1}" x2="${x + 7}" y2="${y1}"/>
  <line x1="${x - 7}" y1="${y2}" x2="${x + 7}" y2="${y2}"/>
  <polygon points="${x},${y1} ${x - 4},${y1 + 9} ${x + 4},${y1 + 9}"/>
  <polygon points="${x},${y2} ${x - 4},${y2 - 9} ${x + 4},${y2 - 9}"/>
  ${T(x + 17, (y1 + y2) / 2, label, 14, "middle", "dimText")}
</g>`;

function tankSVG(
  layout: SchematicLayout["tank"],
  p: Project
) {
  const { x, y, w, h, roofSkewX, roofSkewY } = layout;
  const waterY = y + h * 0.60;
  const roof = `${x},${y} ${x + w},${y} ${x + w + roofSkewX},${y + roofSkewY} ${x + roofSkewX},${y + roofSkewY}`;
  const hatchX = x + w * 0.34;
  const hatchY = y + roofSkewY + 22;

  let s = `<g class="tank">`;
  s += `<polygon points="${x + w},${y} ${x + w + roofSkewX},${y + roofSkewY} ${x + w + roofSkewX},${y + roofSkewY + h} ${x + w},${y + h}" fill="#edf5ff" stroke="#5b93e0" stroke-width="2"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fbfdff" stroke="#5b93e0" stroke-width="2.5"/>`;
  s += `<rect x="${x + 2}" y="${waterY}" width="${w - 4}" height="${h - (waterY - y) - 2}" fill="url(#waterGrad)"/>`;
  s += `<line x1="${x + 2}" y1="${waterY}" x2="${x + w - 2}" y2="${waterY}" stroke="#76c4f4" stroke-width="2"/>`;
  s += `<polygon points="${roof}" fill="#f2f9ff" stroke="#5b93e0" stroke-width="2.5"/>`;
  s += `<rect x="${hatchX}" y="${hatchY}" width="100" height="46" fill="url(#hatchPattern)" stroke="#5b93e0" stroke-width="2"/>`;
  s += T(hatchX + 50, hatchY + 29, "TRAPPE", 11, "middle", "tankText");
  s += T(x + w / 2, y + h / 2 + 8, `${p.tank.capacityM3} m³`, 22, "middle", "tankCapacity");
  s += T(x + w / 2, y + h / 2 + 31, "BÂCHE DE REPRISE", 12, "middle", "tankText");
  s += `</g>`;
  return s;
}

function controlPanelSVG(x: number, y: number, w: number, h: number) {
  let s = `<g>`;
  s += box(x, y, w, h);
  s += `<rect x="${x + 20}" y="${y + 22}" width="30" height="18" fill="#fff" stroke="#222"/>`;
  for (let i = 0; i < 18; i++) {
    const cx = x + 75 + (i % 3) * 30;
    const cy = y + 31 + Math.floor(i / 3) * 20;
    const fill = i % 5 === 0 ? "#dc2626" : i % 7 === 0 ? "#f0b400" : "#16a34a";
    s += `<circle cx="${cx}" cy="${cy}" r="6" fill="${fill}" stroke="#222" stroke-width="1"/>`;
  }
  s += T(x + w / 2, y + h + 20, "COFFRET DE COMMANDE", 11, "middle", "txt");
  s += `</g>`;
  return s;
}

function gaugeSVG(x: number, y: number) {
  return `<g>
    <circle cx="${x}" cy="${y}" r="20" fill="#fff" stroke="#111" stroke-width="2.5"/>
    <path d="M${x - 11} ${y + 8} A14 14 0 0 1 ${x + 11} ${y + 8}" fill="none" stroke="#222" stroke-width="1.5"/>
    <line x1="${x}" y1="${y}" x2="${x + 8}" y2="${y - 8}" stroke="#111" stroke-width="2"/>
    ${T(x, y - 28, "MANOMÈTRE", 9, "middle")}
  </g>`;
}

function vesselSVG(x: number, y: number, liters: number) {
  return `<g>
    <ellipse cx="${x}" cy="${y}" rx="34" ry="54" fill="url(#vesselGrad)" stroke="#8f1018" stroke-width="3"/>
    <rect x="${x - 8}" y="${y - 65}" width="16" height="12" fill="#666" stroke="#333"/>
    <line x1="${x - 24}" y1="${y + 54}" x2="${x - 24}" y2="${y + 67}" stroke="#333" stroke-width="4"/>
    <line x1="${x + 24}" y1="${y + 54}" x2="${x + 24}" y2="${y + 67}" stroke="#333" stroke-width="4"/>
    ${T(x, y + 82, `VASE ${liters} L`, 10, "middle")}
  </g>`;
}

function legendSVG(layout: SchematicLayout) {
  const { x, y, w, h } = layout.legend;
  let s = box(x, y, w, h);
  s += T(x + w / 2, y + 27, "LÉGENDE", 15, "middle", "title");

  s += pipe([{ x: x + 22, y: y + 58 }, { x: x + 78, y: y + 58 }], "pipeBlue");
  s += T(x + 100, y + 63, "Canalisation pression", 11);

  s += pipe([{ x: x + 22, y: y + 88 }, { x: x + 78, y: y + 88 }], "pipeGreen");
  s += T(x + 100, y + 93, "PEHD PN10 / arrivée", 11);

  s += `<circle cx="${x + 50}" cy="${y + 119}" r="7" fill="#f47b20" stroke="#111"/>`;
  s += T(x + 100, y + 124, "Flotteur / niveau", 11);

  s += V(x + 50, y + 151);
  s += T(x + 100, y + 156, "Vanne d'isolement", 11);

  s += C(x + 50, y + 183);
  s += T(x + 100, y + 188, "Clapet anti-retour", 11);

  return s;
}

export function renderSchematic(p: Project, h: HydraulicResult): string {
  const l = calculateLayout(p);
  const { W, H } = l;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="auto" preserveAspectRatio="xMidYMid meet">
  <defs>
    <pattern id="pehdPattern" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)">
      <rect width="9" height="9" fill="#3aa800"/>
      <line x1="0" y1="0" x2="0" y2="9" stroke="#2b7000" stroke-width="3.5"/>
    </pattern>
    <linearGradient id="bluePipe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5b78ff"/><stop offset=".5" stop-color="#143dcb"/><stop offset="1" stop-color="#3554e6"/>
    </linearGradient>
    <linearGradient id="orangePipe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb066"/><stop offset=".5" stop-color="#f47b20"/><stop offset="1" stop-color="#e46c14"/>
    </linearGradient>
    <radialGradient id="pumpGrad" cx="35%" cy="25%" r="80%">
      <stop offset="0" stop-color="#ff6a72"/><stop offset="1" stop-color="#c21620"/>
    </radialGradient>
    <linearGradient id="vesselGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#b80f1c"/><stop offset=".45" stop-color="#ef2935"/><stop offset="1" stop-color="#a60d17"/>
    </linearGradient>
    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#cdeeff"/><stop offset="1" stop-color="#9fd8f7"/>
    </linearGradient>
    <pattern id="hatchPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#f7fbff"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="#b9d3f0" stroke-width="1.5"/>
    </pattern>
  </defs>
  <style>
    .txt{font-family:Arial,Helvetica,sans-serif;fill:#1b2430}
    .title{font-family:Arial,Helvetica,sans-serif;font-weight:700;fill:#101827}
    .sym{stroke:#111;stroke-width:2.2;fill:#fff}
    .pumpLabel{font-family:Arial,sans-serif;font-size:13px;font-weight:700;fill:#20242b}
    .box{fill:#fff;stroke:#697586;stroke-width:2}
    .note{font-family:Arial,sans-serif;fill:#075e9c;font-size:13px}
    .dimText{font-family:Arial,sans-serif;fill:#c21f2b;font-size:14px;font-weight:600}
    .dimension line{stroke:#c21f2b;stroke-width:1.5}
    .dimension polygon{fill:#c21f2b}
    .tankText{font-family:Arial,sans-serif;fill:#334155;font-weight:600}
    .tankCapacity{font-family:Arial,sans-serif;fill:#0f4c81;font-weight:700}
  </style>
  <rect width="100%" height="100%" fill="#fff"/>
  `;

  s += T(W / 2, 42, p.projectName || "GROUPE DE SURPRESSION", 26, "middle", "title");
  s += T(W / 2, 66, `${p.client} · ${p.location} · ${p.systemType}`, 13, "middle");

  if (p.equipment.controlPanel) {
    s += controlPanelSVG(l.controlPanel.x, l.controlPanel.y, l.controlPanel.w, l.controlPanel.h);
  }

  // ---------------- INLET ----------------
  s += T(70, 105, "ARRIVÉE EAU DE VILLE", 16, "start", "title");
  s += T(70, 128, `${p.piping.inletMaterial} / ${p.piping.inletDiameter}`, 11);

  const inletY = l.inlet.y;
  const inletPath: Point[] = [
    { x: l.inlet.startX, y: inletY },
    { x: l.inlet.valveX, y: inletY },
    { x: l.inlet.checkX, y: inletY },
    { x: l.inlet.approachX, y: inletY },
    { x: l.inlet.approachX + 100, y: inletY },
    { x: l.inlet.approachX + 100, y: l.tank.inlet.y },
    l.tank.inlet,
  ];
  s += pipe(inletPath, "pipeGreen", true);
  s += V(l.inlet.valveX, inletY);
  s += C(l.inlet.checkX, inletY);
  s += T(l.inlet.valveX, inletY - 22, "VANNE", 10, "middle");
  s += T(l.inlet.checkX, inletY - 22, "CLAPET", 10, "middle");
  s += T(850, inletY - 18, "PEHD PN10", 10, "middle");

  // ---------------- TANK ----------------
  s += tankSVG(l.tank, p);
  s += box(l.tank.x + 65, l.tank.y - 92, 250, 62);
  s += T(l.tank.x + 190, l.tank.y - 66, "CAPACITÉ BÂCHE À EAU", 14, "middle", "title");
  s += T(l.tank.x + 190, l.tank.y - 44, `${p.tank.capacityM3} m³`, 16, "middle", "title");

  s += dimH(
    l.tank.x,
    l.tank.x + l.tank.w,
    l.tank.y + l.tank.h + 92,
    `${p.tank.lengthM.toFixed(2)} m`
  );
  s += dimV(
    l.tank.x + l.tank.w + 58,
    l.tank.y,
    l.tank.y + l.tank.h,
    `${p.tank.heightM.toFixed(2)} m`
  );

  if (p.equipment.highLevel) {
    const y = l.tank.y + 95;
    s += `<line x1="${l.tank.x + 270}" y1="${y}" x2="${l.tank.x + 330}" y2="${y}" stroke="#f47b20" stroke-width="4"/>`;
    s += T(l.tank.x + 340, y + 4, "NIVEAU HAUT", 10);
  }
  if (p.equipment.lowLevel) {
    const y = l.tank.y + 205;
    s += `<line x1="${l.tank.x + 270}" y1="${y}" x2="${l.tank.x + 330}" y2="${y}" stroke="#f47b20" stroke-width="4"/>`;
    s += T(l.tank.x + 340, y + 4, "NIVEAU BAS", 10);
  }
  if (p.equipment.floatSwitch) {
    const x = l.tank.x + l.tank.w - 55;
    const y = l.tank.y + 155;
    s += `<circle cx="${x}" cy="${y}" r="8" fill="#f47b20" stroke="#111" stroke-width="1.5"/>`;
    s += T(x + 16, y + 5, "FLOTTEUR", 10);
  }

  // Overflow inside tank, routed to left edge.
  if (p.tank.overflowDiameter) {
    s += pipe(
      [
        l.tank.overflow,
        { x: l.tank.x + 18, y: l.tank.overflow.y },
        { x: l.tank.x + 18, y: l.tank.y + 145 },
      ],
      "pipeBlue"
    );
    s += T(l.tank.x + 38, l.tank.y + 149, `TROP-PLEIN ${p.tank.overflowDiameter}`, 10);
  }

  // Drain under the tank.
  s += J(l.tank.drain.x, l.tank.drain.y);
  s += pipe(
    [
      l.tank.drain,
      { x: l.tank.drain.x, y: l.tank.drain.y + 58 },
    ],
    "pipeBlue"
  );
  s += T(l.tank.drain.x + 16, l.tank.drain.y + 38, `VIDANGE ${p.tank.drainDiameter}`, 10);

  // ---------------- SUCTION HEADER ----------------
  s += pipe(
    [
      { x: l.suctionHeader.x1, y: l.suctionHeader.y },
      { x: l.suctionHeader.x2, y: l.suctionHeader.y },
    ],
    "pipeBlue"
  );
  s += T(
    (l.suctionHeader.x1 + l.suctionHeader.x2) / 2,
    l.suctionHeader.y + 38,
    `COLLECTEUR ASPIRATION ${p.piping.suctionDiameter}`,
    15,
    "middle",
    "title"
  );
  s += T(
    l.suctionHeader.x1 + 5,
    l.suctionHeader.y - 17,
    `${p.piping.suctionMaterial} · L=${p.piping.suctionLengthM} m`,
    10
  );

  // Tank-to-suction route is orthogonal and never crosses the tank body.
  s += pipe(
    [
      l.tank.suction,
      { x: l.suctionHeader.tankRouteX, y: l.tank.suction.y },
      { x: l.suctionHeader.tankRouteX, y: l.suctionHeader.y },
      { x: l.suctionHeader.x2, y: l.suctionHeader.y },
    ],
    "pipeBlue",
    true
  );

  if (p.equipment.suctionStrainer) {
    s += C(l.suctionHeader.tankRouteX - 45, l.suctionHeader.y);
    s += T(l.suctionHeader.tankRouteX - 45, l.suctionHeader.y - 22, "CRÉPINE", 10, "middle");
  }

  if (p.equipment.drainValve) {
    const x = l.suctionHeader.x1 + 165;
    s += pipe(
      [
        { x, y: l.suctionHeader.y },
        { x, y: l.suctionHeader.y + 42 },
      ],
      "pipeBlue"
    );
    s += V(x, l.suctionHeader.y + 42, true);
    s += T(x, l.suctionHeader.y + 70, "VIDANGE", 9, "middle");
  }

  // ---------------- PUMPS ----------------
  l.pumps.forEach((pl, i) => {
    const pump = p.pumps[i];

    // suction branch
    s += pipe(
      [
        { x: pl.x, y: l.suctionHeader.y },
        { x: pl.x, y: pl.suctionValveY },
      ],
      "pipeBlue"
    );

    if (p.equipment.isolationValvePerPump) {
      s += V(pl.x, pl.suctionValveY, true);
    }

    // pump body
    s += pipe(
      [
        { x: pl.x, y: pl.suctionValveY },
        { x: pl.x, y: pl.pumpY + 61 },
      ],
      "pipeBlue"
    );
    s += pumpSVG(
      pl.x,
      pl.pumpY,
      `P${pump?.id ?? i + 1} · ${(pump?.duty ?? "service").toUpperCase()}`
    );

    // discharge branch: pump -> check -> valve -> header
    s += pipe(
      [
        { x: pl.x, y: pl.pumpY - 61 },
        { x: pl.x, y: pl.checkValveY },
      ],
      "pipeBlue"
    );

    if (p.equipment.checkValvePerPump) {
      s += C(pl.x, pl.checkValveY, true);
    }

    if (p.equipment.isolationValvePerPump) {
      s += V(pl.x, pl.dischargeValveY, true);
    }

    s += pipe(
      [
        { x: pl.x, y: pl.dischargeValveY },
        { x: pl.x, y: l.dischargeHeader.y },
      ],
      "pipeBlue"
    );

    if (pump && pump.flowM3h > 0) {
      s += T(
        pl.x,
        pl.pumpY + 91,
        `${pump.flowM3h} m³/h · ${pump.headM} m`,
        10,
        "middle"
      );
    }
  });

  // ---------------- DISCHARGE HEADER ----------------
  s += pipe(
    [
      { x: l.dischargeHeader.x1, y: l.dischargeHeader.y },
      { x: l.dischargeHeader.x2, y: l.dischargeHeader.y },
    ],
    "pipeBlue"
  );
  s += T(
    (l.dischargeHeader.x1 + l.dischargeHeader.x2) / 2,
    l.dischargeHeader.y - 24,
    `COLLECTEUR REFOULEMENT ${p.piping.dischargeDiameter}`,
    15,
    "middle",
    "title"
  );
  s += T(
    l.dischargeHeader.x1 + 5,
    l.dischargeHeader.y - 43,
    `${p.piping.dischargeMaterial} · L=${p.piping.dischargeLengthM} m`,
    10
  );

  // Outlet routed ABOVE the tank to avoid crossing the tank.
  s += pipe(
    [
      { x: l.dischargeHeader.x2, y: l.dischargeHeader.y },
      { x: l.dischargeHeader.outletX, y: l.dischargeHeader.y },
      { x: l.dischargeHeader.outletX, y: 220 },
      { x: 1680, y: 220 },
    ],
    "pipeBlue",
    true
  );
  s += T(1410, 201, `DÉPART RÉSEAU ${p.piping.dischargeDiameter}`, 11, "middle", "title");

  if (p.equipment.pressureGauge) {
    s += gaugeSVG(l.pressureGauge.x, l.pressureGauge.y);
    s += pipe(
      [
        { x: l.pressureGauge.x, y: l.dischargeHeader.y },
        { x: l.pressureGauge.x, y: l.pressureGauge.y + 20 },
      ],
      "pipeBlue"
    );
  }

  if (p.pressure.expansionVesselL > 0) {
    s += vesselSVG(
      l.expansionVessel.x,
      l.expansionVessel.y,
      p.pressure.expansionVesselL
    );
    s += pipe(
      [
        { x: l.expansionVessel.x, y: l.dischargeHeader.y },
        { x: l.expansionVessel.x, y: l.expansionVessel.y + 54 },
      ],
      "pipeBlue"
    );
  }

  // ---------------- CALCULATION CARD ----------------
  const c = l.calculationCard;
  s += box(c.x, c.y, c.w, c.h);
  s += T(c.x + 18, c.y + 26, `Q SERVICE : ${h.dutyFlowM3h.toFixed(1)} m³/h`, 13, "start", "note");
  s += T(c.x + 18, c.y + 49, `HMT ESTIMÉE : ${h.estimatedTotalHeadM.toFixed(1)} m`, 13, "start", "note");
  s += T(
    c.x + 18,
    c.y + 72,
    `VITESSE ASP. : ${h.suctionVelocityMS.toFixed(2)} m/s · REFOU. : ${h.dischargeVelocityMS.toFixed(2)} m/s`,
    11,
    "start",
    "note"
  );
  s += T(
    c.x + 18,
    c.y + 94,
    `DIAMÈTRES CONSEILLÉS : ${h.recommendedSuctionDiameter} / ${h.recommendedDischargeDiameter}`,
    11,
    "start",
    "note"
  );

  // ---------------- LEGEND ----------------
  s += legendSVG(l);

  // Engineering note
  s += T(
    860,
    1010,
    "Schéma de principe — vérifier courbes constructeur, normes applicables et implantation chantier.",
    10,
    "middle"
  );

  s += `</svg>`;
  return s;
}
