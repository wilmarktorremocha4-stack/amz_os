"use client";

import { useEffect, useRef } from "react";

// Instantly.ai-inspired: dark bg + large soft color blobs that drift + follow cursor
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

    let mx = W * 0.5, my = H * 0.5;
    let tx = mx, ty = my;

    const blobs = [
      { x: W * 0.15, y: H * 0.2, r: 550, color: [88, 28, 220], speed: 0.00025, ox: 0, oy: 0 },
      { x: W * 0.75, y: H * 0.15, r: 480, color: [30, 80, 220], speed: 0.0003, ox: 1, oy: 0.5 },
      { x: W * 0.5, y: H * 0.7, r: 520, color: [120, 30, 180], speed: 0.0002, ox: -0.5, oy: 1 },
      { x: W * 0.85, y: H * 0.65, r: 420, color: [15, 120, 200], speed: 0.00035, ox: 1, oy: -0.5 },
      { x: W * 0.3, y: H * 0.8, r: 400, color: [60, 20, 150], speed: 0.00028, ox: -1, oy: 0.3 },
    ];

    let t = 0;
    let rafId: number;

    function draw() {
      t += 1;

      // Smooth mouse follow
      tx += (mx - tx) * 0.04;
      ty += (my - ty) * 0.04;

      // Fill black
      ctx!.fillStyle = "#050508";
      ctx!.fillRect(0, 0, W, H);

      // Draw blobs
      for (const blob of blobs) {
        const bx = blob.x + Math.sin(t * blob.speed * 1000 + blob.ox) * W * 0.12
          + (tx - W / 2) * 0.04 * (blob.ox + 1);
        const by = blob.y + Math.cos(t * blob.speed * 800 + blob.oy) * H * 0.1
          + (ty - H / 2) * 0.04 * (blob.oy + 1);

        const grad = ctx!.createRadialGradient(bx, by, 0, bx, by, blob.r);
        const [r, g, b] = blob.color;
        grad.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},0.25)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, W, H);
      }

      // Cursor glow
      const cgr = ctx!.createRadialGradient(tx, ty, 0, tx, ty, 120);
      cgr.addColorStop(0, "rgba(130,80,255,0.18)");
      cgr.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = cgr;
      ctx!.fillRect(0, 0, W, H);

      // Subtle vignette
      const vgr = ctx!.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.85);
      vgr.addColorStop(0, "rgba(0,0,0,0)");
      vgr.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx!.fillStyle = vgr;
      ctx!.fillRect(0, 0, W, H);

      rafId = requestAnimationFrame(draw);
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
    rafId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
}
