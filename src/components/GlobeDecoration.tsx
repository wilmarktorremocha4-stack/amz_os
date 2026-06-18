export function GlobeDecoration() {
  return (
    <div
      className="pointer-events-none fixed bottom-0 left-1/2"
      style={{
        // Push down so only the top arc (~90px) peeks above the bottom of the screen
        transform: "translateX(-50%) translateY(calc(100% - 90px))",
        // Wider than the viewport so the arc stretches edge to edge
        width: "120vw",
        height: "120vw",
      }}
    >
      {/* The sphere — dark interior, glow only at the very top rim */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          // Almost entirely dark — only a tiny highlight strip at the top for the horizon
          background:
            "radial-gradient(ellipse 80% 12% at 50% 1%, rgba(0,160,255,0.18) 0%, rgba(0,80,180,0.06) 60%, transparent 100%), " +
            "radial-gradient(circle at 50% 50%, #02060e 55%, #010407 100%)",
          // Glowing top rim only
          boxShadow:
            "0 -3px 40px 8px rgba(0,140,255,0.28), " +
            "0 -1px 80px 20px rgba(0,90,200,0.14)",
          // Hard border at top only via outline trick — use border with transparent bottom
          border: "1px solid rgba(0,150,255,0.22)",
        }}
      >
        {/* Bright horizon arc line */}
        <div
          style={{
            position: "absolute",
            top: "3px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "92%",
            height: "2px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(120,210,255,0.90) 0%, rgba(0,160,255,0.50) 45%, transparent 75%)",
            filter: "blur(1.5px)",
          }}
        />
        {/* Very soft glow just above horizon, fades quickly */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "98%",
            height: "18px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(0,170,255,0.22) 0%, rgba(0,100,220,0.08) 50%, transparent 80%)",
            filter: "blur(6px)",
          }}
        />
      </div>

      {/* Solid black fill covering the lower half — kills any canvas bleed */}
      <div
        style={{
          position: "absolute",
          left: "-10%",
          right: "-10%",
          bottom: 0,
          height: "52%",
          background: "#02060e",
        }}
      />
    </div>
  );
}
