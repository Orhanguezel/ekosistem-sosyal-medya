import { env } from "../../core/env";

interface AIResponse {
  content: string;
  model: string;
  provider: string;
}

// ─── Anthropic Claude ───────────────────────────────────────
async function callAnthropic(
  systemPrompt: string,
  userMessage: string
): Promise<AIResponse> {
  if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY eksik");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = (await res.json()) as any;
    throw new Error(`Anthropic hatasi: ${err.error?.message || res.statusText}`);
  }

  const data = (await res.json()) as any;
  return {
    content: data.content[0]?.text || "",
    model: "claude-sonnet-4-20250514",
    provider: "anthropic",
  };
}

// ─── OpenAI ─────────────────────────────────────────────────
async function callOpenAI(
  systemPrompt: string,
  userMessage: string
): Promise<AIResponse> {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY eksik");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = (await res.json()) as any;
    throw new Error(`OpenAI hatasi: ${err.error?.message || res.statusText}`);
  }

  const data = (await res.json()) as any;
  return {
    content: data.choices[0]?.message?.content || "",
    model: "gpt-4o-mini",
    provider: "openai",
  };
}

// ─── Groq ───────────────────────────────────────────────────
async function callGroq(
  systemPrompt: string,
  userMessage: string
): Promise<AIResponse> {
  if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY eksik");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = (await res.json()) as any;
    throw new Error(`Groq hatasi: ${err.error?.message || res.statusText}`);
  }

  const data = (await res.json()) as any;
  return {
    content: data.choices[0]?.message?.content || "",
    model: "llama-3.3-70b-versatile",
    provider: "groq",
  };
}

// ─── Fallback Zinciri ───────────────────────────────────────
export async function generate(
  systemPrompt: string,
  userMessage: string
): Promise<AIResponse> {
  const providers = [
    { name: "anthropic", fn: callAnthropic, key: env.ANTHROPIC_API_KEY },
    { name: "openai", fn: callOpenAI, key: env.OPENAI_API_KEY },
    { name: "groq", fn: callGroq, key: env.GROQ_API_KEY },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    if (!provider.key) continue;

    try {
      return await provider.fn(systemPrompt, userMessage);
    } catch (err) {
      errors.push(`${provider.name}: ${(err as Error).message}`);
    }
  }

  throw new Error(
    `Tum AI saglayicilari basarisiz oldu:\n${errors.join("\n")}`
  );
}

// ─── JSON Parse Yardimcisi ──────────────────────────────────
export function parseAIJson<T>(content: string): T {
  // JSON blogunun basini ve sonunu bul
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI yanitinda JSON bulunamadi");
  }
  return JSON.parse(jsonMatch[0]) as T;
}
