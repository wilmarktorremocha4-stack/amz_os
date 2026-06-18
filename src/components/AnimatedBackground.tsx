"use client";

import { useEffect, useRef } from "react";

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

    let mx = W * 0.5, my = H * 0.45;
    let smx = mx, smy = my;

    // Trail points for the flowing wave
    const TRAIL = 80;
    const trail: { x: number; y: number }[] = Array.from({ length: TRAIL }, () => ({
      x: mx, y: my,
    }));

    // Blues only — no purple, no magenta
    const orbs = [
      { cx: 0.15, cy: 0.20, r: 0.55, color: [0, 90, 220],  spd: 0.000012, phase: 0   },
      { cx: 0.80, cy: 0.15, r: 0.50, color: [0, 180, 255], spd: 0.000015, phase: 1.8 },
      { cx: 0.50, cy: 0.80, r: 0.52, color: [0, 60, 180],  spd: 0.000010, phase: 3.1 },
      { cx: 0.88, cy: 0.60, r: 0.44, color: [0, 150, 230], spd: 0.000017, phase: 0.9 },
      { cx: 0.20, cy: 0.70, r: 0.42, color: [20, 120, 255],spd: 0.000013, phase: 4.2 },
    ];

    // Floating particles — blue shades only
    const PARTICLE_COUNT = 40;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -Math.random() * 0.22 - 0.04,
      alpha: Math.random() * 0.35 + 0.10,
      color: [[0,160,255],[0,120,220],[0,200,255]][Math.floor(Math.random() * 3)] as [number,number,number],
    }));

    let t = 0;
    let raf: number;

    function draw() {
      t += 1;

      // Very slow smooth cursor follow
      smx += (mx - smx) * 0.035;
      smy += (my - smy) * 0.035;

      // Shift trail and push new smoothed position
      trail.shift();
      trail.push({ x: smx, y: smy });

      // ── Base ─────────────────────────────────────────────
      ctx!.fillStyle = "#050c18";
      ctx!.fillRect(0, 0, W, H);

      // ── Subtle grid ──────────────────────────────────────
      ctx!.save();
      ctx!.strokeStyle = "rgba(0,80,180,0.055)";
      ctx!.lineWidth = 0.5;
      const GRID = 72;
      for (let x = 0; x < W; x += GRID) {
        ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, H); ctx!.stroke();
      }
      for (let y = 0; y < H; y += GRID) {
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(W, y); ctx!.stroke();
      }
      ctx!.restore();

      // ── Orbs ─────────────────────────────────────────────
      for (const orb of orbs) {
        const ox = Math.sin(t * orb.spd * 1000 + orb.phase) * W * 0.09
                 + Math.cos(t * orb.spd * 680  + orb.phase * 1.4) * W * 0.04;
        const oy = Math.cos(t * orb.spd * 880  + orb.phase) * H * 0.08
                 + Math.sin(t * orb.spd * 560  + orb.phase * 0.9) * H * 0.04;

        const px = orb.cx * W + ox;
        const py = orb.cy * H + oy;
        const r  = orb.r * Math.max(W, H);

        const g = ctx!.createRadialGradient(px, py, 0, px, py, r);
        const [R, G, B] = orb.color;
        g.addColorStop(0,    `rgba(${R},${G},${B},0.38)`);
        g.addColorStop(0.35, `rgba(${R},${G},${B},0.16)`);
        g.addColorStop(0.7,  `rgba(${R},${G},${B},0.05)`);
        g.addColorStop(1,    `rgba(${R},${G},${B},0)`);
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // ── Flowing wave trail (cursor) ───────────────────────
      // Draw multiple overlapping curved lines through the trail
      // for a soft abstract light-stream look
      for (let layer = 0; layer < 3; layer++) {
        const width  = [6, 3, 1.2][layer];
        const alphaM = [0.22, 0.14, 0.28][layer];
        const colorR = [0, 80, 180][layer];
        const colorG = [160, 200, 230][layer];
        const colorB = [255, 255, 255][layer];

        ctx!.save();
        ctx!.lineWidth = width;
        ctx!.lineCap = "round";
        ctx!.lineJoin = "round";

        ctx!.beginPath();
        ctx!.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < TRAIL - 1; i++) {
          const cx2 = (trail[i].x + trail[i + 1].x) / 2;
          const cy2 = (trail[i].y + trail[i + 1].y) / 2;
          ctx!.quadraticCurveTo(trail[i].x, trail[i].y, cx2, cy2);
        }

        // Gradient along the trail: fades from transparent at start to bright at tip
        const grad = ctx!.createLinearGradient(
          trail[0].x, trail[0].y,
          trail[TRAIL - 1].x, trail[TRAIL - 1].y
        );
        grad.addColorStop(0,    `rgba(${colorR},${colorG},${colorB},0)`);
        grad.addColorStop(0.55, `rgba(${colorR},${colorG},${colorB},${alphaM * 0.4})`);
        grad.addColorStop(1,    `rgba(${colorR},${colorG},${colorB},${alphaM})`);

        ctx!.strokeStyle = grad;
        ctx!.stroke();
        ctx!.restore();
      }

      // Small glow dot at cursor tip
      const tip = trail[TRAIL - 1];
      const tipG = ctx!.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 28);
      tipG.addColorStop(0,   "rgba(140,210,255,0.30)");
      tipG.addColorStop(0.5, "rgba(0,160,255,0.10)");
      tipG.addColorStop(1,   "rgba(0,0,0,0)");
      ctx!.fillStyle = tipG;
      ctx!.fillRect(0, 0, W, H);

      // ── Particles ────────────────────────────────────────
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4)  { p.y = H + 4; p.x = Math.random() * W; }
        if (p.x < -4)   p.x = W + 4;
        if (p.x > W + 4) p.x = -4;

        const [R,G,B] = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${R},${G},${B},${p.alpha})`;
        ctx!.fill();
      }

      // ── Scanlines ────────────────────────────────────────
      ctx!.fillStyle = "rgba(0,0,0,0.055)";
      for (let y = 0; y < H; y += 3) ctx!.fillRect(0, y, W, 1);

      // ── Bottom blackout (below 62% — hides orbs behind globe) ──
      const bo = ctx!.createLinearGradient(0, H * 0.52, 0, H);
      bo.addColorStop(0, "rgba(2,8,28,0)");
      bo.addColorStop(0.45, "rgba(2,8,28,0.92)");
      bo.addColorStop(1, "rgb(2,8,28)");
      ctx!.fillStyle = bo;
      ctx!.fillRect(0, H * 0.52, W, H * 0.48);

      // ── Vignette ─────────────────────────────────────────
      const vg = ctx!.createRadialGradient(W/2, H/2, H * 0.12, W/2, H/2, H * 0.92);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,4,18,0.78)");
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
