
import React, { useState, useEffect } from 'react';
import { 
  // @ts-ignore
  signInWithEmailAndPassword, 
  // @ts-ignore
  createUserWithEmailAndPassword,
  // @ts-ignore
  sendEmailVerification,
  // @ts-ignore
  signOut,
  // @ts-ignore
  onAuthStateChanged
} from 'firebase/auth';
// Fix: Import User as a type to resolve "no exported member" compiler errors
// @ts-ignore
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { mapAuthError, sendPasswordResetEmail } from '../lib/auth';

const Auth: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const [verificationEmail, setVerificationEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      if (currentUser && !currentUser.emailVerified) {
        setVerificationEmail(currentUser.email || '');
        setShowVerification(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const syncUserToFirestore = async (user: User, displayName?: string) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: displayName || user.displayName || 'AIMR User',
        email: user.email,
        photoFileName: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await syncUserToFirestore(userCredential.user, name);
          await sendEmailVerification(userCredential.user);
          setVerificationEmail(email);
          setShowVerification(true);
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (userCredential.user && !userCredential.user.emailVerified) {
          setVerificationEmail(email);
          setShowVerification(true);
        }
      }
    } catch (err: any) {
      console.error("Auth Error Trace:", err);
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Enter email first."); return; }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(email);
      setResetSent(true);
    } catch (err: any) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAndReset = async () => {
    await signOut(auth);
    setShowVerification(false);
    setIsRegistering(false);
    setIsForgotPassword(false);
    setResetSent(false);
    setError(null);
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white selection:bg-brand-gold">
        <div className="max-w-md w-full p-16 bg-[#111] rounded-[4rem] border border-white/5 shadow-2xl text-center">
          <h2 className="text-4xl font-serif font-black text-brand-gold mb-6 uppercase tracking-widest leading-tight">Verification</h2>
          <p className="text-white/60 mb-12 text-base font-light leading-relaxed tracking-wide">A digital invitation has been dispatched to <span className="text-brand-gold font-bold">{verificationEmail}</span>. Please verify your identity.</p>
          <button onClick={handleSignOutAndReset} className="w-full py-6 bg-brand-gold text-black font-black rounded-xl uppercase tracking-[0.6em] text-[11px] hover:bg-white transition-colors duration-500 shadow-lg">BACK TO ENTRY</button>
        </div>
      </div>
    );
  }

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
         <h1 className="text-5xl md:text-8xl font-serif font-black tracking-[-0.04em] leading-none mb-4">
           <span className="text-white uppercase">AIMR </span>
           <span className="text-brand-gold uppercase">TWIN STUDIO<sup>™</sup></span>
         </h1>
         
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
          <h3 className="text-2xl font-serif font-black text-center text-brand-gold mb-16 uppercase tracking-[0.6em]">
            {isForgotPassword ? "RECOVERY" : (isRegistering ? "ENROLLMENT" : "ACCESS")}
          </h3>
          
          <form onSubmit={isForgotPassword ? handleForgotPassword : handleAuth} className="space-y-10">
            {isRegistering && (
              <div className="group">
                <label className="block text-[10px] font-black text-brand-muted mb-4 uppercase tracking-[0.5em]">IDENTITY NAME</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-6 bg-black/40 border border-white/5 rounded-2xl text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-gold/40 transition-all font-light text-lg" />
              </div>
            )}
            <div className="group">
              <label className="block text-[10px] font-black text-brand-muted mb-4 uppercase tracking-[0.5em]">STUDIO EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-6 bg-black/40 border border-white/5 rounded-2xl text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-gold/40 transition-all font-light text-lg" />
            </div>
            {!isForgotPassword && (
              <div className="group">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.5em]">PASSWORD</label>
                  {!isRegistering && <button type="button" onClick={() => setIsForgotPassword(true)} className="text-brand-gold/60 text-[10px] font-black uppercase hover:text-brand-gold transition-colors tracking-[0.4em]">FORGOT?</button>}
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-6 bg-black/40 border border-white/5 rounded-2xl text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-gold/40 transition-all font-light text-lg" />
              </div>
            )}
            {isRegistering && (
               <div className="group">
                <label className="block text-[10px] font-black text-brand-muted mb-4 uppercase tracking-[0.5em]">CONFIRM PASSWORD</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-6 bg-black/40 border border-white/5 rounded-2xl text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-gold/40 transition-all font-light text-lg" />
              </div>
            )}
            
            {isRegistering && (
              <div className="flex items-start gap-4">
                <input 
                  type="checkbox" 
                  required 
                  className="mt-1 w-4 h-4 bg-black/40 border border-white/10 rounded cursor-pointer accent-brand-gold flex-shrink-0" 
                />
                <div className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] leading-relaxed text-left">
                  <p>I understand that I must sign up and log in using the same email used to purchase this app. Access may be delayed or removed if emails do not match.</p>
                  <p className="mt-2 text-brand-gold">PLEASE CONFIRM TO CONTINUE.</p>
                </div>
              </div>
            )}
            
            {error && <p className="text-red-500 text-[11px] font-black uppercase text-center tracking-[0.3em]">{error}</p>}
            {resetSent && <p className="text-brand-gold text-[11px] font-black uppercase text-center tracking-[0.3em]">Check your email for the password reset link.</p>}
            
            <button type="submit" disabled={loading} className="w-full py-8 bg-brand-gold text-black font-black rounded-3xl hover:bg-white transition-all duration-700 uppercase tracking-[0.8em] text-[12px] shadow-[0_20px_40px_rgba(177,148,108,0.2)]">
              {loading ? "ESTABLISHING..." : (isForgotPassword ? "RESET" : (isRegistering ? "REGISTER" : "ENTER"))}
            </button>
            
            <div className="text-center pt-8 border-t border-white/10">
               <button type="button" onClick={() => { if (isRegistering || isForgotPassword) { setIsRegistering(false); setIsForgotPassword(false); } else { setIsRegistering(true); } setResetSent(false); setError(null); }} className={`font-black uppercase transition-colors ${isRegistering || isForgotPassword ? "text-white/30 hover:text-brand-gold text-[10px] tracking-[0.6em]" : "text-brand-gold/80 hover:text-brand-gold text-[13px] tracking-[0.3em] underline underline-offset-4 decoration-brand-gold/40 hover:decoration-brand-gold"}`}>
                  {isRegistering || isForgotPassword ? "RETURN TO LOGIN" : "NEW HERE? REGISTER YOUR TWIN"}
               </button>
            </div>
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
