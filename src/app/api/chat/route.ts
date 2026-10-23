import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/groq";
import { NORA_SYSTEM_PROMPT } from "@/lib/nora-prompt";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], model = "llama-3.3-70b-versatile", temperature = 0.5 } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "El campo 'messages' debe ser un array válido." },
        { status: 400 }
      );
    }

    // Asegurar que el System Prompt masivo siempre esté en el contexto de memoria
    const sanitizedMessages: ChatMessage[] = [
      { role: "system", content: NORA_SYSTEM_PROMPT },
      ...messages.filter((m: ChatMessage) => m.role !== "system"),
    ];

    const completion = await groq.chat.completions.create({
      messages: sanitizedMessages,
      model,
      temperature,
    });

    const reply = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      role: "assistant",
      content: reply,
      usage: completion.usage,
    });
  } catch (error: unknown) {
    console.error("[NORA CHAT ERROR]:", error);
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { error: "Fallo en el procesamiento de Nora IA", details: errorMessage },
      { status: 500 }
    );
  }
}
