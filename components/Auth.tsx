
import React, { useState } from 'react';
import {
  // @ts-ignore
  signInWithCustomToken
} from 'firebase/auth';
// Fix: Import User as a type to resolve "no exported member" compiler errors
// @ts-ignore
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Passwordless email-only demo login. The frontend posts an email to this
// Cloud Function, which finds-or-creates the user and returns a custom token
// that we exchange for a session via signInWithCustomToken().
const DEMO_LOGIN_URL =
  'https://us-central1-aimr-twin-studio-demo.cloudfunctions.net/demoEmailLogin';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const syncUserToFirestore = async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || 'TWINORA User',
        email: user.email,
        photoFileName: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(DEMO_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Could not sign you in. Please try again.');
      }

      const cred = await signInWithCustomToken(auth, data.token);
      if (cred.user) {
        // Ensure a profile doc exists (no-op if already present).
        await syncUserToFirestore(cred.user);
      }
      // App.tsx's auth listener takes over from here and renders the studio.
    } catch (err: any) {
      console.error('Demo login error:', err);
      setError(err.message || 'Could not sign you in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center p-6 overflow-hidden selection:bg-brand-gold selection:text-black">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2400"
          alt="Editorial Face Background"
          className="w-full h-full object-cover grayscale brightness-[0.35] contrast-[1.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/75"></div>
      </div>

      <div className="relative z-10 mb-8 flex flex-col items-center animate-hero-reveal">
         <img src="/twinora-logo.png" alt="TWINORA" className="h-16 md:h-24 w-auto object-contain mb-4" />

         <div className="flex items-center gap-6 w-full max-w-sm opacity-50 px-4 mb-8">
           <div className="h-[0.5px] flex-1 bg-brand-gold"></div>
           <span className="text-brand-gold text-[10px] font-bold uppercase tracking-[0.8em] whitespace-nowrap">FOR HER</span>
           <div className="h-[0.5px] flex-1 bg-brand-gold"></div>
         </div>

         <h2 className="text-3xl md:text-[64px] font-serif font-black text-white tracking-tight text-center">
           Your <span className="text-brand-gold italic">AI</span> Digital Twin.
         </h2>

         <div className="text-brand-gold/60 animate-bounce mt-10 mb-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M7 13L12 18L17 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M7 7L12 12L17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </svg>
         </div>

         <div className="flex items-center gap-12 md:gap-20">
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.4em] mb-3">CONSISTENCY</span>
               <div className="w-10 h-[1px] bg-brand-gold/60"></div>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.4em] mb-3">LUXURY</span>
               <div className="w-10 h-[1px] bg-brand-gold/60"></div>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.4em] mb-3">HYPER-REAL</span>
               <div className="w-10 h-[1px] bg-brand-gold/60"></div>
            </div>
         </div>
      </div>

      <div className="relative z-10 w-full max-w-lg animate-hero-reveal mb-12" style={{animationDelay: '0.2s'}}>
        <div className="bg-[#0c0c0c]/80 backdrop-blur-3xl border border-white/10 p-16 rounded-[4.5rem] shadow-[0_60px_120px_rgba(0,0,0,0.9)]">
          <h3 className="text-2xl font-serif font-black text-center text-brand-gold mb-6 uppercase tracking-[0.6em]">
            ACCESS
          </h3>
          <p className="text-center text-white/40 text-[11px] font-bold uppercase tracking-[0.35em] mb-14 leading-relaxed">
            Enter your email to step into the studio.
          </p>

          <form onSubmit={handleLogin} className="space-y-10">
            <div className="group">
              <label className="block text-[10px] font-black text-brand-muted mb-4 uppercase tracking-[0.5em]">STUDIO EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@email.com"
                className="w-full p-6 bg-black/40 border border-white/5 rounded-2xl text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-gold/40 transition-all font-light text-lg"
              />
            </div>

            {error && <p className="text-red-500 text-[11px] font-black uppercase text-center tracking-[0.3em]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-8 bg-brand-gold text-black font-black rounded-3xl hover:bg-white transition-all duration-700 uppercase tracking-[0.8em] text-[12px] shadow-[0_20px_40px_rgba(177,148,108,0.2)] disabled:opacity-60"
            >
              {loading ? "ESTABLISHING..." : "ENTER"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes hero-reveal {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-hero-reveal {
          animation: hero-reveal 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Auth;
