import { Project } from "@/types/project";

export function normalizeProject(input: Partial<Project>): Project {
  const base: Project = {
    projectName: "Nouveau projet",
    client: "",
    location: "",
    systemType: "Installation de pompage",
    tank: { capacityM3:20,lengthM:3.3,widthM:3,heightM:3,overflowDiameter:"DN50",drainDiameter:"DN50" },
    piping: { inletDiameter:"DN80",inletMaterial:"PEHD PN10",suctionDiameter:"DN100",suctionMaterial:"PVC pression",suctionLengthM:8,dischargeDiameter:"DN80",dischargeMaterial:"Acier / PVC pression",dischargeLengthM:30,elevationM:20,suctionElbows:3,dischargeElbows:6 },
    pressure: { minBar:3,maxBar:6,expansionVesselL:50 },
    pumps: [{id:1,model:"Pompe 1",duty:"service",flowM3h:0,headM:0,powerKW:0}],
    equipment: { isolationValvePerPump:true,checkValvePerPump:true,pressureGauge:true,suctionStrainer:true,drainValve:true,highLevel:true,lowLevel:true,floatSwitch:true,controlPanel:true },
    notes:""
  };
  return {
    ...base,...input,
    tank:{...base.tank,...input.tank},
    piping:{...base.piping,...input.piping},
    pressure:{...base.pressure,...input.pressure},
    equipment:{...base.equipment,...input.equipment},
    pumps: input.pumps?.length ? input.pumps : base.pumps
  };
}
