export function GlobeDecoration() {
  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 translate-y-[46%]">
      {/* Outer atmospheric glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          width: "680px",
          height: "680px",
          background:
            "radial-gradient(circle at 50% 42%, rgba(0,160,255,0.22) 0%, rgba(0,80,200,0.10) 35%, transparent 65%)",
          filter: "blur(18px)",
          transform: "scale(1.15)",
        }}
      />

      {/* Globe sphere */}
      <div
        className="relative rounded-full"
        style={{
          width: "680px",
          height: "680px",
          background:
            "radial-gradient(circle at 48% 38%, rgba(0,120,255,0.18) 0%, rgba(0,60,180,0.10) 30%, rgba(2,8,28,0.96) 62%, rgb(2,8,28) 100%)",
          boxShadow: [
            "0 0 0 1px rgba(0,140,255,0.25)",
            "0 -4px 60px 12px rgba(0,140,255,0.30)",
            "0 -2px 120px 30px rgba(0,100,220,0.18)",
            "inset 0 -20px 80px rgba(0,0,20,0.8)",
          ].join(", "),
        }}
      >
        {/* Horizon bright line */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: "10px",
            width: "88%",
            height: "2px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(80,200,255,0.90) 0%, rgba(0,140,255,0.50) 40%, transparent 75%)",
            filter: "blur(2px)",
          }}
        />

        {/* Secondary softer horizon */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: "6px",
            width: "96%",
            height: "14px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(0,180,255,0.30) 0%, rgba(0,100,220,0.12) 50%, transparent 80%)",
            filter: "blur(6px)",
          }}
        />
      </div>

      {/* Pure black fill below the globe so zero gradient bleeds through */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          height: "50%",
          background: "rgb(2,8,28)",
        }}
      />
    </div>
  );
}
