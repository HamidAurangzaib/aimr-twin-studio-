import React, { useState, useEffect } from 'react';

const loadingMessages = [
    "Scouting editorial locations...",
    "Curating your signature look...",
    "Refining light and texture...",
    "Developing your digital twin...",
    "Setting the premium scene...",
    "Applying final enhancements...",
];

const Loader: React.FC = () => {
  const [message, setMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = loadingMessages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed inset-0 bg-brand-charcoal/95 flex flex-col items-center justify-center z-50 backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 border-2 border-brand-plum/30 rounded-full"></div>
        <div className="w-20 h-20 border-t-2 border-brand-gold rounded-full animate-spin absolute"></div>
      </div>
      <p className="mt-8 text-lg font-medium text-brand-gold tracking-[0.2em] uppercase animate-pulse text-center px-4">
        {message}
      </p>
    </div>
  );
};

export default Loader;