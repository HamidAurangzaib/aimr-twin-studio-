import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60,
};

// Public Firebase Web API key for the demo project (same one shipped in the
// client). Used only to validate that an ID token was issued by THIS project.
const FIREBASE_WEB_API_KEY =
  process.env.FIREBASE_WEB_API_KEY || "AIzaSyChOhFpbiLnRrqCiWeqoOUzi12At7qlrMU";

/**
 * Verifies a Firebase ID token via Google's Identity Toolkit.
 * Returns the user's uid if valid, otherwise null. The API key is
 * project-scoped, so tokens from other projects are rejected.
 */
async function verifyFirebaseToken(idToken) {
  if (!idToken) return null;
  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.users?.[0]?.localId || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Authentication: only logged-in demo users may generate ---
  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.body?.idToken;

  const uid = await verifyFirebaseToken(idToken);
  if (!uid) {
    return res
      .status(401)
      .json({ error: "Please log in again to continue generating." });
  }

  const { imageData, mimeType, options } = req.body;

  if (!imageData || !options) {
    return res.status(400).json({ error: "Missing imageData or options" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  const outfitDirectives = {
    "Jet-Set Executive Jumpsuit (NEW)":
      "Black tailored executive jumpsuit with a sleek, structured silhouette. Long-sleeve black jumpsuit with a deep V neckline, fitted waist with a slim belt detail, and clean tapered legs.",
  };

  const locationDirectives = {
    "CEO Studio Business Shot":
      "Professional CEO studio portrait. Confident entrepreneur seated on a luxury stool in a high-end photography studio. Tailored designer suit with open-collar shirt. Dark luxury backdrop with subtle texture. Strong executive presence. Looking directly into camera with confidence and authority. Soft cinematic studio lighting creating depth and dimension. Premium personal brand aesthetic. Corporate magazine cover quality. Wealthy founder energy. Sharp facial details. Natural skin texture. Luxury watch visible. DSLR photography, 85mm lens, shallow depth of field. Ultra realistic. Premium business portrait suitable for Forbes, Entrepreneur Magazine, keynote speaker profile, company website, LinkedIn banner, press features, and investor presentations. Captured in cinematic RAW DSLR format. No filters. Visible skin texture. Balanced professional lighting. Ultra high-end commercial photography.",
  };

  const resolvedOutfit = outfitDirectives[options.outfit] || options.outfit;
  const resolvedLocation = locationDirectives[options.location] || options.location;

  const prompt = `Editorial Lifestyle Shoot.
Subject: Exact facial features, bone structure, and identity from the reference image.
Scene: ${options.scenePreset} at ${resolvedLocation}.
Outfit: ${resolvedOutfit}.
Details: Hairstyle is ${options.hairstyle}, Makeup is ${options.makeup}, Skin is ${options.skin}.
Physical: Height ${options.height}, Bust ${options.bust}, Waist ${options.waist}, Hips ${options.hips}.
Camera: ${options.angle}. ${options.enhancer || ""}
Style: High-end fashion magazine, realistic textures, cinematic lighting, 8k resolution.`;

  const mapAspectRatio = (ratio) => {
    if (ratio?.includes("9:16")) return "9:16";
    if (ratio?.includes("16:9")) return "16:9";
    if (ratio?.includes("4:3")) return "4:3";
    if (ratio?.includes("3:4")) return "3:4";
    return "1:1";
  };

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: imageData, mimeType } },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: mapAspectRatio(options.aspectRatio),
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      return res.status(500).json({ error: "Rendering engine returned no output." });
    }

    let outImageData = "";
    let outMimeType = "image/png";

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        outImageData = part.inlineData.data;
        outMimeType = part.inlineData.mimeType;
        break;
      }
    }

    if (!outImageData) {
      return res.status(500).json({ error: "Rendering failed to produce image data." });
    }

    return res.status(200).json({ imageData: outImageData, mimeType: outMimeType });
  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(500).json({ error: err.message || "Image generation failed." });
  }
}
