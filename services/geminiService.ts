
import { GenerationOptions, GeneratedImage } from '../types';
import { auth } from '../lib/firebase';

/**
 * Loads a File, downscales it so its largest side is at most `maxDim` pixels,
 * and re-encodes it as a compressed JPEG base64 string. Keeps the request body
 * well under Vercel's ~4.5 MB serverless limit (full-res photos otherwise 413)
 * and speeds up generation with no visible quality loss for the model.
 */
const fileToResizedBase64 = async (
  file: File,
  maxDim = 1280,
  quality = 0.85
): Promise<{ data: string; mimeType: string }> => {
  try {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('read-failed'));
      reader.readAsDataURL(file);
    });

    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('decode-failed'));
      image.src = dataUrl;
    });

    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no-canvas');
    ctx.drawImage(img, 0, 0, width, height);

    const out = canvas.toDataURL('image/jpeg', quality);
    const base64 = out.split(',')[1] || '';
    if (!base64) throw new Error('encode-failed');
    return { data: base64, mimeType: 'image/jpeg' };
  } catch {
    throw new Error('Failed to process the source photo. Please try a different image.');
  }
};

export const generateLifestyleImages = async (file: File, options: GenerationOptions): Promise<GeneratedImage[]> => {
  const { data: imageData, mimeType } = await fileToResizedBase64(file);

  // Fresh Firebase ID token proves the caller is a logged-in user of this app.
  const idToken = (await auth.currentUser?.getIdToken()) || '';

  const makeRequest = async (i: number): Promise<GeneratedImage> => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
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
