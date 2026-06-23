import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import OpenAI from "openai";

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY ?? "";
}

const SYSTEM_PROMPT = `You are a world-class deep research analyst. Your job is to produce comprehensive, well-structured research reports on any topic.

When given a URL, scrape its content via web search and analyze it deeply.
When given a research question, search the web for up-to-date information and synthesize findings.

For every research task, automatically determine the most relevant analysis type and apply it:

**Marketing Analysis**: Messaging strategy, target audience, positioning, value proposition, content strategy, ad creative analysis, funnel analysis.

**Brand Analysis**: Brand identity, voice, visual language, perception, reputation, market position, brand story, customer sentiment.

**Competitor Analysis**: Strengths & weaknesses, pricing strategy, product differentiation, market share indicators, review sentiment, go-to-market strategy.

**Market Research**: Industry trends, market size, growth signals, key players, consumer behavior, emerging opportunities, regulatory landscape.

**Content/Link Analysis**: When a URL is provided — summarize the page, extract key messages, analyze the business model, identify target audience, assess quality and credibility.

**Company/Startup Research**: Funding history, team background, product roadmap signals, customer reviews, tech stack, growth trajectory.

**Influencer/Creator Research**: Audience demographics, engagement rates, content strategy, brand deals, niche authority.

Output format:
- Clear section headers with **bold**
- Bullet points for lists
- Numbered lists for rankings or steps
- Include sources/citations where relevant
- End with **Key Takeaways** and **Recommended Actions**

Be specific, cite data points, and be actionable. Do not be generic.`;

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  void user;

  const key = getOpenAIKey();
  if (!key) return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });

  const body = await req.json() as { query: string };
  const { query } = body;
  if (!query?.trim()) return NextResponse.json({ error: "Empty query" }, { status: 400 });

  const client = new OpenAI({ apiKey: key });
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.responses.create({
          model: "gpt-4o-mini-search-preview",
          tools: [{ type: "web_search_preview", search_context_size: "high" }],
          instructions: SYSTEM_PROMPT,
          input: query,
          stream: true,
        });

        for await (const event of stream) {
          const e = event as unknown as Record<string, unknown>;
          // Text delta
          if (e.type === "response.output_text.delta") {
            const chunk = (e.delta as string) ?? "";
            if (chunk) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", chunk })}\n\n`));
          }
          // Searching indicator
          if (e.type === "response.web_search_call.in_progress") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "searching" })}\n\n`));
          }
          // Done
          if (e.type === "response.completed") {
            const resp = e.response as Record<string, unknown> | undefined;
            const usage = resp?.usage as Record<string, unknown> | undefined;
            const tokens = (usage?.total_tokens as number) ?? 0;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", tokens })}\n\n`));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Research failed";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: msg })}\n\n`));
      } finally {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", tokens: 0 })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
