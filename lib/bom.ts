import { BomItem, Project } from "@/types/project";

export function buildBom(p: Project): BomItem[] {
  const service = p.pumps.filter(x => x.duty === "service").length;
  const standby = p.pumps.filter(x => x.duty === "secours").length;

  return [
    { category: "Pompage", designation: "Pompe", quantity: p.pumps.length, specification: p.pumps.map(x => x.model).filter(Boolean).join(" / ") || "À définir" },
    { category: "Tuyauterie", designation: "Collecteur aspiration", quantity: 1, specification: p.piping.suctionDiameter },
    { category: "Tuyauterie", designation: "Collecteur refoulement", quantity: 1, specification: p.piping.dischargeDiameter },
    { category: "Vannes", designation: "Vanne d'isolement pompe", quantity: p.equipment.isolationValvePerPump ? p.pumps.length * 2 : 0, specification: "Aspiration + refoulement" },
    { category: "Clapets", designation: "Clapet anti-retour", quantity: p.equipment.checkValvePerPump ? p.pumps.length : 0, specification: "1 par pompe" },
    { category: "Instrumentation", designation: "Manomètre", quantity: p.equipment.pressureGauge ? 1 : 0, specification: `${p.pressure.minBar}–${p.pressure.maxBar} bar` },
    { category: "Hydraulique", designation: "Vase d'expansion", quantity: p.pressure.expansionVesselL > 0 ? 1 : 0, specification: `${p.pressure.expansionVesselL} L` },
    { category: "Réservoir", designation: "Bâche à eau", quantity: 1, specification: `${p.tank.capacityM3} m³ · ${p.tank.lengthM} × ${p.tank.widthM} × ${p.tank.heightM} m` },
    { category: "Niveau", designation: "Commande de niveau", quantity: p.equipment.floatSwitch ? 1 : 0, specification: `${p.equipment.highLevel ? "haut " : ""}${p.equipment.lowLevel ? "bas" : ""}` },
    { category: "Électricité", designation: "Coffret de commande", quantity: p.equipment.controlPanel ? 1 : 0, specification: `${service} service + ${standby} secours` }
  ].filter(x => x.quantity > 0);
}
