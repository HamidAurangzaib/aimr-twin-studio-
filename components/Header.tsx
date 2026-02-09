import React from 'react';

export const SparkleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-brand-gold"}>
    <path d="M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z" fill="currentColor"/>
    <circle cx="12" cy="13" r="1.5" fill="#121212" />
  </svg>
);

export const VibeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4 text-brand-gold"}>
    <path d="M12 3V4M12 20V21M21 12H20M4 12H3M18.364 18.364L17.657 17.657M6.343 6.343L5.636 5.636M18.364 5.636L17.657 6.343M6.343 17.657L5.636 16.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export const LocationIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4 text-brand-gold"}>
    <path d="M12 21C16 17.5 19 14.402 19 11C19 7.13401 15.866 4 12 4C8.13401 4 5 7.13401 5 11C5 14.402 8 17.5 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export const OutfitIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4 text-brand-gold"}>
    <path d="M12 4V2M12 4C10.8954 4 10 4.89543 10 6C10 7.10457 10.8954 8 12 8C13.1046 8 14 7.10457 14 6C14 4.89543 13.1046 4 12 4ZM12 8L4 12V14L12 11L20 14V12L12 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const HairIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4 text-brand-gold"}>
    <path d="M7 15C7 15 4 11 4 8C4 3.58172 7.58172 2 12 2C16.4183 2 20 3.58172 20 8C20 11 17 15 17 15M9 18C9 18 10 22 12 22C14 22 15 18 15 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MakeupIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4 text-brand-gold"}>
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="7" r="1.5" fill="currentColor"/>
    <circle cx="17" cy="10" r="1.5" fill="currentColor"/>
    <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="17" r="1.5" fill="currentColor"/>
    <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
    <circle cx="7" cy="10" r="1.5" fill="currentColor"/>
  </svg>
);

export const SkinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4 text-brand-gold"}>
    <path d="M12 16V22M12 2V5M5 12H2M22 12H19M19.07 19.07L16.95 16.95M7.05 7.05L4.93 4.93M19.07 4.93L16.95 7.05M7.05 19.07L4.93 16.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BodyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4 text-brand-gold"}>
    <path d="M4 6V18M20 6V18M4 12H20M7 12V9M10 12V10M13 12V10M17 12V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CameraIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4 text-brand-gold"}>
    <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 6L10 3H14L15 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const RatioIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4 text-brand-gold"}>
    <rect x="4" y="5" width="16" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 9H20M9 5V19M15 5V19" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
  </svg>
);

const Header: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="p-1.5 bg-brand-gold/10 rounded-full border border-brand-gold/20">
        <SparkleIcon className="h-4 w-4 text-brand-gold" />
      </div>
      <h1 className="text-xl md:text-2xl font-serif font-black tracking-tighter uppercase">
        <span className="text-brand-white">AIMR </span>
        <span className="text-brand-gold">TWIN STUDIO<sup>™</sup></span>
      </h1>
    </div>
  );
};

export default Header;