
import { GoogleGenAI } from "@google/genai";
import { GenerationOptions, GeneratedImage } from '../types';

/**
 * Robust helper to convert a File object to a base64 string for the Gemini API.
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);
    
    return {
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    };
  } catch (error) {
    console.error("File processing error:", error);
    throw new Error("Failed to process the source photo. Please try a different image.");
  }
};

/**
 * Generates lifestyle images using the cost-effective gemini-2.5-flash-image model.
 * This model provides a great balance of editorial quality and much lower API costs.
 */
export const generateLifestyleImages = async (file: File, options: GenerationOptions): Promise<GeneratedImage[]> => {
  const referencePart = await fileToGenerativePart(file);

  const outfitDirectives: Record<string, string> = {
    "Jet-Set Executive Jumpsuit (NEW)": "Black tailored executive jumpsuit with a sleek, structured silhouette. Long-sleeve black jumpsuit with a deep V neckline, fitted waist with a slim belt detail, and clean tapered legs."
  };

  const resolvedOutfit = outfitDirectives[options.outfit] || options.outfit;

  const prompt = `Editorial Lifestyle Shoot. 
Subject: Exact facial features, bone structure, and identity from the reference image.
Scene: ${options.scenePreset} at ${options.location}.
Outfit: ${resolvedOutfit}.
Details: Hairstyle is ${options.hairstyle}, Makeup is ${options.makeup}, Skin is ${options.skin}.
Physical: Height ${options.height}, Bust ${options.bust}, Waist ${options.waist}, Hips ${options.hips}.
Camera: ${options.angle}. ${options.enhancer}
Style: High-end fashion magazine, realistic textures, cinematic lighting, 8k resolution.`;

  const mapAspectRatio = (ratio: string): "1:1" | "3:4" | "4:3" | "9:16" | "16:9" => {
    if (ratio.includes("9:16")) return "9:16";
    if (ratio.includes("16:9")) return "16:9";
    if (ratio.includes("4:3")) return "4:3";
    if (ratio.includes("3:4")) return "3:4";
    return "1:1";
  };

  const imageRequests = Array.from({ length: options.numberOfImages }).map(async (_, i) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Crucial: Flash is cost-optimized
      contents: {
        parts: [referencePart, { text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: mapAspectRatio(options.aspectRatio),
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("Rendering engine returned no output.");

    let imageData = '';
    let mimeType = 'image/png';
    
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data;
        mimeType = part.inlineData.mimeType;
        break;
      }
    }

    if (!imageData) throw new Error("Rendering failed to produce image data.");

    return {
      id: `studio-${Date.now()}-${i}`,
      src: `data:${mimeType};base64,${imageData}`,
      prompt: `${options.scenePreset} | ${options.location}`,
    };
  });

  return Promise.all(imageRequests);
};
