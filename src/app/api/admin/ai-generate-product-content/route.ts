import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2),
  brand: z.string().optional().default(""),
  price: z.coerce.number().nonnegative().optional(),
  category: z.string().optional().default(""),
  shortDetails: z.string().optional().default(""),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const responseShape = z.object({
  name: z.string().optional().default(""),
  sku: z.string().optional().default(""),
  brand: z.string().optional().default(""),
  shortDescription: z.string().optional().default(""),
  fullDescription: z.string(),
  benefitsAndUsage: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  keywords: z.array(z.string()),
  condition: z.string().optional().default(""),
  color: z.string().optional().default(""),
  size: z.string().optional().default(""),
  model: z.string().optional().default(""),
  specs: z.record(z.string(), z.string()).optional().default({}),
});

function buildPrompt(product: z.infer<typeof schema>) {
  return `
Tu es un assistant e-commerce professionnel pour un administrateur de boutique.
Genere du contenu en francais pour une fiche produit. Le texte doit etre naturel, clair, vendeur, mais jamais exagere.

Produit:
- Nom: ${product.name}
- Marque/compagnie: ${product.brand || "non precisee"}
- Categorie: ${product.category || "non precisee"}
- Prix: ${product.price ?? "non precise"}
- Details fournis par admin: ${product.shortDetails || "aucun detail"}
- Image URL si disponible: ${product.imageUrl || "aucune"}

Contraintes strictes:
- Ne pas inventer de certification, partenariat, garantie longue, performance medicale ou promesse non prouvee.
- Pour la garantie, utiliser seulement des formulations comme "selon les conditions du vendeur" ou "selon la garantie disponible".
- Mentionner que l'admin doit valider le texte avant publication n'est pas necessaire dans le contenu.
- Si le produit touche a la sante, securite, enfant, sport, beaute, alimentation ou electronique, ajouter des precautions raisonnables.
- Tu peux proposer des valeurs pour les champs basiques manquants si elles sont raisonnablement inferables depuis le nom, la marque, la categorie, les details ou l'image.
- Ne retourne jamais de prix, prix promo, stock, variantes, shipping, protection plan, marketplace ou reduction.
- Retourne uniquement un JSON valide, sans markdown.

JSON attendu:
{
  "name": "nom produit propre si utile",
  "sku": "sku simple si absent, sans prix",
  "brand": "marque si identifiable",
  "shortDescription": "description courte professionnelle",
  "fullDescription": "description complete du produit",
  "benefitsAndUsage": "benefices et conseils d'utilisation",
  "seoTitle": "titre SEO court",
  "seoDescription": "meta description SEO",
  "keywords": ["mot cle 1", "mot cle 2", "mot cle 3"],
  "condition": "New, Open Box Excellent, Refurbished, etc. seulement si evident",
  "color": "couleur si evidente",
  "size": "taille/capacite si evidente",
  "model": "modele si evident",
  "specs": {
    "caracteristique": "valeur"
  }
}
`;
}

function safeJsonParse(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
}

async function imageAsGeminiPart(imageUrl?: string) {
  if (!imageUrl) return null;
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 4 * 1024 * 1024) return null;
    return {
      inline_data: {
        mime_type: contentType,
        data: bytes.toString("base64"),
      },
    };
  } catch {
    return null;
  }
}

async function generateWithGemini(product: z.infer<typeof schema>) {
  const configuredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const modelPath = configuredModel.startsWith("models/") ? configuredModel : `models/${configuredModel}`;
  const parts: unknown[] = [{ text: buildPrompt(product) }];
  const imagePart = await imageAsGeminiPart(product.imageUrl || undefined);
  if (imagePart) parts.push(imagePart);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.45,
          response_mime_type: "application/json",
        },
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Gemini generation failed");
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function generateWithOpenAI(product: z.infer<typeof schema>) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const content: unknown[] = [{ type: "text", text: buildPrompt(product) }];
  if (product.imageUrl) content.push({ type: "image_url", image_url: { url: product.imageUrl } });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content,
        },
      ],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "OpenAI generation failed");
  return data.choices?.[0]?.message?.content || "";
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product input", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Configure GEMINI_API_KEY or OPENAI_API_KEY in .env before using AI generation." },
      { status: 500 },
    );
  }

  try {
    const raw = process.env.GEMINI_API_KEY
      ? await generateWithGemini(parsed.data)
      : await generateWithOpenAI(parsed.data);
    const result = responseShape.parse(safeJsonParse(raw));
    return NextResponse.json({
      ...result,
      keywords: result.keywords.slice(0, 10),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI generation failed" },
      { status: 500 },
    );
  }
}
