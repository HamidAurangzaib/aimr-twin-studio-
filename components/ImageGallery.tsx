import React from 'react';
import { GeneratedImage } from '../types';

interface ImageGalleryProps {
  images: GeneratedImage[];
  title?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, title }) => {

  const handleDownload = (src: string, name: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${name.replace(/\s+/g, '-')}-AIMRTwinStudio.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  if (images.length === 0) return null;

  const displayTitle = title || "Your Lifestyle Scenes";

  return (
    <div className="w-full mt-20 pb-20">
      <div className="flex flex-col items-center justify-center mb-12">
          <h2 className="text-4xl font-serif font-black text-center text-brand-text uppercase tracking-[0.1em] mb-4">
            {displayTitle}
          </h2>
          <div className="w-24 h-1 bg-brand-gold rounded-full"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((image) => (
          <div key={image.id} className="group relative overflow-hidden rounded-[2rem] shadow-2xl bg-brand-surface border border-white/5 hover:border-brand-gold/40 transition-all duration-700 aspect-[9/14]">
            <img 
              src={image.src} 
              alt={image.prompt} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            />
            
            {/* Premium Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
               <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-2">Studio Generation</p>
                  <h3 className="text-xl font-serif font-bold text-brand-text mb-6 leading-tight">
                    {image.prompt}
                  </h3>
                  <button 
                    onClick={() => handleDownload(image.src, image.prompt)}
                    className="w-full py-4 bg-brand-gold text-brand-charcoal rounded-2xl hover:bg-brand-white transition-all duration-300 shadow-xl text-[10px] font-black uppercase tracking-[0.2em]"
                    aria-label="Download image"
                  >
                    Archive Vision
                  </button>
               </div>
            </div>

            {/* Subtle Brand Watermark */}
            <div className="absolute top-4 left-4 opacity-30 pointer-events-none">
               <p className="text-[8px] font-bold text-brand-white uppercase tracking-[0.4em] rotate-90 origin-left">AIMR STUDIO</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;