import { NextResponse } from "next/server";
import Together from "together-ai";
import { ChatMessage } from "@/types/chat";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const history: ChatMessage[] = body.history || [];
    const evaluate = body.evaluate || false;

    const resp = await together.chat.completions.create({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: evaluate ? 512 : 256,
    });

    const reply = resp.choices[0]?.message?.content || "No response.";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
