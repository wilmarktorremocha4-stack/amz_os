"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const blob1 = useRef<HTMLDivElement>(null);
  const blob2 = useRef<HTMLDivElement>(null);
  const blob3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let currentX = 0.5;
    let currentY = 0.5;
    let hasMouseMoved = false;
    let t = 0;

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
      hasMouseMoved = true;
    }

    function animate() {
      t += 0.005;

      // Idle drift — slow sine wave orbits
      if (!hasMouseMoved) {
        mouseX = 0.5 + Math.sin(t * 0.7) * 0.3;
        mouseY = 0.5 + Math.cos(t * 0.5) * 0.25;
      }

      // Smooth follow
      currentX += (mouseX - currentX) * 0.04;
      currentY += (mouseY - currentY) * 0.04;

      const dx = (currentX - 0.5) * 300;
      const dy = (currentY - 0.5) * 300;

      if (blob1.current) {
        blob1.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }
      if (blob2.current) {
        // second blob drifts opposite + own idle sine
        const idleX2 = Math.sin(t * 0.9 + 2) * 120;
        const idleY2 = Math.cos(t * 0.6 + 1) * 100;
        blob2.current.style.transform = `translate(calc(-50% + ${-dx * 0.6 + idleX2}px), calc(-50% + ${-dy * 0.6 + idleY2}px))`;
      }
      if (blob3.current) {
        const idleX3 = Math.cos(t * 0.4 + 3) * 80;
        const idleY3 = Math.sin(t * 0.8 + 2) * 90;
        blob3.current.style.transform = `translate(calc(-50% + ${dx * 0.3 + idleX3}px), calc(-50% + ${dy * 0.3 + idleY3}px))`;
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
      {/* base dark navy */}
      <div className="absolute inset-0 bg-[#040d1e]" />

      {/* blob 1 — bright blue, follows mouse */}
      <div
        ref={blob1}
        className="absolute left-1/2 top-1/2 h-[700px] w-[700px] rounded-full bg-blue-500/30 blur-[130px]"
      />

      {/* blob 2 — indigo, counter-drift */}
      <div
        ref={blob2}
        className="absolute left-1/2 top-1/2 h-[500px] w-[500px] rounded-full bg-indigo-600/25 blur-[110px]"
      />

      {/* blob 3 — cyan accent */}
      <div
        ref={blob3}
        className="absolute left-1/2 top-1/2 h-[350px] w-[350px] rounded-full bg-cyan-500/15 blur-[90px]"
      />

      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(100,160,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(100,160,255,0.8) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#040d1e_100%)]" />
    </div>
  );
}
