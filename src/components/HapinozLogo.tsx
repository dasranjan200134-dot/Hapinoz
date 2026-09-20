import React, { useState } from 'react';
import { useStore } from '../lib/store';

interface HapinozLogoProps {
  className?: string;
  variant?: 'dark' | 'light'; // 'dark' = dark text for light backgrounds, 'light' = white text for dark backgrounds
  showTagline?: boolean;
  taglineClassName?: string;
}

export const HapinozLogo: React.FC<HapinozLogoProps> = ({
  className = 'h-10',
  variant = 'dark',
}) => {
  const { customLogoUrl } = useStore();
  const [imageError, setImageError] = useState(false);

  // If user has uploaded a custom image (e.g. data:image/... base64)
  const isCustomUploaded = Boolean(customLogoUrl && customLogoUrl.startsWith('data:image/') && !imageError);

  // Main text color based on background variant
  const textColor = variant === 'light' ? '#FFFFFF' : '#202434';

  return (
    <div className="inline-flex items-center justify-center select-none">
      <div className={`relative flex items-center ${className}`}>
        {isCustomUploaded ? (
          <img
            src={customLogoUrl}
            alt="Hapinoz"
            className={`h-full w-auto max-w-full object-contain ${
              variant === 'light' ? 'filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]' : ''
            }`}
            onError={() => setImageError(true)}
            loading="eager"
          />
        ) : (
          /* Exact Vector Logo matching user-uploaded brand design */
          <svg
            viewBox="0 0 380 150"
            className={`h-full w-auto max-w-full overflow-visible ${
              variant === 'light' ? 'filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]' : ''
            }`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Hapinoz"
          >
            <defs>
              <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@900&display=swap');
                .hapinoz-brand-mark {
                  font-family: 'Nunito', system-ui, -apple-system, sans-serif;
                  font-weight: 900;
                  font-size: 88px;
                  letter-spacing: -1.5px;
                }
              `}</style>
            </defs>

            <g transform="translate(10, 6)">
              {/* Wordmark with dotless i */}
              <text
                x="8"
                y="92"
                className="hapinoz-brand-mark"
                fill={textColor}
              >
                Hapınoz
              </text>

              {/* Two Vibrant Green Sprout Leaves crowned above 'i' */}
              <g transform="translate(182, 38)">
                {/* Left Leaf */}
                <path
                  d="M 0,0 C -6,-3 -18,-5 -21,-17 C -16,-22 -5,-19 0,-8 Z"
                  fill="#22C55E"
                />
                {/* Right Leaf */}
                <path
                  d="M 0,0 C 6,-3 18,-5 21,-17 C 16,-22 5,-19 0,-8 Z"
                  fill="#16A34A"
                />
              </g>

              {/* Radiant Orange Smile Swoop with Dimple Terminals under 'apino' */}
              <g>
                <circle cx="86" cy="106" r="6.5" fill="#FF6A00" />
                <path
                  d="M 86,106 C 134,142 232,142 280,106"
                  fill="none"
                  stroke="#FF6A00"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                <circle cx="280" cy="106" r="6.5" fill="#FF6A00" />
              </g>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};
