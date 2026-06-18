"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#ff2d78", "#00f5ff", "#a855f7", "#22ff88", "#ff8c00"];
const TUBE_COUNT = 5;
const TRAIL_LENGTH = 28;
const BASE_SPEED = 0.055;

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

    let pointerX = W / 2;
    let pointerY = H / 2;
    let hasPointer = false;
    let t = 0;

    // Build tubes — each has a trail of points + individual speed + color
    const tubes = COLORS.slice(0, TUBE_COUNT).map((color, i) => ({
      color,
      speed: BASE_SPEED + i * 0.012,
      phaseX: (i / TUBE_COUNT) * Math.PI * 2,
      phaseY: (i / TUBE_COUNT) * Math.PI * 2 + 1.1,
      points: Array.from({ length: TRAIL_LENGTH }, () => ({
        x: W / 2 + (Math.random() - 0.5) * 300,
        y: H / 2 + (Math.random() - 0.5) * 200,
      })),
    }));

    function onMouseMove(e: MouseEvent) {
      pointerX = e.clientX;
      pointerY = e.clientY;
      hasPointer = true;
    }

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;
      pointerX = touch.clientX;
      pointerY = touch.clientY;
      hasPointer = true;
    }

    function onResize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W;
      canvas!.height = H;
    }

    function drawTube(
      pts: { x: number; y: number }[],
      color: string,
    ) {
      if (pts.length < 3) return;

      // Outer glow pass
      ctx!.beginPath();
      ctx!.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx!.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx!.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx!.shadowColor = color;
      ctx!.shadowBlur = 22;
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 5;
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      ctx!.globalAlpha = 0.75;
      ctx!.stroke();

      // Bright white core
      ctx!.beginPath();
      ctx!.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx!.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx!.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx!.shadowBlur = 6;
      ctx!.strokeStyle = "#ffffff";
      ctx!.lineWidth = 1.8;
      ctx!.globalAlpha = 0.55;
      ctx!.stroke();

      ctx!.globalAlpha = 1;
      ctx!.shadowBlur = 0;
    }

    let rafId: number;

    function tick() {
      t += 0.004;

      // Fade trail — slight transparency so old frames ghost away
      ctx!.fillStyle = "rgba(4, 4, 18, 0.22)";
      ctx!.fillRect(0, 0, W, H);

      tubes.forEach((tube) => {
        // Idle orbit when no pointer (or mobile auto-animate)
        const idleRadius = Math.min(W, H) * 0.28;
        const idleX = !hasPointer
          ? W / 2 + Math.cos(t * 0.45 + tube.phaseX) * idleRadius
          : pointerX + Math.sin(t * 0.6 + tube.phaseX) * 60;
        const idleY = !hasPointer
          ? H / 2 + Math.sin(t * 0.35 + tube.phaseY) * idleRadius * 0.65
          : pointerY + Math.cos(t * 0.5 + tube.phaseY) * 45;

        // Head chases target
        tube.points[0].x += (idleX - tube.points[0].x) * tube.speed;
        tube.points[0].y += (idleY - tube.points[0].y) * tube.speed;

        // Each point follows the one ahead with slight damping
        for (let i = 1; i < tube.points.length; i++) {
          tube.points[i].x +=
            (tube.points[i - 1].x - tube.points[i].x) * (tube.speed * 0.65);
          tube.points[i].y +=
            (tube.points[i - 1].y - tube.points[i].y) * (tube.speed * 0.65);
        }

        drawTube(tube.points, tube.color);
      });

      rafId = requestAnimationFrame(tick);
    }

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
      style={{ background: "#04040e" }}
    />
  );
}
