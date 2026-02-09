
import React from 'react';

interface OptionSelectorProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  icon: React.ReactElement;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({ label, value, options, onChange, icon }) => {
  return (
    <div className="w-full space-y-6">
      <label className="flex items-center gap-4 text-[11px] font-black text-[#C4A67A] uppercase tracking-[0.5em] pl-1 opacity-90">
        <span className="scale-110">{icon}</span>
        {label}
      </label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#080808] border border-white/5 rounded-2xl py-8 pl-10 pr-16 text-base text-brand-text font-medium appearance-none cursor-pointer transition-all hover:bg-[#111] hover:border-[#C4A67A]/50 focus:outline-none focus:ring-1 focus:ring-[#C4A67A]/50 shadow-[0_25px_70px_rgba(0,0,0,0.6)]"
        >
          {options.map((option) => (
            <option key={option} value={option} className="bg-[#121212] text-brand-text py-4">
              {option}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-10 text-[#C4A67A]/50 group-hover:text-[#C4A67A] transition-colors">
           <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default OptionSelector;
