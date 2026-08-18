# PumpSchematic AI PRO

Professional deterministic hydraulic/pumping schematic generator.

## Core principle

The LLM **does not draw the engineering diagram**.

1. User enters engineering data.
2. Optional AI converts natural language into validated structured data.
3. Engineering rules calculate derived values and validate consistency.
4. Deterministic SVG engine lays out the schematic.
5. The same input always produces the same geometry.
6. SVG/PNG/print PDF and JSON project export are available.

## Included in V2

- 1–6 pumps
- duty / standby configuration
- pump model, flow, head, power
- tank volume and dimensions
- inlet, suction and discharge diameters/materials
- pipe lengths and fittings for hydraulic estimation
- Darcy-Weisbach style friction estimate with Swamee-Jain friction factor
- velocity and pipe-size recommendation
- pressure range
- expansion vessel
- valves / check valves
- level switches / float
- overflow / drain
- control panel
- automatic schematic layout
- BOM / nomenclature
- project JSON export/import
- SVG and PNG export
- print-to-PDF
- optional AI configuration assistant

## Important engineering note

The hydraulic calculator is an estimation/decision-support tool. It does not replace a signed engineering calculation, manufacturer's curve verification, local code review, or site survey.

## Run

```bash
npm install
npm run dev
```

## Deploy

Push the folder to GitHub, then import the repository into Vercel. Vercel automatically detects Next.js projects. Add `AI_GATEWAY_API_KEY` if you want the natural-language AI assistant.
