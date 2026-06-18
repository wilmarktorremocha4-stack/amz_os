export function GlobeDecoration() {
  return (
    <div
      className="pointer-events-none fixed bottom-0 left-1/2"
      style={{
        transform: "translateX(-50%) translateY(calc(100% - 90px))",
        width: "120vw",
        height: "120vw",
      }}
    >
      {/* Pure black sphere — glow only on the outer rim via box-shadow */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "#010408",
          boxShadow:
            "0 -4px 50px 10px rgba(0,130,255,0.25), " +
            "0 -1px 100px 25px rgba(0,80,180,0.12)",
        }}
      />
      {/* Solid floor — blocks any canvas bleed below the sphere */}
      <div
        style={{
          position: "absolute",
          left: "-10%",
          right: "-10%",
          bottom: 0,
          height: "52%",
          background: "#010408",
        }}
      />
    </div>
  );
}
