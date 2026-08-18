export type PumpDuty = "service" | "secours";

export interface Pump {
  id: number;
  model: string;
  duty: PumpDuty;
  flowM3h: number;
  headM: number;
  powerKW: number;
}

export interface Project {
  projectName: string;
  client: string;
  location: string;
  systemType: string;

  tank: {
    capacityM3: number;
    lengthM: number;
    widthM: number;
    heightM: number;
    overflowDiameter: string;
    drainDiameter: string;
  };

  piping: {
    inletDiameter: string;
    inletMaterial: string;
    suctionDiameter: string;
    suctionMaterial: string;
    suctionLengthM: number;
    dischargeDiameter: string;
    dischargeMaterial: string;
    dischargeLengthM: number;
    elevationM: number;
    suctionElbows: number;
    dischargeElbows: number;
  };

  pressure: {
    minBar: number;
    maxBar: number;
    expansionVesselL: number;
  };

  pumps: Pump[];

  equipment: {
    isolationValvePerPump: boolean;
    checkValvePerPump: boolean;
    pressureGauge: boolean;
    suctionStrainer: boolean;
    drainValve: boolean;
    highLevel: boolean;
    lowLevel: boolean;
    floatSwitch: boolean;
    controlPanel: boolean;
  };

  notes: string;
}

export interface HydraulicResult {
  dutyFlowM3h: number;
  dutyFlowM3s: number;
  suctionVelocityMS: number;
  dischargeVelocityMS: number;
  suctionLossM: number;
  dischargeLossM: number;
  staticHeadM: number;
  estimatedTotalHeadM: number;
  estimatedHydraulicPowerKW: number;
  recommendedSuctionDiameter: string;
  recommendedDischargeDiameter: string;
  warnings: string[];
}

export interface BomItem {
  category: string;
  designation: string;
  quantity: number;
  specification: string;
}
