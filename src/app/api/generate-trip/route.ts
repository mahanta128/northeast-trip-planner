import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { RHINOTREK_SYSTEM_PROMPT } from "@/lib/prompts/systemPrompt";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 4096,
      messages: [
        { role: "system", content: RHINOTREK_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(body) },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    return NextResponse.json({ plan: parsed });
  } catch (err) {
    console.error("generate-trip error:", err);
    return NextResponse.json({ error: "Failed to generate trip plan." }, { status: 500 });
  }
}
