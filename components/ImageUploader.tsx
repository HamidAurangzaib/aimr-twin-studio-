
import React, { useRef } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imagePreview: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreview }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-sm group">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <div
        className="w-full aspect-[3/4] border border-white/10 rounded-[3rem] flex items-center justify-center cursor-pointer bg-[#0c0c0c] hover:bg-[#121212] transition-all duration-700 relative overflow-hidden group-hover:border-brand-gold/40 shadow-2xl"
        onClick={handleClick}
      >
        {imagePreview ? (
          <div className="w-full h-full p-4">
             <img src={imagePreview} alt="Reference Preview" className="w-full h-full object-cover rounded-[2rem] transition-transform duration-1000 group-hover:scale-105" />
             <div className="absolute inset-0 bg-brand-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Replace Image</p>
             </div>
          </div>
        ) : (
          <div className="text-center p-12 space-y-6">
            <div className="w-20 h-20 bg-brand-gold/5 rounded-full flex items-center justify-center mx-auto border border-brand-gold/10 group-hover:scale-110 group-hover:bg-brand-gold/10 transition-all duration-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <div>
              <p className="font-serif italic text-2xl text-brand-white">Drop Source</p>
              <p className="text-[9px] font-black text-brand-gold uppercase tracking-[0.3em] mt-2">Editorial Reference</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
