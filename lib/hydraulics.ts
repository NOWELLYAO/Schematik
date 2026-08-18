import { HydraulicResult, Project } from "@/types/project";

const diameterMeters: Record<string, number> = {
  DN25: 0.025, DN32: 0.032, DN40: 0.040, DN50: 0.050,
  DN65: 0.065, DN80: 0.080, DN100: 0.100, DN125: 0.125,
  DN150: 0.150, DN200: 0.200, DN250: 0.250
};

const g = 9.81;
const rho = 998;
const nu = 1.004e-6;

function diameter(dn: string) {
  return diameterMeters[dn] ?? 0.1;
}

function velocity(flowM3h: number, d: number) {
  const q = flowM3h / 3600;
  return q / (Math.PI * d * d / 4);
}

function frictionFactor(v: number, d: number) {
  const re = Math.max(1, v * d / nu);
  if (re < 2300) return 64 / re;
  const roughness = 0.00015;
  const a = roughness / (3.7 * d) + 5.74 / Math.pow(re, 0.9);
  return 0.25 / Math.pow(Math.log10(a), 2);
}

function pipeLoss(flowM3h: number, dn: string, lengthM: number, elbows: number) {
  const d = diameter(dn);
  const v = velocity(flowM3h, d);
  const f = frictionFactor(v, d);
  const major = f * (lengthM / d) * (v * v / (2 * g));
  const minor = elbows * 0.35 * (v * v / (2 * g));
  return major + minor;
}

function nearestDiameter(targetVelocity: number, flowM3h: number, candidates: string[]) {
  let best = candidates[0];
  let bestDiff = Infinity;
  for (const dn of candidates) {
    const v = velocity(flowM3h, diameter(dn));
    const diff = Math.abs(v - targetVelocity);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = dn;
    }
  }
  return best;
}

export function calculateHydraulics(p: Project): HydraulicResult {
  const service = p.pumps.filter(x => x.duty === "service");
  const dutyFlowM3h = service.reduce((s, x) => s + x.flowM3h, 0);
  const dutyFlowM3s = dutyFlowM3h / 3600;

  const suctionVelocityMS = velocity(dutyFlowM3h, diameter(p.piping.suctionDiameter));
  const dischargeVelocityMS = velocity(dutyFlowM3h, diameter(p.piping.dischargeDiameter));

  const suctionLossM = pipeLoss(dutyFlowM3h, p.piping.suctionDiameter, p.piping.suctionLengthM, p.piping.suctionElbows);
  const dischargeLossM = pipeLoss(dutyFlowM3h, p.piping.dischargeDiameter, p.piping.dischargeLengthM, p.piping.dischargeElbows);

  const pressureHeadM = p.pressure.maxBar * 10.197;
  const staticHeadM = Math.max(0, p.piping.elevationM);
  const estimatedTotalHeadM = pressureHeadM + staticHeadM + suctionLossM + dischargeLossM;

  const hydraulicPowerKW = rho * g * dutyFlowM3s * estimatedTotalHeadM / 1000;

  const warnings: string[] = [];
  if (service.length === 0) warnings.push("Aucune pompe en service.");
  if (suctionVelocityMS > 2) warnings.push("Vitesse aspiration élevée (> 2 m/s). Vérifier le diamètre.");
  if (dischargeVelocityMS > 3) warnings.push("Vitesse refoulement élevée (> 3 m/s). Vérifier le diamètre.");
  if (estimatedTotalHeadM > Math.max(...p.pumps.map(x => x.headM), 0) && service.length) {
    warnings.push("HMT estimée supérieure à la HMT saisie des pompes : vérifier la courbe et les pertes.");
  }
  if (p.pressure.minBar >= p.pressure.maxBar) warnings.push("Plage de pression incohérente.");

  return {
    dutyFlowM3h,
    dutyFlowM3s,
    suctionVelocityMS,
    dischargeVelocityMS,
    suctionLossM,
    dischargeLossM,
    staticHeadM,
    estimatedTotalHeadM,
    estimatedHydraulicPowerKW: hydraulicPowerKW,
    recommendedSuctionDiameter: nearestDiameter(1.5, dutyFlowM3h, ["DN50","DN65","DN80","DN100","DN125","DN150"]),
    recommendedDischargeDiameter: nearestDiameter(2.0, dutyFlowM3h, ["DN50","DN65","DN80","DN100","DN125","DN150"]),
    warnings
  };
}
