import React from 'react';
import { Button } from './button';

export function GoogleButton({
  onClick,
  className = ''
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={`w-full h-16 text-xl font-semibold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl flex items-center justify-center gap-3 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="matrix(1,0,0,1,-2.4545,-3.1818)">
          <path
            d="M 26.999,14.755 C 26.999,13.823 26.923,12.909 26.782,12.034 L 14.5,12.034 L 14.5,15.19 L 21.881,15.19 C 21.618,16.65 20.829,17.946 19.635,18.867 L 19.635,21.896 L 23.375,21.896 C 25.65,19.789 26.999,17.476 26.999,14.755 Z"
            fill="#4285F4"
          />
          <path
            d="M 14.5,26 C 17.978,26 20.856,24.841 23.375,22.76 L 19.635,19.731 C 18.347,20.611 16.635,21.128 14.5,21.128 C 10.958,21.128 7.981,18.78 6.774,15.548 L 2.907,15.548 L 2.907,18.673 C 5.452,23.691 9.669,27 14.5,27 Z"
            fill="#34A853"
          />
          <path
            d="M 6.774,15.548 C 6.386,14.43 6.172,13.224 6.172,12 C 6.172,10.776 6.386,9.57 6.753,8.452 L 6.753,5.327 L 2.887,5.327 C 1.569,7.936 0.8,10.887 0.8,14 C 0.8,17.113 1.569,20.064 2.887,22.673 L 6.753,19.548 L 6.774,15.548 Z"
            fill="#FBBC05"
          />
          <path
            d="M 14.5,5.221 C 16.983,5.221 19.19,6.089 20.829,7.696 L 24.218,4.307 C 21.611,1.893 18.264,0.5 14.5,0.5 C 9.669,0.5 5.452,3.809 2.907,8.827 L 6.774,11.952 C 7.981,8.72 10.958,6.372 14.5,6.372 Z"
            fill="#EA4335"
          />
        </g>
      </svg>
      Sign in with Google
    </Button>
  );
}
