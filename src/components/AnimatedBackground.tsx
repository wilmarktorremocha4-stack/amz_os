"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const blob1 = useRef<HTMLDivElement>(null);
  const blob2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    let targetX = 50;
    let targetY = 50;
    let currentX = 50;
    let currentY = 50;

    function onMouseMove(e: MouseEvent) {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
    }

    function animate() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      if (blob1.current) {
        blob1.current.style.transform = `translate(${(currentX - 50) * 0.6}px, ${(currentY - 50) * 0.6}px)`;
      }
      if (blob2.current) {
        blob2.current.style.transform = `translate(${(50 - currentX) * 0.4}px, ${(50 - currentY) * 0.4}px)`;
      }

      rafId = requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", onMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,#1a3a6e_0%,#0a1128_60%,#050a18_100%)]" />

      {/* moving blob 1 — blue */}
      <div
        ref={blob1}
        className="absolute left-1/3 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/25 blur-[120px] transition-none"
      />

      {/* moving blob 2 — indigo */}
      <div
        ref={blob2}
        className="absolute right-1/3 bottom-1/4 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-500/20 blur-[100px] transition-none"
      />

      {/* static accent — top right */}
      <div className="absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[80px]" />

      {/* grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
