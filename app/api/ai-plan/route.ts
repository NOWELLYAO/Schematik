import { generateText, Output } from "ai";
import { projectSchema } from "@/lib/ai-schema";
import { defaultProject } from "@/lib/defaults";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    if (!process.env.AI_GATEWAY_API_KEY) {
      return Response.json({error:"AI non configurée. Ajoute AI_GATEWAY_API_KEY dans Vercel."},{status:503});
    }

    const { description, current } = await req.json();
    if (!description?.trim()) return Response.json({error:"Description vide."},{status:400});

    const result = await generateText({
      model: process.env.AI_MODEL || "openai/gpt-5.5",
      output: Output.object({schema: projectSchema, name:"PumpProject", description:"Configuration hydraulique structurée pour générer un schéma déterministe."}),
      system: `Tu es un ingénieur hydraulique spécialisé en groupes de pompage et réseaux d'eau.
Tu convertis une demande utilisateur en données techniques structurées.
Règles strictes:
- Ne change pas une donnée existante si l'utilisateur ne la modifie pas.
- "2 service + 1 secours" signifie exactement deux pompes duty=service et une duty=secours.
- Ne devine jamais Q/H/P: si absent, conserve la valeur actuelle ou 0.
- Le dessin sera produit par un moteur SVG déterministe.
- Maximum 6 pompes.
- Les valeurs doivent rester cohérentes avec les unités indiquées.
Projet actuel: ${JSON.stringify(current || defaultProject)}`,
      prompt: description
    });

    return Response.json({project: result.output});
  } catch (e) {
    console.error(e);
    return Response.json({error:"La génération IA a échoué. Vérifie la clé AI Gateway et le modèle choisi."},{status:500});
  }
}
