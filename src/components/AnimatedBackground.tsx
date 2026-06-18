"use client";

import { useEffect, useRef } from "react";

// Blue-dominant palette with purple/cyan complements
const TUBES = [
  { color: "#60a5fa", glow: "#3b82f6", width: 5 },
  { color: "#a78bfa", glow: "#7c3aed", width: 4 },
  { color: "#38bdf8", glow: "#0891b2", width: 4.5 },
  { color: "#818cf8", glow: "#4f46e5", width: 3.5 },
  { color: "#c4b5fd", glow: "#8b5cf6", width: 3 },
];

const TRAIL = 50;
const SPEED = 0.038;

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

    let px = W / 2;
    let py = H / 2;
    let hasPointer = false;
    let t = 0;

    // Gradient anchor — slowly drifts
    let gx = 0.4;
    let gy = 0.35;
    let gxTarget = 0.4;
    let gyTarget = 0.35;

    type Pt = { x: number; y: number; vx: number; vy: number };
    const tubes = TUBES.map((cfg, i) => ({
      ...cfg,
      speed: SPEED + i * 0.008,
      phaseX: (i / TUBES.length) * Math.PI * 2,
      phaseY: (i / TUBES.length) * Math.PI * 2 + 0.9,
      points: Array.from<Pt>({ length: TRAIL }).fill(null as unknown as Pt).map(() => ({
        x: W / 2 + (Math.random() - 0.5) * 400,
        y: H / 2 + (Math.random() - 0.5) * 300,
        vx: 0,
        vy: 0,
      })),
    }));

    function onMouseMove(e: MouseEvent) {
      px = e.clientX; py = e.clientY;
      gxTarget = e.clientX / W;
      gyTarget = e.clientY / H;
      hasPointer = true;
    }
    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;
      px = touch.clientX; py = touch.clientY;
      gxTarget = touch.clientX / W;
      gyTarget = touch.clientY / H;
      hasPointer = true;
    }
    function onResize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas!.width = W; canvas!.height = H;
    }

    function drawBackground() {
      // Deep dark base
      ctx!.fillStyle = "#03050f";
      ctx!.fillRect(0, 0, W, H);

      // Slow-moving radial gradient nebula
      const r = Math.max(W, H) * 0.85;
      const grad = ctx!.createRadialGradient(
        gx * W, gy * H, 0,
        gx * W, gy * H, r
      );
      grad.addColorStop(0, "rgba(29, 78, 216, 0.25)");
      grad.addColorStop(0.4, "rgba(109, 40, 217, 0.12)");
      grad.addColorStop(0.7, "rgba(8, 145, 178, 0.08)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);

      // Second subtle accent
      const r2 = Math.max(W, H) * 0.6;
      const grad2 = ctx!.createRadialGradient(
        (1 - gx) * W, (1 - gy) * H, 0,
        (1 - gx) * W, (1 - gy) * H, r2
      );
      grad2.addColorStop(0, "rgba(79, 70, 229, 0.15)");
      grad2.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = grad2;
      ctx!.fillRect(0, 0, W, H);
    }

    function drawTube(tube: typeof tubes[0]) {
      const pts = tube.points;
      if (pts.length < 4) return;

      const buildPath = () => {
        ctx!.beginPath();
        ctx!.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2;
          const my = (pts[i].y + pts[i + 1].y) / 2;
          ctx!.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx!.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      };

      // Outer diffuse glow (widest, most transparent)
      buildPath();
      ctx!.shadowColor = tube.glow;
      ctx!.shadowBlur = 40;
      ctx!.strokeStyle = tube.glow + "55";
      ctx!.lineWidth = tube.width * 3.5;
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      ctx!.globalAlpha = 0.35;
      ctx!.stroke();

      // Mid glow
      buildPath();
      ctx!.shadowBlur = 20;
      ctx!.strokeStyle = tube.color + "99";
      ctx!.lineWidth = tube.width * 1.8;
      ctx!.globalAlpha = 0.6;
      ctx!.stroke();

      // Bright core
      buildPath();
      ctx!.shadowBlur = 8;
      ctx!.strokeStyle = tube.color;
      ctx!.lineWidth = tube.width * 0.5;
      ctx!.globalAlpha = 0.9;
      ctx!.stroke();

      // Specular white highlight
      buildPath();
      ctx!.shadowBlur = 3;
      ctx!.strokeStyle = "#ffffff";
      ctx!.lineWidth = tube.width * 0.18;
      ctx!.globalAlpha = 0.4;
      ctx!.stroke();

      ctx!.globalAlpha = 1;
      ctx!.shadowBlur = 0;
    }

    let rafId: number;

    function tick() {
      t += 0.0035;

      // Drift gradient anchor
      gx += (gxTarget + Math.sin(t * 0.3) * 0.12 - gx) * 0.008;
      gy += (gyTarget + Math.cos(t * 0.25) * 0.1 - gy) * 0.008;

      // Fade trails (slower fade = longer ghost)
      ctx!.globalCompositeOperation = "source-over";
      ctx!.fillStyle = "rgba(3, 5, 15, 0.14)";
      ctx!.fillRect(0, 0, W, H);

      // Redraw gradient subtly each frame
      drawBackground();

      tubes.forEach((tube, ti) => {
        const orbit = Math.min(W, H) * 0.3;
        const targetX = !hasPointer
          ? W / 2 + Math.cos(t * 0.4 + tube.phaseX) * orbit
          : px + Math.sin(t * 0.55 + tube.phaseX) * 70;
        const targetY = !hasPointer
          ? H / 2 + Math.sin(t * 0.32 + tube.phaseY) * orbit * 0.6
          : py + Math.cos(t * 0.48 + tube.phaseY) * 55;

        // Head with slight turbulence for organic feel
        const head = tube.points[0];
        const turb = 1.5;
        head.vx = (head.vx + (targetX - head.x) * tube.speed + (Math.random() - 0.5) * turb) * 0.88;
        head.vy = (head.vy + (targetY - head.y) * tube.speed + (Math.random() - 0.5) * turb) * 0.88;
        head.x += head.vx;
        head.y += head.vy;

        // Trail follows with damping
        for (let i = 1; i < tube.points.length; i++) {
          const prev = tube.points[i - 1];
          const curr = tube.points[i];
          const lag = tube.speed * 0.6;
          curr.vx = (curr.vx + (prev.x - curr.x) * lag) * 0.82;
          curr.vy = (curr.vy + (prev.y - curr.y) * lag) * 0.82;
          curr.x += curr.vx;
          curr.y += curr.vy;
        }

        drawTube(tube);
      });

      rafId = requestAnimationFrame(tick);
    }

    // Initial background fill
    drawBackground();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("resize", onResize);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: "#03050f" }}
    />
  );
}
