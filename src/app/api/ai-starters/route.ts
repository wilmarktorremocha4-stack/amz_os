import { NextResponse } from "next/server";

const STARTERS = [
  { icon: "🏷️", text: "Walk me through the Brand Partnership Blueprint" },
  { icon: "📦", text: "How do I qualify a wholesale brand for Amazon?" },
  { icon: "✉️", text: "Write me an outreach email to a new supplier" },
  { icon: "📊", text: "What are the key steps in the Wholesale Masterclass?" },
  { icon: "🔍", text: "How do I find profitable wholesale products?" },
  { icon: "💰", text: "What margins should I target for wholesale?" },
  { icon: "🤝", text: "How do I negotiate better terms with suppliers?" },
  { icon: "📈", text: "Walk me through the brand approval process" },
  { icon: "📋", text: "What metrics matter most for my wholesale business?" },
  { icon: "🎯", text: "How do I identify a brand's profitability potential?" },
];

export async function GET() {
  const shuffled = [...STARTERS].sort(() => Math.random() - 0.5).slice(0, 4);
  return NextResponse.json(shuffled);
}
