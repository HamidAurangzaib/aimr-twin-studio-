import React from 'react';

/**
 * Full-screen "under maintenance" gate. Shown instead of the app while
 * MAINTENANCE_MODE is on (see index.tsx). Reverting is a one-line change:
 * set MAINTENANCE_MODE = false and redeploy.
 */
const Maintenance: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center selection:bg-brand-gold selection:text-black">
      <img
        src="/twinora-logo.png"
        alt="TWINORA"
        className="h-16 md:h-24 w-auto object-contain mb-12 opacity-90"
      />

      <div className="flex items-center gap-6 w-full max-w-xs opacity-50 mb-10">
        <div className="h-[0.5px] flex-1 bg-brand-gold"></div>
        <span className="text-brand-gold text-[10px] font-bold uppercase tracking-[0.7em] whitespace-nowrap">
          Studio Offline
        </span>
        <div className="h-[0.5px] flex-1 bg-brand-gold"></div>
      </div>

      <h1 className="text-3xl md:text-5xl font-serif font-black text-white tracking-tight mb-8 leading-tight">
        We're Upgrading <span className="text-brand-gold italic">the Studio</span>
      </h1>

      <p className="text-white/50 max-w-md text-base md:text-lg font-light leading-relaxed tracking-wide">
        TWINORA is briefly offline for scheduled maintenance. We'll be back
        online very shortly — thank you for your patience.
      </p>

      <div className="mt-16 flex items-center gap-3 text-brand-gold/60">
        <span className="w-2 h-2 rounded-full bg-brand-gold/60 animate-pulse"></span>
        <span className="text-[10px] font-bold uppercase tracking-[0.5em]">
          Maintenance in progress
        </span>
      </div>
    </div>
  );
};

export default Maintenance;
