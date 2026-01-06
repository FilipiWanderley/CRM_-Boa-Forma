import { useEffect, useState } from 'react';
import logoBoaForma from '@/assets/logo-boaforma.png';

interface SplashScreenProps {
  onComplete: () => void;
  unitName?: string;
  logoUrl?: string;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    // Stage 1: Logo appears
    const timer1 = setTimeout(() => setAnimationStage(1), 100);
    // Stage 2: Text appears
    const timer2 = setTimeout(() => setAnimationStage(2), 500);
    // Stage 3: Pulse effect
    const timer3 = setTimeout(() => setAnimationStage(3), 1000);
    // Stage 4: Fade out
    const timer4 = setTimeout(() => setAnimationStage(4), 1800);
    // Complete
    const timer5 = setTimeout(() => onComplete(), 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        animationStage >= 4 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[100px] transition-all duration-1000 ${
            animationStage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
        />
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/30 blur-[80px] transition-all duration-1000 delay-200 ${
            animationStage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
        />
      </div>

      {/* Logo container */}
      <div 
        className={`relative z-10 transition-all duration-700 ${
          animationStage >= 1 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-75 translate-y-8'
        } ${
          animationStage >= 3 ? 'animate-pulse' : ''
        }`}
      >
        <img 
          src={logoBoaForma} 
          alt="Academia Boa Forma" 
          className="h-28 w-28 object-contain rounded-3xl shadow-2xl shadow-primary/30 brightness-0 invert"
        />
      </div>

      {/* Text */}
      <div 
        className={`relative z-10 mt-6 text-center transition-all duration-500 ${
          animationStage >= 2 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">
          Academia Boa Forma
        </h1>
        <p className="text-muted-foreground mt-1">Seu treino, seu ritmo</p>
      </div>

      {/* Loading indicator */}
      <div 
        className={`relative z-10 mt-12 transition-all duration-500 ${
          animationStage >= 2 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
