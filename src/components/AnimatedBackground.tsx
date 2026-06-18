"use client";

import { useEffect, useRef } from "react";

// Instantly.ai-style: neon blue, turquoise, deep blue liquid gradient that follows mouse
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // Mouse position (smoothly interpolated)
    let mx = W * 0.5, my = H * 0.5;
    let smx = mx, smy = my; // smoothed

    // Blobs: neon blue, turquoise, electric blue, deep indigo, cyan
    const blobs = [
      { bx: 0.2, by: 0.3, r: 0.65, color: [0, 120, 255],   speed: 0.00018, px: 0.12, py: 0.08 },
      { bx: 0.75, by: 0.2, r: 0.55, color: [0, 220, 240],  speed: 0.00022, px: -0.08, py: 0.14 },
      { bx: 0.5, by: 0.75, r: 0.60, color: [30, 60, 220],  speed: 0.00015, px: 0.10, py: -0.10 },
      { bx: 0.85, by: 0.6, r: 0.50, color: [0, 180, 255],  speed: 0.00028, px: -0.15, py: 0.06 },
      { bx: 0.15, by: 0.75, r: 0.45, color: [80, 0, 220],  speed: 0.00020, px: 0.06, py: -0.12 },
      { bx: 0.6, by: 0.1,  r: 0.40, color: [0, 255, 220],  speed: 0.00025, px: -0.10, py: 0.10 },
    ];

    let t = 0;
    let raf: number;

    function draw() {
      t += 1;

      // Smooth mouse lerp
      smx += (mx - smx) * 0.05;
      smy += (my - smy) * 0.05;

      // Deep dark base
      ctx!.fillStyle = "#03060f";
      ctx!.fillRect(0, 0, W, H);

      ctx!.globalCompositeOperation = "screen";

      for (const blob of blobs) {
        // Organic drift: two sine waves at different frequencies
        const ox = Math.sin(t * blob.speed * 1000 + blob.px * 10) * W * 0.13
                 + Math.cos(t * blob.speed * 700 + blob.py * 7) * W * 0.06;
        const oy = Math.cos(t * blob.speed * 900 + blob.py * 10) * H * 0.11
                 + Math.sin(t * blob.speed * 600 + blob.px * 5) * H * 0.07;

        // Cursor attraction (each blob has different sensitivity)
        const cx = (smx - W * 0.5) * blob.px;
        const cy = (smy - H * 0.5) * blob.py;

        const bx = blob.bx * W + ox + cx;
        const by = blob.by * H + oy + cy;
        const r = blob.r * Math.min(W, H);

        const g = ctx!.createRadialGradient(bx, by, 0, bx, by, r);
        const [R, G, B] = blob.color;
        g.addColorStop(0,   `rgba(${R},${G},${B},0.50)`);
        g.addColorStop(0.35,`rgba(${R},${G},${B},0.22)`);
        g.addColorStop(0.7, `rgba(${R},${G},${B},0.07)`);
        g.addColorStop(1,   `rgba(${R},${G},${B},0)`);
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      ctx!.globalCompositeOperation = "source-over";

      // Cursor glow — neon cyan ring
      const cg = ctx!.createRadialGradient(smx, smy, 0, smx, smy, 160);
      cg.addColorStop(0,    "rgba(0,220,255,0.22)");
      cg.addColorStop(0.4,  "rgba(0,140,255,0.10)");
      cg.addColorStop(1,    "rgba(0,0,0,0)");
      ctx!.fillStyle = cg;
      ctx!.fillRect(0, 0, W, H);

      // Edge vignette
      const vg = ctx!.createRadialGradient(W/2, H/2, H * 0.25, W/2, H/2, H * 0.9);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx!.fillStyle = vg;
      ctx!.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(draw);
    }

    function onMove(e: MouseEvent) { mx = e.clientX; my = e.clientY; }
    function onTouch(e: TouchEvent) {
      if (e.touches[0]) { mx = e.touches[0].clientX; my = e.touches[0].clientY; }
    }
    function onResize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas!.width = W; canvas!.height = H;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
}
