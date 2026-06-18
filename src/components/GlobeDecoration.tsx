export function GlobeDecoration() {
  return (
    // Fixed to bottom center — translateY pushes it down so only the top arc is visible
    <div
      className="pointer-events-none fixed bottom-0 left-1/2"
      style={{ transform: "translateX(-50%) translateY(calc(100% - 110px))" }}
    >
      {/* Atmospheric glow — wider than the sphere */}
      <div
        style={{
          position: "absolute",
          inset: "-60px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at 50% 18%, rgba(0,150,255,0.28) 0%, rgba(0,80,200,0.10) 45%, transparent 70%)",
          filter: "blur(22px)",
        }}
      />

      {/* The sphere itself */}
      <div
        style={{
          width: "1000px",
          height: "1000px",
          borderRadius: "50%",
          background: [
            "radial-gradient(circle at 48% 22%,",
            "  rgba(0,130,255,0.22) 0%,",
            "  rgba(0,70,180,0.12) 28%,",
            "  rgba(2,8,28,0.97) 55%,",
            "  rgb(2,8,28) 100%)",
          ].join(""),
          boxShadow: [
            "0 0 0 1px rgba(0,130,255,0.20)",
            "0 -6px 70px 16px rgba(0,140,255,0.32)",
            "0 -2px 130px 40px rgba(0,100,220,0.16)",
          ].join(", "),
        }}
      >
        {/* Bright horizon arc */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "86%",
            height: "3px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(100,210,255,0.95) 0%, rgba(0,160,255,0.55) 40%, transparent 72%)",
            filter: "blur(2px)",
          }}
        />
        {/* Soft glow just above horizon */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "96%",
            height: "22px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(0,180,255,0.28) 0%, rgba(0,110,220,0.10) 55%, transparent 80%)",
            filter: "blur(8px)",
          }}
        />
      </div>

      {/* Solid fill below — blocks any canvas bleed */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "52%",
          background: "rgb(2,8,28)",
        }}
      />
    </div>
  );
}
