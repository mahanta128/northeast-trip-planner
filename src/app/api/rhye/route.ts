import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { RHYE_SYSTEM_PROMPT } from "@/lib/prompts/rhyeSystemPrompt";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { message, tripContext, chatHistory = [] } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message." }, { status: 400 });
  }

  const systemContent = tripContext
    ? `${RHYE_SYSTEM_PROMPT}\n\nCURRENT TRIP CONTEXT:\n${JSON.stringify(tripContext, null, 2)}`
    : RHYE_SYSTEM_PROMPT;

  const messages = [
    { role: "system" as const, content: systemContent },
    ...chatHistory.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 1024,
      messages,
    });

    const reply = response.choices[0]?.message?.content ?? "";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("RHYE API error:", err);
    return NextResponse.json({ error: "RHYE failed to respond." }, { status: 500 });
  }
}
