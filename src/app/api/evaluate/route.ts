// app/api/evaluate/route.ts
import { NextResponse } from "next/server";
import Together from "together-ai";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    const response = await together.chat.completions.create({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: [
        {
          role: "system",
          content:
            "You are an AI interviewer. Evaluate the candidate’s performance, mentioning strengths, weaknesses, and whether they should be selected.",
        },
        {
          role: "user",
          content: `Here is the full transcript of the interview:\n\n${transcript}`,
        },
      ],
    });

    return NextResponse.json({
      evaluation: response.choices?.[0]?.message?.content || "No evaluation returned.",
    });
  } catch (error: any) {
    console.error("Evaluation Error:", error);
    return NextResponse.json(
      { error: error.message || "Evaluation failed" },
      { status: 500 }
    );
  }
}
