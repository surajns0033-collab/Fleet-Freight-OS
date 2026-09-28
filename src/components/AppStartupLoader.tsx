import React, { useState, useEffect } from 'react';
import { Truck } from 'lucide-react';

interface AppStartupLoaderProps {
  onLoaded: () => void;
}

export const AppStartupLoader: React.FC<AppStartupLoaderProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Smooth progress increment
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 45);

    // Fade out and finish loading around 1.4s
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1300);

    const completeTimer = setTimeout(() => {
      onLoaded();
    }, 1600);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onLoaded]);

  return (
    <div 
      className={`fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center space-y-6 max-w-sm px-6 text-center">
        {/* Animated Truck Icon with subtle glow and road motion */}
        <div className="relative">
          {/* Ambient Glow */}
          <div className="absolute -inset-3 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
          
          {/* Truck Icon Box */}
          <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-xl shadow-amber-500/10 flex items-center justify-center text-amber-400">
            <Truck className="w-8 h-8 stroke-[2.2] animate-bounce" style={{ animationDuration: '1.2s' }} />
          </div>
        </div>

        {/* App Title */}
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>ROAD</span>
            <span className="text-amber-400">STAR</span>
            <span className="text-xs font-mono text-slate-400 font-normal ml-1">FLEET</span>
          </h1>
          <p className="text-xs font-mono text-slate-400">
            {progress < 40 && 'Initializing telematics...'}
            {progress >= 40 && progress < 80 && 'Connecting dispatch network...'}
            {progress >= 80 && 'Ready'}
          </p>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div 
            className="h-full bg-amber-500 rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
