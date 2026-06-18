"use client";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#03050f]">
      <div
        className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, #1d4ed8 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "orbDrift1 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, #6d28d9 0%, transparent 70%)",
          filter: "blur(70px)",
          animation: "orbDrift2 28s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-24 left-1/3 h-[450px] w-[450px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #0891b2 0%, transparent 70%)",
          filter: "blur(65px)",
          animation: "orbDrift3 35s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)",
          filter: "blur(55px)",
          animation: "orbDrift4 24s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <style>{`
        @keyframes orbDrift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(60px,-40px) scale(1.08); }
          66% { transform: translate(-30px,70px) scale(0.94); }
        }
        @keyframes orbDrift2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(-50px,60px) scale(1.06); }
          66% { transform: translate(40px,-50px) scale(0.96); }
        }
        @keyframes orbDrift3 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(70px,30px) scale(0.93); }
          66% { transform: translate(-40px,-60px) scale(1.07); }
        }
        @keyframes orbDrift4 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-60px,50px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
