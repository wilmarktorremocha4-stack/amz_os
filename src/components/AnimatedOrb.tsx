"use client";

import { useState, useEffect } from "react";

export type OrbState = "idle" | "thinking" | "responding" | "done";

interface Props {
  state: OrbState;
  size?: number;
  className?: string;
}

export default function AnimatedOrb({ state, size = 36, className = "" }: Props) {
  const [mounted, setMounted] = useState(state !== "done");
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (state === "done") {
      setFading(true);
      const t = setTimeout(() => { setMounted(false); setFading(false); }, 380);
      return () => clearTimeout(t);
    } else {
      setMounted(true);
      setFading(false);
    }
  }, [state]);

  const orbClass = state === "idle" ? "chart-orb--idle" : "chart-orb--active";
  const blobBlur = Math.max(2, Math.round(size * 0.106));

  return (
    <div
      className={`chart-orb-outer relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size, opacity: fading ? 0 : 1, transition: "opacity 0.35s ease" }}
      aria-hidden
    >
      {mounted && (
        <div className={`chart-orb ${orbClass}`}>
          <div className="chart-halo" />
          <div className="chart-orb-body">
            <div className="chart-blob chart-blob-1" style={{ filter: `blur(${blobBlur}px)` }} />
            <div className="chart-blob chart-blob-2" style={{ filter: `blur(${blobBlur}px)` }} />
          </div>
          <svg className="chart-svg" viewBox="0 0 170 170" width="100%" height="100%"
            style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id="cobarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#fbfcff" />
                <stop offset="45%"  stopColor="#c7cfdc" />
                <stop offset="100%" stopColor="#8e98ab" />
              </linearGradient>
            </defs>
            <g transform="translate(23.8, 39.1) scale(0.85)">
              <rect className="chart-bar chart-bar-1" x="26" y="48" width="25" height="37" rx="5" fill="url(#cobarGrad)" />
              <rect className="chart-bar chart-bar-2" x="57" y="26" width="25" height="59" rx="5" fill="url(#cobarGrad)" />
              <rect className="chart-bar chart-bar-3" x="88" y="4"  width="25" height="81" rx="5" fill="url(#cobarGrad)" />
              <path className="chart-curve" d="M8,71 C40,97 75,100 109,83 C117,77 127,69 136,62"
                stroke="#f5f8ff" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="300" />
              <path className="chart-arrow" d="M-9,-11 L15,0 L-9,11 Z"
                transform="translate(136,62) rotate(-38)" fill="#f5f8ff" />
            </g>
          </svg>
          <div className="chart-rim" />
          <div className="chart-arc" />
        </div>
      )}
    </div>
  );
}
