"use client";

import { useEffect, useRef } from "react";

// Dark background with slow drifting color pools + a soft spotlight that follows the cursor
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

    // Mouse — smoothed so the spotlight glides, not snaps
    let mx = W * 0.5, my = H * 0.4;
    let smx = mx, smy = my;

    // Three slow ambient pools — they drift on very long sine cycles
    const pools = [
      { cx: 0.15, cy: 0.25, r: 0.55, color: [20, 80, 255],  t0: 0    },
      { cx: 0.80, cy: 0.65, r: 0.50, color: [0,  180, 230],  t0: 2000 },
      { cx: 0.50, cy: 0.85, r: 0.45, color: [60, 20,  200],  t0: 4000 },
    ];

    let t = 0;
    let raf: number;

    function draw() {
      t += 1;

      // Very smooth cursor follow — lerp factor 0.03 = slow glide
      smx += (mx - smx) * 0.03;
      smy += (my - smy) * 0.03;

      // Deep dark navy base
      ctx!.fillStyle = "#04060f";
      ctx!.fillRect(0, 0, W, H);

      // Ambient pools — slow, large, very transparent
      for (const p of pools) {
        // Each pool drifts ~6% of screen over a ~40-second cycle
        const ox = Math.sin((t + p.t0) * 0.0004) * W * 0.06;
        const oy = Math.cos((t + p.t0) * 0.0003) * H * 0.06;
        const px = p.cx * W + ox;
        const py = p.cy * H + oy;
        const r  = p.r * Math.max(W, H);

        const g = ctx!.createRadialGradient(px, py, 0, px, py, r);
        const [R, G, B] = p.color;
        g.addColorStop(0,   `rgba(${R},${G},${B},0.18)`);
        g.addColorStop(0.5, `rgba(${R},${G},${B},0.07)`);
        g.addColorStop(1,   `rgba(${R},${G},${B},0)`);
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // Cursor spotlight — soft white-blue cone, like a torch on the wall
      const sr = Math.min(W, H) * 0.45;
      const sg = ctx!.createRadialGradient(smx, smy, 0, smx, smy, sr);
      sg.addColorStop(0,    "rgba(160,200,255,0.13)");
      sg.addColorStop(0.35, "rgba(80,140,255,0.07)");
      sg.addColorStop(1,    "rgba(0,0,0,0)");
      ctx!.fillStyle = sg;
      ctx!.fillRect(0, 0, W, H);

      // Small tight glow at cursor centre
      const cg = ctx!.createRadialGradient(smx, smy, 0, smx, smy, 80);
      cg.addColorStop(0,   "rgba(120,180,255,0.18)");
      cg.addColorStop(1,   "rgba(0,0,0,0)");
      ctx!.fillStyle = cg;
      ctx!.fillRect(0, 0, W, H);

      // Edge vignette — pulls focus to centre
      const vg = ctx!.createRadialGradient(W/2, H/2, H * 0.2, W/2, H/2, H * 1.0);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,8,0.75)");
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
