import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

  const resolvedOutfit = outfitDirectives[options.outfit] || options.outfit;

  const prompt = `Editorial Lifestyle Shoot.
Subject: Exact facial features, bone structure, and identity from the reference image.
Scene: ${options.scenePreset} at ${options.location}.
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
