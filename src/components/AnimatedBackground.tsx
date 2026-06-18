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

    let mx = W * 0.5, my = H * 0.4;
    let smx = mx, smy = my;
    let pmx = mx, pmy = my; // previous mouse for velocity
    let velX = 0, velY = 0;

    // Orbs — vivid, slow, large
    const orbs = [
      { cx: 0.18, cy: 0.22, r: 0.52, color: [0, 100, 255],   spd: 0.00012, phase: 0    },
      { cx: 0.78, cy: 0.18, r: 0.46, color: [0, 220, 255],   spd: 0.00015, phase: 1.2  },
      { cx: 0.55, cy: 0.78, r: 0.50, color: [100, 0, 255],   spd: 0.00010, phase: 2.5  },
      { cx: 0.88, cy: 0.58, r: 0.42, color: [0, 160, 230],   spd: 0.00018, phase: 0.7  },
      { cx: 0.22, cy: 0.72, r: 0.40, color: [180, 0, 255],   spd: 0.00014, phase: 3.8  },
    ];

    // Particles
    const PARTICLE_COUNT = 55;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -Math.random() * 0.3 - 0.05,
      alpha: Math.random() * 0.5 + 0.15,
      color: [[0,180,255],[120,80,255],[0,220,200]][Math.floor(Math.random()*3)],
    }));

    let t = 0;
    let raf: number;

    function draw() {
      t += 1;

      // Mouse velocity for extra ripple
      velX += (mx - pmx) * 0.08;
      velY += (my - pmy) * 0.08;
      velX *= 0.88;
      velY *= 0.88;
      pmx = smx; pmy = smy;

      smx += (mx - smx) * 0.04;
      smy += (my - smy) * 0.04;

      // ── Base ──────────────────────────────────────────────
      ctx!.fillStyle = "#060a14";
      ctx!.fillRect(0, 0, W, H);

      // ── Subtle grid ───────────────────────────────────────
      const GRID = 70;
      ctx!.save();
      ctx!.strokeStyle = "rgba(40,100,200,0.07)";
      ctx!.lineWidth = 0.5;
      for (let x = 0; x < W; x += GRID) {
        ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, H); ctx!.stroke();
      }
      for (let y = 0; y < H; y += GRID) {
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(W, y); ctx!.stroke();
      }
      ctx!.restore();

      // ── Orbs ──────────────────────────────────────────────
      for (const orb of orbs) {
        const ox = Math.sin(t * orb.spd * 1000 + orb.phase) * W * 0.10
                 + Math.cos(t * orb.spd * 700  + orb.phase * 1.3) * W * 0.05;
        const oy = Math.cos(t * orb.spd * 900  + orb.phase) * H * 0.09
                 + Math.sin(t * orb.spd * 600  + orb.phase * 0.8) * H * 0.05;

        // Cursor pulls orbs slightly
        const dx = smx - orb.cx * W;
        const dy = smy - orb.cy * H;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const pull = Math.max(0, 1 - dist / (W * 0.7)) * 0.06;

        const px = orb.cx * W + ox + dx * pull;
        const py = orb.cy * H + oy + dy * pull;
        const r  = orb.r * Math.max(W, H);

        const g = ctx!.createRadialGradient(px, py, 0, px, py, r);
        const [R, G, B] = orb.color;
        g.addColorStop(0,    `rgba(${R},${G},${B},0.42)`);
        g.addColorStop(0.3,  `rgba(${R},${G},${B},0.20)`);
        g.addColorStop(0.65, `rgba(${R},${G},${B},0.06)`);
        g.addColorStop(1,    `rgba(${R},${G},${B},0)`);
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // ── Cursor spotlight ──────────────────────────────────
      // Outer wide glow
      const sg = ctx!.createRadialGradient(smx, smy, 0, smx, smy, Math.min(W,H) * 0.38);
      sg.addColorStop(0,    "rgba(80,160,255,0.14)");
      sg.addColorStop(0.4,  "rgba(40,100,255,0.06)");
      sg.addColorStop(1,    "rgba(0,0,0,0)");
      ctx!.fillStyle = sg;
      ctx!.fillRect(0, 0, W, H);

      // Inner bright core
      const cg = ctx!.createRadialGradient(smx, smy, 0, smx, smy, 90);
      cg.addColorStop(0,   "rgba(160,210,255,0.28)");
      cg.addColorStop(0.5, "rgba(80,160,255,0.10)");
      cg.addColorStop(1,   "rgba(0,0,0,0)");
      ctx!.fillStyle = cg;
      ctx!.fillRect(0, 0, W, H);

      // Velocity streak — moves toward where the cursor is going
      if (Math.abs(velX) + Math.abs(velY) > 0.5) {
        const ex = smx + velX * 18;
        const ey = smy + velY * 18;
        const streak = ctx!.createLinearGradient(smx, smy, ex, ey);
        streak.addColorStop(0,   "rgba(100,200,255,0.18)");
        streak.addColorStop(1,   "rgba(100,200,255,0)");
        ctx!.save();
        ctx!.filter = "blur(8px)";
        ctx!.strokeStyle = streak;
        ctx!.lineWidth = 22;
        ctx!.lineCap = "round";
        ctx!.beginPath();
        ctx!.moveTo(smx, smy);
        ctx!.lineTo(ex, ey);
        ctx!.stroke();
        ctx!.restore();
      }

      // ── Particles ─────────────────────────────────────────
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
        if (p.x < -4) p.x = W + 4;
        if (p.x > W + 4) p.x = -4;

        const [R,G,B] = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${R},${G},${B},${p.alpha})`;
        ctx!.fill();
      }

      // ── Scanlines ─────────────────────────────────────────
      ctx!.fillStyle = "rgba(0,0,0,0.06)";
      for (let y = 0; y < H; y += 3) {
        ctx!.fillRect(0, y, W, 1);
      }

      // ── Vignette ──────────────────────────────────────────
      const vg = ctx!.createRadialGradient(W/2, H/2, H * 0.15, W/2, H/2, H * 0.95);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,15,0.72)");
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
