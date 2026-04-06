
import { GenerationOptions, GeneratedImage } from '../types';

const fileToBase64 = async (file: File): Promise<{ data: string; mimeType: string }> => {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return { data: btoa(binary), mimeType: file.type };
  } catch {
    throw new Error("Failed to process the source photo. Please try a different image.");
  }
};

export const generateLifestyleImages = async (file: File, options: GenerationOptions): Promise<GeneratedImage[]> => {
  const { data: imageData, mimeType } = await fileToBase64(file);

  const makeRequest = async (i: number): Promise<GeneratedImage> => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, mimeType, options }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Server error' }));
      throw new Error(err.error || `Request failed (${res.status})`);
    }

    const result = await res.json();

    return {
      id: `studio-${Date.now()}-${i}`,
      src: `data:${result.mimeType};base64,${result.imageData}`,
      prompt: `${options.scenePreset} | ${options.location}`,
    };
  };

  const imageRequests = Array.from({ length: options.numberOfImages }).map(async (_, i) => {
    const result = await makeRequest(i);
    if (options.onImageReady) options.onImageReady(result);
    return result;
  });

  return Promise.all(imageRequests);
};
