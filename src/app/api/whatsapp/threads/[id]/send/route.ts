import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/whatsapp/threads/[id]/send
 * Permite al operador enviar un mensaje humano (crea registro con sender_type: 'operator')
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const threadId = parseInt(id, 10);

    if (isNaN(threadId)) {
      return NextResponse.json({ success: false, error: "ID de hilo inválido" }, { status: 400 });
    }

    const body = await req.json();
    const content = String(body.content || "").trim();
    const operatorName = body.operator_name || "Operador NOC";

    if (!content) {
      return NextResponse.json({ success: false, error: "El mensaje no puede estar vacío" }, { status: 400 });
    }

    // 1. Insertar el mensaje del operador
    const insertRes = await sql`
      INSERT INTO whatsapp_messages (thread_id, sender_type, content)
      VALUES (${threadId}, 'operator', ${content})
      RETURNING id, thread_id, sender_type, content, created_at;
    `;

    // 2. Actualizar el hilo (estado in_human_call, preview y last_activity)
    await sql`
      UPDATE whatsapp_threads
      SET 
        status = 'in_human_call',
        assigned_operator = ${operatorName},
        last_message_preview = ${`[Operador]: ${content.slice(0, 80)}`},
        last_activity = NOW()
      WHERE id = ${threadId};
    `;

    return NextResponse.json({
      success: true,
      message: "Mensaje de operador enviado con éxito.",
      data: insertRes[0],
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al enviar mensaje";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

