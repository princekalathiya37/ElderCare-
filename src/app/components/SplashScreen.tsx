import React from 'react';
import { Button } from './ui/button';

interface SplashScreenProps {
  onContinue: () => void;
}

export function SplashScreen({ onContinue }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-4">
          <img
            src="/ChatGPT Image Jun 10, 2026, 11_31_09 AM.png"
            alt="ElderCare+ Logo"
            className="w-full max-w-sm object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'w-full max-w-sm flex flex-col items-center space-y-4';
              fallback.innerHTML = `
                <div class="w-40 h-40 rounded-full bg-primary/20 flex items-center justify-center text-6xl">🏥</div>
                <h1 class="text-primary font-bold" style="font-size: 2.5rem">ElderCare+</h1>
              `;
              target.parentNode?.insertBefore(fallback, target.nextSibling);
            }}
          />
        </div>

        <div className="space-y-6">
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full max-w-xs h-14 rounded-xl text-lg"
          >
            Get Started
          </Button>
          <p className="text-sm text-muted-foreground">
            Simple · Safe · Reliable
          </p>
        </div>
      </div>
    </div>
  );
}
