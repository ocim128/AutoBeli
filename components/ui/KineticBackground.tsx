"use client";

import { useSyncExternalStore } from "react";

interface KineticBackgroundProps {
  variant?: "hero" | "subtle" | "minimal";
  className?: string;
}

// Simple store to track if we're on the client
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function KineticBackground({ variant = "subtle", className = "" }: KineticBackgroundProps) {
  // Use useSyncExternalStore for hydration-safe client detection
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isClient) return null;

  // More prominent opacity values
  const opacity = variant === "hero" ? 0.25 : variant === "subtle" ? 0.15 : 0.08;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradient for central glow */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={opacity * 0.8} />
            <stop offset="50%" stopColor="#6366f1" stopOpacity={opacity * 0.3} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Central glow */}
        <circle cx="500" cy="500" r="400" fill="url(#centerGlow)" />

        {/* Orbiting Ring 1 - Outermost, slowest */}
        <g className="animate-orbit-slow origin-center" style={{ transformOrigin: "500px 500px" }}>
          <circle
            cx="500"
            cy="500"
            r="420"
            fill="none"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeOpacity={opacity * 0.6}
          />
          {/* Multiple orbital dots */}
          <circle cx="920" cy="500" r="8" fill="#6366f1" fillOpacity={opacity * 1.5} />
          <circle cx="80" cy="500" r="5" fill="#818cf8" fillOpacity={opacity} />
        </g>

        {/* Orbiting Ring 2 - Medium speed, dashed */}
        <g
          className="animate-orbit-medium origin-center"
          style={{ transformOrigin: "500px 500px" }}
        >
          <circle
            cx="500"
            cy="500"
            r="320"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeOpacity={opacity * 0.7}
            strokeDasharray="30 15"
          />
          <circle cx="820" cy="500" r="10" fill="#6366f1" fillOpacity={opacity * 1.8} />
          <circle cx="180" cy="500" r="6" fill="#818cf8" fillOpacity={opacity * 1.2} />
        </g>

        {/* Counter-orbiting Ring */}
        <g
          className="animate-orbit-reverse origin-center"
          style={{ transformOrigin: "500px 500px" }}
        >
          <circle
            cx="500"
            cy="500"
            r="220"
            fill="none"
            stroke="#818cf8"
            strokeWidth="1.5"
            strokeOpacity={opacity * 0.8}
          />
          <circle cx="280" cy="500" r="7" fill="#818cf8" fillOpacity={opacity * 1.5} />
          <circle cx="720" cy="500" r="4" fill="#6366f1" fillOpacity={opacity} />
        </g>

        {/* Inner fast orbit */}
        <g className="animate-orbit-fast origin-center" style={{ transformOrigin: "500px 500px" }}>
          <circle
            cx="500"
            cy="500"
            r="120"
            fill="none"
            stroke="#6366f1"
            strokeWidth="1"
            strokeOpacity={opacity * 0.5}
          />
          <circle cx="620" cy="500" r="5" fill="#6366f1" fillOpacity={opacity * 2} />
        </g>

        {/* Hexagonal points - pulsing */}
        {variant === "hero" && (
          <g>
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x = 500 + Math.cos(rad) * 360;
              const y = 500 + Math.sin(rad) * 360;
              return (
                <circle
                  key={`hex-${angle}`}
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#6366f1"
                  fillOpacity={opacity * 1.2}
                  className="animate-breathe"
                  style={{ animationDelay: `${(angle / 60) * 0.6}s` }}
                />
              );
            })}
            {/* Inner hexagon */}
            {[30, 90, 150, 210, 270, 330].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x = 500 + Math.cos(rad) * 250;
              const y = 500 + Math.sin(rad) * 250;
              return (
                <circle
                  key={`inner-hex-${angle}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#818cf8"
                  fillOpacity={opacity}
                  className="animate-breathe"
                  style={{ animationDelay: `${(angle / 60) * 0.4 + 0.2}s` }}
                />
              );
            })}
          </g>
        )}

        {/* Golden spiral curves */}
        {variant === "hero" && (
          <g className="animate-breathe" style={{ animationDelay: "1s" }}>
            <path
              d="M500,500 
                 C540,460 620,460 660,500 
                 C700,540 700,620 660,660 
                 C620,700 540,700 500,660 
                 C460,620 460,540 500,500"
              fill="none"
              stroke="#6366f1"
              strokeWidth="1.5"
              strokeOpacity={opacity * 0.8}
            />
            <path
              d="M500,500 
                 C520,480 560,480 580,500 
                 C600,520 600,560 580,580 
                 C560,600 520,600 500,580 
                 C480,560 480,520 500,500"
              fill="none"
              stroke="#818cf8"
              strokeWidth="1"
              strokeOpacity={opacity * 0.6}
            />
          </g>
        )}

        {/* Connecting lines radiating from center */}
        <g opacity={opacity * 0.4}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 500 + Math.cos(rad) * 60;
            const y1 = 500 + Math.sin(rad) * 60;
            const x2 = 500 + Math.cos(rad) * 450;
            const y2 = 500 + Math.sin(rad) * 450;
            return (
              <line
                key={`line-${angle}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#6366f1"
                strokeWidth="0.5"
                strokeDasharray="5 10"
              />
            );
          })}
        </g>

        {/* Corner geometric accents */}
        <g opacity={opacity * 0.6}>
          <circle cx="100" cy="100" r="40" fill="none" stroke="#6366f1" strokeWidth="1" />
          <circle cx="100" cy="100" r="25" fill="none" stroke="#818cf8" strokeWidth="0.5" />
          <circle cx="900" cy="100" r="40" fill="none" stroke="#6366f1" strokeWidth="1" />
          <circle cx="900" cy="100" r="25" fill="none" stroke="#818cf8" strokeWidth="0.5" />
          <circle cx="100" cy="900" r="40" fill="none" stroke="#6366f1" strokeWidth="1" />
          <circle cx="100" cy="900" r="25" fill="none" stroke="#818cf8" strokeWidth="0.5" />
          <circle cx="900" cy="900" r="40" fill="none" stroke="#6366f1" strokeWidth="1" />
          <circle cx="900" cy="900" r="25" fill="none" stroke="#818cf8" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
}
