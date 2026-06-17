"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    let targetX = 60;
    let targetY = 40;
    let currentX = 60;
    let currentY = 40;
    let t = 0;

    function onMouseMove(e: MouseEvent) {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
    }

    function tick() {
      t += 0.003;
      const idleX = targetX + Math.sin(t) * 8;
      const idleY = targetY + Math.cos(t * 0.7) * 6;

      currentX += (idleX - currentX) * 0.03;
      currentY += (idleY - currentY) * 0.03;

      if (bgRef.current) {
        bgRef.current.style.background = `radial-gradient(ellipse 90% 90% at ${currentX}% ${currentY}%, #1d4ed8 0%, #1e3a8a 25%, #0f172a 60%, #060c1a 100%)`;
      }

      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMouseMove);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div
        ref={bgRef}
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 90% 90% at 60% 40%, #1d4ed8 0%, #1e3a8a 25%, #0f172a 60%, #060c1a 100%)",
        }}
      />
      <div
        className="fixed inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
    </>
  );
}
