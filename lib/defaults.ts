import { Project } from "@/types/project";

export const defaultProject: Project = {
  projectName: "Groupe de surpression – 3 pompes",
  client: "Client",
  location: "Abidjan",
  systemType: "Surpression avec bâche de reprise",

  tank: {
    capacityM3: 20,
    lengthM: 3.3,
    widthM: 3,
    heightM: 3,
    overflowDiameter: "DN50",
    drainDiameter: "DN50"
  },

  piping: {
    inletDiameter: "DN80",
    inletMaterial: "PEHD PN10",
    suctionDiameter: "DN100",
    suctionMaterial: "PVC pression",
    suctionLengthM: 8,
    dischargeDiameter: "DN80",
    dischargeMaterial: "Acier / PVC pression",
    dischargeLengthM: 30,
    elevationM: 20,
    suctionElbows: 3,
    dischargeElbows: 6
  },

  pressure: {
    minBar: 3,
    maxBar: 6,
    expansionVesselL: 50
  },

  pumps: [
    { id: 1, model: "Grundfos CRE 10-8", duty: "service", flowM3h: 20, headM: 50, powerKW: 7.5 },
    { id: 2, model: "Grundfos CRE 10-8", duty: "service", flowM3h: 20, headM: 50, powerKW: 7.5 },
    { id: 3, model: "Grundfos CRE 10-8", duty: "secours", flowM3h: 20, headM: 50, powerKW: 7.5 }
  ],

  equipment: {
    isolationValvePerPump: true,
    checkValvePerPump: true,
    pressureGauge: true,
    suctionStrainer: true,
    drainValve: true,
    highLevel: true,
    lowLevel: true,
    floatSwitch: true,
    controlPanel: true
  },

  notes: "2 pompes en service + 1 pompe de secours. Vérifier les courbes fabricant avant validation."
};
