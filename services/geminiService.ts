
import { GenerationOptions, GeneratedImage } from '../types';
import { auth } from '../lib/firebase';

/**
 * Convert a File object to a base64 string + mime type for the API request.
 */
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

/**
 * Generates lifestyle images by calling our secure /api/generate serverless
 * endpoint. The Gemini API key lives only on the server — it is never shipped
 * to the browser, so it cannot be scraped or flagged as "leaked".
 */
export const generateLifestyleImages = async (file: File, options: GenerationOptions): Promise<GeneratedImage[]> => {
  const { data: imageData, mimeType } = await fileToBase64(file);

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
