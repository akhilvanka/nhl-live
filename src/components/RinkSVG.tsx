"use client";

import { useRef, useEffect, useState } from "react";

interface RinkSVGProps {
  puckX?: number;
  puckY?: number;
}

export default function RinkSVG({ puckX, puckY }: RinkSVGProps) {
  const svgX = puckX !== undefined ? ((puckX + 100) / 200) * 400 : undefined;
  const svgY = puckY !== undefined ? ((puckY + 42.5) / 85) * 170 : undefined;

  // Smooth puck trail: store previous positions for a fading trail
  const prevRef = useRef<{ x: number; y: number } | null>(null);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (svgX !== undefined && svgY !== undefined) {
      const prev = prevRef.current;
      if (prev && (prev.x !== svgX || prev.y !== svgY)) {
        setTrail(t => [...t.slice(-4), { x: prev.x, y: prev.y }]);
      }
      prevRef.current = { x: svgX, y: svgY };
    }
  }, [svgX, svgY]);

  return (
    <svg viewBox="0 0 400 170" className="w-full rounded-lg" style={{ background: "#111" }}>
      {/* Rink outline */}
      <rect x="10" y="5" width="380" height="160" rx="60" ry="60" fill="#141414" stroke="#2a2a2a" strokeWidth="1.5" />

      {/* Center line */}
      <line x1="200" y1="5" x2="200" y2="165" stroke="#333" strokeWidth="1.5" />

      {/* Blue lines */}
      <line x1="135" y1="5" x2="135" y2="165" stroke="#2a2a2a" strokeWidth="1.5" />
      <line x1="265" y1="5" x2="265" y2="165" stroke="#2a2a2a" strokeWidth="1.5" />

      {/* Goal lines */}
      <line x1="45" y1="30" x2="45" y2="140" stroke="#333" strokeWidth="1" />
      <line x1="355" y1="30" x2="355" y2="140" stroke="#333" strokeWidth="1" />

      {/* Center circle */}
      <circle cx="200" cy="85" r="25" fill="none" stroke="#2a2a2a" strokeWidth="1" />
      <circle cx="200" cy="85" r="2" fill="#333" />

      {/* Faceoff circles */}
      <circle cx="100" cy="55" r="18" fill="none" stroke="#222" strokeWidth="0.75" />
      <circle cx="100" cy="55" r="2" fill="#333" />
      <circle cx="100" cy="115" r="18" fill="none" stroke="#222" strokeWidth="0.75" />
      <circle cx="100" cy="115" r="2" fill="#333" />
      <circle cx="300" cy="55" r="18" fill="none" stroke="#222" strokeWidth="0.75" />
      <circle cx="300" cy="55" r="2" fill="#333" />
      <circle cx="300" cy="115" r="18" fill="none" stroke="#222" strokeWidth="0.75" />
      <circle cx="300" cy="115" r="2" fill="#333" />

      {/* Neutral zone dots */}
      <circle cx="155" cy="55" r="2" fill="#333" />
      <circle cx="155" cy="115" r="2" fill="#333" />
      <circle cx="245" cy="55" r="2" fill="#333" />
      <circle cx="245" cy="115" r="2" fill="#333" />

      {/* Creases */}
      <path d="M 35 75 A 10 10 0 0 1 35 95" fill="rgba(255,255,255,0.03)" stroke="#2a2a2a" strokeWidth="0.75" />
      <path d="M 365 75 A 10 10 0 0 0 365 95" fill="rgba(255,255,255,0.03)" stroke="#2a2a2a" strokeWidth="0.75" />

      {/* Goal nets */}
      <rect x="25" y="79" width="10" height="12" rx="2" fill="none" stroke="#2a2a2a" strokeWidth="0.75" />
      <rect x="365" y="79" width="10" height="12" rx="2" fill="none" stroke="#2a2a2a" strokeWidth="0.75" />

      {/* Puck trail (fading previous positions) */}
      {trail.map((t, i) => (
        <circle key={i} cx={t.x} cy={t.y} r={2} fill="#fff" opacity={0.08 + (i / trail.length) * 0.12} />
      ))}

      {/* Puck with smooth CSS transition */}
      {svgX !== undefined && svgY !== undefined && (
        <circle
          cx={svgX}
          cy={svgY}
          r="5"
          fill="#fff"
          stroke="#555"
          strokeWidth="1"
          className="rink-dot"
          style={{ transition: "cx 0.8s ease-out, cy 0.8s ease-out" }}
        />
      )}
    </svg>
  );
}
