type DraftedEmail = { subject: string; body: string };

export async function draftBrandOutreachEmail({
  brandName,
  category,
  notes,
}: {
  brandName: string;
  category?: string | null;
  notes?: string | null;
}): Promise<DraftedEmail> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY isn't configured — set it in your environment to use AI-drafted emails.",
    );
  }

  const prompt = `Write a short, professional outreach email from an Amazon wholesale reseller to a brand called "${brandName}"${
    category ? ` (category: ${category})` : ""
  }, proposing a wholesale partnership to sell their products on Amazon.${
    notes ? ` Context/notes: ${notes}` : ""
  } Keep it under 150 words, friendly but professional. Respond with JSON only, in the shape {"subject": "...", "body": "..."} where body is plain text with \\n for line breaks.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI request failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response.");

  const parsed = JSON.parse(content) as DraftedEmail;
  return parsed;
}
