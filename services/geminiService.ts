
import { GenerationOptions, GeneratedImage } from '../types';
import { auth } from '../lib/firebase';

/**
 * Loads a File, downscales it so its largest side is at most `maxDim` pixels,
 * and re-encodes it as a compressed JPEG base64 string.
 *
 * Why: the serverless endpoint runs on Vercel, which caps request bodies at
 * ~4.5 MB. Full-resolution phone/DSLR photos easily exceed that once base64
 * encoded (it adds ~33%), causing 413 errors. A face reference doesn't need
 * more than ~1280px, so shrinking keeps us well under the limit and also makes
 * generation faster — with no visible quality loss for the model.
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

/**
 * Generates lifestyle images by calling our secure /api/generate serverless
 * endpoint. The Gemini API key lives only on the server — it is never shipped
 * to the browser, so it cannot be scraped or flagged as "leaked".
 */
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

  // Fire all requests in parallel, streaming each result into the UI as it
  // finishes rather than waiting for the whole batch.
  const imageRequests = Array.from({ length: options.numberOfImages }).map(async (_, i) => {
    const result = await makeRequest(i);
    if (options.onImageReady) options.onImageReady(result);
    return result;
  });

  return Promise.all(imageRequests);
};
