
export interface GenerationOptions {
  outfit: string;
  location: string;
  hairstyle: string;
  makeup: string;
  angle: string;
  skin: string;
  numberOfImages: number;
  enhancer: string;
  scenePreset: string; // This now represents Mood/Vibe
  height: string;
  bust: string;
  waist: string;
  hips: string;
  aspectRatio: string;
  /** Called each time a single image finishes — enables progressive streaming UI */
  onImageReady?: (image: GeneratedImage) => void;
}

export interface GeneratedImage {
  id: string;
  src: string;
  prompt: string;
}
