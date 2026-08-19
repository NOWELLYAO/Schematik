import { Project } from "@/types/project";

export type Point = { x: number; y: number };

export type PumpLayout = {
  x: number;
  pumpY: number;
  suctionValveY: number;
  checkValveY: number;
  dischargeValveY: number;
};

export type SchematicLayout = {
  W: number;
  H: number;
  tank: {
    x: number;
    y: number;
    w: number;
    h: number;
    roofSkewX: number;
    roofSkewY: number;
    inlet: Point;
    suction: Point;
    overflow: Point;
    drain: Point;
  };
  inlet: {
    y: number;
    startX: number;
    valveX: number;
    checkX: number;
    approachX: number;
  };
  suctionHeader: {
    x1: number;
    x2: number;
    y: number;
    tankRouteX: number;
  };
  dischargeHeader: {
    x1: number;
    x2: number;
    y: number;
    outletX: number;
    outletY: number;
  };
  pumps: PumpLayout[];
  controlPanel: { x: number; y: number; w: number; h: number };
  expansionVessel: Point;
  pressureGauge: Point;
  legend: { x: number; y: number; w: number; h: number };
  calculationCard: { x: number; y: number; w: number; h: number };
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function calculateLayout(p: Project): SchematicLayout {
  const W = 1800;
  const H = 1080;
  const count = clamp(p.pumps.length || 1, 1, 6);

  // The drawing is intentionally laid out as a hydraulic process:
  // inlet -> tank -> suction header -> pumps -> discharge header -> outlet.
  const tank = {
    x: 1190,
    y: 300,
    w: 360,
    h: 335,
    roofSkewX: 72,
    roofSkewY: -55,
  };

  const suctionY = 835;
  const dischargeY = 540;
  const pumpY = 685;

  const suctionHeaderX1 = 250;
  const suctionHeaderX2 = 1040;
  const dischargeHeaderX1 = 250;
  const dischargeHeaderX2 = 1040;

  const usable = 720;
  const spacing = count === 1 ? 0 : usable / (count - 1);
  const firstX = count === 1 ? 610 : 610 - usable / 2;

  const pumps: PumpLayout[] = Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? 610 : firstX + i * spacing;
    return {
      x,
      pumpY,
      suctionValveY: pumpY + 70,
      checkValveY: pumpY - 92,
      dischargeValveY: pumpY - 126,
    };
  });

  return {
    W,
    H,
    tank: {
      ...tank,
      inlet: { x: tank.x, y: tank.y + 72 },
      suction: { x: tank.x, y: tank.y + tank.h - 55 },
      overflow: { x: tank.x + 78, y: tank.y + 175 },
      drain: { x: tank.x + tank.w / 2, y: tank.y + tank.h },
    },
    inlet: {
      y: 170,
      startX: 70,
      valveX: 300,
      checkX: 555,
      approachX: 900,
    },
    suctionHeader: {
      x1: suctionHeaderX1,
      x2: suctionHeaderX2,
      y: suctionY,
      tankRouteX: 1100,
    },
    dischargeHeader: {
      x1: dischargeHeaderX1,
      x2: dischargeHeaderX2,
      y: dischargeY,
      outletX: 1100,
      outletY: 350,
    },
    pumps,
    controlPanel: { x: 760, y: 72, w: 170, h: 132 },
    expansionVessel: { x: 335, y: 450 },
    pressureGauge: { x: 865, y: dischargeY - 52 },
    legend: { x: 1260, y: 735, w: 430, h: 220 },
    calculationCard: { x: 55, y: 920, w: 540, h: 110 },
  };
}
