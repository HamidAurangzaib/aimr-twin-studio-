
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { signOut, onAuthStateChanged } from 'firebase/auth';
// @ts-ignore
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { authReady } from './lib/auth';
import { GenerationOptions, GeneratedImage } from './types';
import {
  OUTFIT_STYLES,
  LOCATIONS,
  HAIRSTYLES,
  MAKEUP_LOOKS,
  CAMERA_ANGLES,
  SKIN_STYLES,
  MOODS,
  HEIGHT_OPTIONS,
  BUST_SIZES,
  WAIST_SIZES,
  HIPS_SIZES,
  ASPECT_RATIOS
} from './constants';

import Header, {
  VibeIcon,
  LocationIcon,
  OutfitIcon,
  HairIcon,
  MakeupIcon,
  SkinIcon,
  BodyIcon,
  CameraIcon,
  RatioIcon
} from './components/Header';
import ImageUploader from './components/ImageUploader';
import OptionSelector from './components/OptionSelector';
import ImageGallery from './components/ImageGallery';
import Loader from './components/Loader';
import Auth from './components/Auth';
import Profile from './components/Profile';

const LIFETIME_IMAGE_LIMIT = 4;
const CHECKOUT_URL = 'https://aitwin.aimasteryrevolution.com/uk-checkout-page-5549';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lifetimeUsed, setLifetimeUsed] = useState(0);

  const [options, setOptions] = useState<GenerationOptions>({
    outfit: OUTFIT_STYLES[0],
    location: LOCATIONS[0],
    hairstyle: HAIRSTYLES[0],
    makeup: MAKEUP_LOOKS[0],
    angle: CAMERA_ANGLES[0],
    skin: SKIN_STYLES[0],
    numberOfImages: 4,
    enhancer: '',
    scenePreset: MOODS[0],
    height: HEIGHT_OPTIONS[0],
    bust: BUST_SIZES[0],
    waist: WAIST_SIZES[0],
    hips: HIPS_SIZES[0],
    aspectRatio: ASPECT_RATIOS[0],
  });

  const loadUserUsage = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setLifetimeUsed(snap.data().lifetimeImagesUsed || 0);
      }
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      const initialUser = await authReady;
      setUser(initialUser);
      if (initialUser) {
        await loadUserUsage(initialUser.uid);
      }
      setInitializing(false);

      onAuthStateChanged(auth, async (u: User | null) => {
        setUser(u);
        if (u) {
          await loadUserUsage(u.uid);
        } else {
          setLifetimeUsed(0);
        }
      });
    };
    init();
  }, []);

  const handleImageUpload = (file: File) => {
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!image) {
      setError("Please upload a source photo first.");
      return;
    }

    setLoading(true);
    setError(null);

    let creditReserved = false;
    let completedCount = 0;

    try {
      // Reserve credits on the server (enforces per-user lifetime limit)
      const token = await user.getIdToken();
      const checkRes = await fetch('https://us-central1-aimr-twin-studio-demo.cloudfunctions.net/checkAndIncrementUsageDemo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ count: options.numberOfImages }),
      });

      if (!checkRes.ok) {
        const errData = await checkRes.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.error || 'Failed to reserve credits');
      }

      const usageResult = await checkRes.json();
      if (!usageResult.success) {
        throw new Error("SERVER_REJECTED_USAGE");
      }

      creditReserved = true;
      setLifetimeUsed(usageResult.used);

      // Convert image to base64 for the API route
      const buffer = await image.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const imageData = btoa(binary);
      const mimeType = image.type;

      // Fire all image requests in parallel, stream each into gallery as it finishes
      const imageRequests = Array.from({ length: options.numberOfImages }).map(async (_, i) => {
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
        const img: GeneratedImage = {
          id: `studio-${Date.now()}-${i}`,
          src: `data:${result.mimeType};base64,${result.imageData}`,
          prompt: `${options.scenePreset} | ${options.location}`,
        };

        completedCount++;
        setGeneratedImages(prev => [img, ...prev]);
        if (completedCount === 1) {
          window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        }
        return img;
      });

      await Promise.all(imageRequests);

    } catch (err: any) {
      if (err.message?.includes("LIFETIME_IMAGE_LIMIT_REACHED") || err.code === 'resource-exhausted') {
        setError(`Lifetime demo limit reached (${LIFETIME_IMAGE_LIMIT} free images). Click "Unlock Full Access" to continue.`);
        setLifetimeUsed(LIFETIME_IMAGE_LIMIT);
      } else {
        // Refund credits for images that didn't complete
        if (creditReserved) {
          const failedCount = options.numberOfImages - completedCount;
          if (failedCount > 0) {
            try {
              const token = await user.getIdToken();
              const refundRes = await fetch('https://us-central1-aimr-twin-studio-demo.cloudfunctions.net/refundUsageDemo', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ count: failedCount }),
              });
              if (refundRes.ok) {
                const refundData = await refundRes.json();
                setLifetimeUsed(refundData.used);
              }
            } catch {}
          }
        }
        setError(err.message || "Studio encountered a server error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (initializing) return <Loader />;
  if (!user) return <Auth />;

  const remainingCredits = Math.max(0, LIFETIME_IMAGE_LIMIT - lifetimeUsed);

  return (
    <div className="min-h-screen bg-brand-charcoal text-brand-text font-sans selection:bg-brand-gold selection:text-brand-charcoal">
      {loading && <Loader />}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(196,166,122,0.15),transparent_75%)] pointer-events-none"></div>

      {showProfile && <Profile user={user} onClose={() => setShowProfile(false)} />}

      <nav className="sticky top-0 z-40 w-full bg-[#0a0a0a]/95 backdrop-blur-3xl border-b border-white/5 py-6 px-6 md:px-12">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <Header />
          <div className="flex items-center gap-10">
            <button onClick={() => setShowProfile(true)} className="group flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-[#C4A67A]/10 border border-[#C4A67A]/30 flex items-center justify-center shadow-lg group-hover:border-[#C4A67A]/60 transition-all">
                <span className="text-[#C4A67A] font-bold text-xs">{user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Studio Profile</span>
                <span className="text-[9px] font-bold text-[#C4A67A] uppercase tracking-[0.1em]">{remainingCredits} Free Images left</span>
              </div>
            </button>
            <button onClick={() => signOut(auth)} className="text-[10px] font-black text-brand-muted uppercase tracking-[0.4em] hover:text-red-400 transition-colors">Sign Out</button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-screen-xl mx-auto px-6 py-24">

        <div className="flex flex-col items-center mb-52">
          <div className="text-center space-y-6 mb-24">
            <p className="text-[11px] font-black text-[#C4A67A] uppercase tracking-[1em] opacity-80">Phase 01</p>
            <h2 className="text-6xl md:text-9xl font-serif font-black text-white uppercase tracking-tighter leading-none">Upload Source</h2>
            <div className="w-24 h-[2px] bg-[#C4A67A]/30 mx-auto mt-4"></div>
          </div>
          <ImageUploader onImageUpload={handleImageUpload} imagePreview={preview} />
        </div>

        <div className="max-w-5xl mx-auto space-y-64">

          <section className="space-y-32">
            <div className="text-center space-y-6">
              <p className="text-[11px] font-black text-[#C4A67A] uppercase tracking-[1em] opacity-80">Phase 02</p>
              <h2 className="text-5xl md:text-8xl font-serif font-black text-white uppercase tracking-tighter leading-none">Customize Your Scene</h2>
              <div className="w-20 h-[2px] bg-[#C4A67A]/30 mx-auto mt-4"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <OptionSelector label="The Vibe" value={options.scenePreset} options={MOODS} onChange={(v) => setOptions({ ...options, scenePreset: v })} icon={<VibeIcon />} />
              <OptionSelector label="The Scene" value={options.location} options={LOCATIONS} onChange={(v) => setOptions({ ...options, location: v })} icon={<LocationIcon />} />
              <OptionSelector label="The Outfit" value={options.outfit} options={OUTFIT_STYLES} onChange={(v) => setOptions({ ...options, outfit: v })} icon={<OutfitIcon />} />
            </div>
          </section>

          <section className="space-y-32">
            <div className="text-center space-y-6">
              <p className="text-[11px] font-black text-[#C4A67A] uppercase tracking-[1em] opacity-80">Phase 03</p>
              <h2 className="text-5xl md:text-8xl font-serif font-black text-white uppercase tracking-tighter leading-none">Refine Your Twin</h2>
              <div className="w-20 h-[2px] bg-[#C4A67A]/30 mx-auto mt-4"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
              <OptionSelector label="Hair Style" value={options.hairstyle} options={HAIRSTYLES} onChange={(v) => setOptions({ ...options, hairstyle: v })} icon={<HairIcon />} />
              <OptionSelector label="Makeup Palette" value={options.makeup} options={MAKEUP_LOOKS} onChange={(v) => setOptions({ ...options, makeup: v })} icon={<MakeupIcon />} />
              <OptionSelector label="Skin Style" value={options.skin} options={SKIN_STYLES} onChange={(v) => setOptions({ ...options, skin: v })} icon={<SkinIcon />} />
              <OptionSelector label="Height" value={options.height} options={HEIGHT_OPTIONS} onChange={(v) => setOptions({ ...options, height: v })} icon={<BodyIcon />} />
              <OptionSelector label="Bust Line" value={options.bust} options={BUST_SIZES} onChange={(v) => setOptions({ ...options, bust: v })} icon={<BodyIcon />} />
              <OptionSelector label="Waist Ratio" value={options.waist} options={WAIST_SIZES} onChange={(v) => setOptions({ ...options, waist: v })} icon={<BodyIcon />} />
              <OptionSelector label="Hips Sculpt" value={options.hips} options={HIPS_SIZES} onChange={(v) => setOptions({ ...options, hips: v })} icon={<BodyIcon />} />
            </div>
          </section>

          <section className="space-y-32">
            <div className="text-center space-y-6">
              <p className="text-[11px] font-black text-[#C4A67A] uppercase tracking-[1em] opacity-80">Phase 04</p>
              <h2 className="text-5xl md:text-8xl font-serif font-black text-white uppercase tracking-tighter leading-none">Final Touches</h2>
              <div className="w-20 h-[2px] bg-[#C4A67A]/30 mx-auto mt-4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-24 items-end">
              <OptionSelector label="Camera Angle" value={options.angle} options={CAMERA_ANGLES} onChange={(v) => setOptions({ ...options, angle: v })} icon={<CameraIcon />} />
              <OptionSelector label="Aspect Ratio" value={options.aspectRatio} options={ASPECT_RATIOS} onChange={(v) => setOptions({ ...options, aspectRatio: v })} icon={<RatioIcon />} />

              <div className="space-y-10 pb-6">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-[#C4A67A] uppercase tracking-[0.4em]">Batch Size: {options.numberOfImages} Images</label>
                </div>
                <div className="relative pt-2">
                  <input
                    type="range" min="1" max="4" step="1"
                    value={options.numberOfImages}
                    onChange={(e) => setOptions({ ...options, numberOfImages: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#C4A67A]"
                  />
                  <div className="flex justify-between mt-5">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">1</span>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">4</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-16">
              <p className="text-center text-[11px] font-black text-[#C4A67A] uppercase tracking-[0.8em]">Optional: Make It Custom</p>
              <div className="relative max-w-3xl mx-auto">
                <textarea
                  placeholder='e.g. "Golden hour glow", "holding a vintage camera"...'
                  value={options.enhancer}
                  onChange={(e) => setOptions({ ...options, enhancer: e.target.value })}
                  className="relative w-full h-56 bg-[#080808] border border-white/10 rounded-[3.5rem] p-16 text-xl text-brand-text placeholder:text-brand-muted/20 focus:outline-none focus:ring-1 focus:ring-[#C4A67A]/50 transition-all resize-none italic leading-relaxed text-center"
                />
              </div>
            </div>

            <div className="flex flex-col items-center pt-28">
              <div className="flex items-center gap-3 mb-14">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/50">Demo Credits Used:</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C4A67A]">{lifetimeUsed} / {LIFETIME_IMAGE_LIMIT} FREE IMAGES</span>
              </div>

              {error && (
                <div className="mb-14 px-12 py-7 bg-red-950/50 border border-red-900/60 rounded-3xl text-[13px] font-bold text-red-100 uppercase tracking-widest text-center shadow-2xl animate-pulse">
                  {error}
                </div>
              )}

              {remainingCredits === 0 ? (
                <div className="flex flex-col items-center gap-8 w-full max-w-md">
                  <div className="text-center space-y-4">
                    <p className="text-[11px] font-black text-[#C4A67A] uppercase tracking-[0.6em]">Demo Limit Reached</p>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">You've used all 4 free demo images. Unlock the full studio — 16 images per day — with a full membership.</p>
                  </div>
                  <a
                    href={CHECKOUT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full text-center py-12 bg-[#C4A67A] text-brand-charcoal font-black rounded-full hover:scale-[1.05] active:scale-[0.98] transition-all duration-500 shadow-[0_40px_110px_rgba(196,166,122,0.8)] uppercase tracking-[0.6em] text-[14px] group overflow-hidden border border-white/20"
                  >
                    <span className="relative z-10 drop-shadow-xl font-black">Unlock Full Access</span>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-30 transition-opacity"></div>
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_2s_infinite] pointer-events-none"></div>
                  </a>
                </div>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={loading || !image}
                  className="relative w-full max-w-md py-12 bg-[#C4A67A] text-brand-charcoal font-black rounded-full hover:scale-[1.05] active:scale-[0.98] transition-all duration-500 shadow-[0_40px_110px_rgba(196,166,122,0.8)] uppercase tracking-[1.4em] text-[20px] disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden border border-white/20"
                >
                  <span className="relative z-10 drop-shadow-xl font-black">
                    {loading ? "Manifesting..." : "Render Twin"}
                  </span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_2s_infinite] pointer-events-none"></div>
                </button>
              )}
            </div>
          </section>

        </div>

        <div id="gallery-root">
          {generatedImages.length > 0 ? (
            <div className="mt-80">
              <ImageGallery images={generatedImages} />
            </div>
          ) : (
            <div className="mt-24 md:mt-80 flex flex-col items-center justify-center text-center transition-all duration-1000 px-4">
              <h3 className="text-[clamp(3rem,18vw,9rem)] font-serif font-black uppercase tracking-tighter text-[#C4A67A]/80 select-none leading-none drop-shadow-[0_15px_60px_rgba(196,166,122,0.5)]">Manifest Identity</h3>
              <p className="mt-8 md:mt-12 text-[10px] font-black text-brand-muted uppercase tracking-[1em] opacity-40">Awaiting Generation</p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-96 pb-40 border-t border-white/5 pt-40 px-12">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-24">
          <div className="flex flex-col items-center md:items-start space-y-6">
            <h4 className="text-lg font-black text-[#C4A67A] uppercase tracking-[0.8em]">AIMR Twin Studio™</h4>
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.6em]">Premium Digital Identity Architecture</p>
          </div>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.7em] text-center md:text-right italic">
            &copy; {new Date().getFullYear()} Proprietary Technology.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default App;
