import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { groq } from "@/lib/groq";
import { NORA_SYSTEM_PROMPT } from "@/lib/nora-prompt";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const MAX_CONTEXT_CHARS = 50_000;

function buildContextMessage(contextPayload: unknown): ChatMessage | null {
  if (!contextPayload || typeof contextPayload !== "object") return null;

  const serialized = JSON.stringify(contextPayload, null, 2);
  if (serialized.length > MAX_CONTEXT_CHARS) {
    throw new RangeError("contextPayload excede el tamaño máximo permitido.");
  }

  return {
    role: "system",
    content:
      "[TELEMETRÍA EN TIEMPO REAL DEL ERP NEXORA/ISPCUBE]\n" +
      "Los siguientes datos reflejan el estado actual de clientes, red FTTH y tickets. " +
      "Úsalos como fuente de verdad al responder; no los repitas textualmente salvo que se te pida.\n\n" +
      serialized,
  };
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      {
        error:
          "GROQ_API_KEY no está configurada en el servidor. Agrégala al archivo .env y reinicia el servidor.",
        code: "GROQ_KEY_MISSING",
      },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const {
      messages = [],
      contextPayload,
      model = "llama-3.3-70b-versatile",
      temperature = 0.5,
    } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "El campo 'messages' debe ser un array válido." },
        { status: 400 }
      );
    }

    const contextMessage = buildContextMessage(contextPayload);

    // System Prompt masivo + contexto ERP (opcional) + historial sin mensajes 'system' del cliente
    const sanitizedMessages: ChatMessage[] = [
      { role: "system", content: NORA_SYSTEM_PROMPT },
      ...(contextMessage ? [contextMessage] : []),
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
      contextInjected: Boolean(contextMessage),
      usage: completion.usage,
    });
  } catch (error: unknown) {
    console.error("[NORA CHAT ERROR]:", error);

    if (error instanceof RangeError) {
      return NextResponse.json({ error: error.message, code: "CONTEXT_TOO_LARGE" }, { status: 413 });
    }

    if (error instanceof Groq.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          {
            error:
              "Groq rechazó la API key (401). Verifica que GROQ_API_KEY en .env sea válida y reinicia el servidor.",
            code: "GROQ_UNAUTHORIZED",
          },
          { status: 401 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          {
            error: "Límite de uso de Groq alcanzado (429). Espera unos segundos y vuelve a intentar.",
            code: "GROQ_RATE_LIMIT",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Error de Groq (${error.status ?? "desconocido"}): ${error.message}`, code: "GROQ_ERROR" },
        { status: error.status ?? 502 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { error: `Fallo en el procesamiento de Nora IA: ${errorMessage}`, code: "INTERNAL" },
      { status: 500 }
    );
  }
}
