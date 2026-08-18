import { z } from "zod";

const pump = z.object({
  id: z.number().int().min(1).max(6),
  model: z.string(),
  duty: z.enum(["service","secours"]),
  flowM3h: z.number().nonnegative(),
  headM: z.number().nonnegative(),
  powerKW: z.number().nonnegative()
});

export const projectSchema = z.object({
  projectName: z.string(),
  client: z.string(),
  location: z.string(),
  systemType: z.string(),
  tank: z.object({
    capacityM3:z.number().positive(),
    lengthM:z.number().positive(),
    widthM:z.number().positive(),
    heightM:z.number().positive(),
    overflowDiameter:z.string(),
    drainDiameter:z.string()
  }),
  piping:z.object({
    inletDiameter:z.string(), inletMaterial:z.string(),
    suctionDiameter:z.string(), suctionMaterial:z.string(), suctionLengthM:z.number().nonnegative(),
    dischargeDiameter:z.string(), dischargeMaterial:z.string(), dischargeLengthM:z.number().nonnegative(),
    elevationM:z.number().nonnegative(), suctionElbows:z.number().int().nonnegative(), dischargeElbows:z.number().int().nonnegative()
  }),
  pressure:z.object({minBar:z.number().nonnegative(),maxBar:z.number().nonnegative(),expansionVesselL:z.number().nonnegative()}),
  pumps:z.array(pump).min(1).max(6),
  equipment:z.object({
    isolationValvePerPump:z.boolean(), checkValvePerPump:z.boolean(), pressureGauge:z.boolean(),
    suctionStrainer:z.boolean(), drainValve:z.boolean(), highLevel:z.boolean(), lowLevel:z.boolean(),
    floatSwitch:z.boolean(), controlPanel:z.boolean()
  }),
  notes:z.string()
});
