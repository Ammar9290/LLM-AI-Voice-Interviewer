import { NextRequest } from "next/server";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

export async function POST(req: NextRequest) {
  try {
    const { messages, evaluate = false } = await req.json();

    // Prefer Ollama (free, local). If not reachable and OPENAI_API_KEY exists, fallback.
    const useOpenAI = !await isOllamaUp() && !!process.env.OPENAI_API_KEY;

    if (useOpenAI) {
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({ model, messages, temperature: 0.4 })
      });
      if (!r.ok) {
        const text = await r.text();
        return new Response(text, { status: r.status });
      }
      const data = await r.json();
      const content = data.choices?.[0]?.message?.content || "";
      return Response.json({ content });
    }

    // Ollama Chat
    const r = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1:8b",
        messages,
        options: { temperature: 0.4, num_ctx: 8192 }
      })
    });
    if (!r.ok) {
      const text = await r.text();
      return new Response(text, { status: r.status });
    }
    // stream=false by default; Ollama returns {message:{content}}
    const data = await r.json();
    const content = data?.message?.content || data?.choices?.[0]?.message?.content || "";
    return Response.json({ content });
  } catch (e: any) {
    return new Response(`LLM error: ${e?.message || e}`, { status: 500 });
  }
}

async function isOllamaUp(): Promise<boolean> {
  try {
    const r = await fetch(`${OLLAMA_HOST}/api/tags`, { cache: "no-store" });
    return r.ok;
  } catch { return false; }
}