"use client";
import { Project, HydraulicResult } from "@/types/project";
import { renderSchematic } from "@/lib/svg-engine";

export default function Schematic({project, hydraulic}:{project:Project,hydraulic:HydraulicResult}) {
  const svg=renderSchematic(project,hydraulic);
  return <div className="schematic" dangerouslySetInnerHTML={{__html:svg}} />;
}
