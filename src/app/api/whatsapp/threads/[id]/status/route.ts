import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/whatsapp/threads/[id]/status
 * Alterna entre 'bot_active', 'in_human_call', 'requires_human' y 'resolved'
 */
export async function PATCH(
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
    const status = body.status;
    const operatorName = body.operator_name || null;

    const allowedStatuses = ["bot_active", "requires_human", "in_human_call", "resolved"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Estado no válido. Permitidos: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updatedRows = await sql`
      UPDATE whatsapp_threads
      SET 
        status = ${status},
        assigned_operator = ${status === "bot_active" ? null : operatorName},
        last_activity = NOW()
      WHERE id = ${threadId}
      RETURNING *;
    `;

    if (updatedRows.length === 0) {
      return NextResponse.json({ success: false, error: "Hilo no encontrado" }, { status: 404 });
    }

    // Si devolvemos el control al bot, podemos insertar un mensaje de sistema opcional
    if (status === "bot_active") {
      await sql`
        INSERT INTO whatsapp_messages (thread_id, sender_type, content)
        VALUES (${threadId}, 'bot', '🤖 Operador ha devuelto el control de la conversación a Caralita IA.')
      `;
    }

    return NextResponse.json({
      success: true,
      message: `Estado actualizado a "${status}"`,
      thread: updatedRows[0],
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al actualizar estado";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

