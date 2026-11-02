import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface WhatsAppMessage {
  id: number;
  thread_id: number;
  sender_type: "customer" | "bot" | "operator";
  content: string;
  media_url: string | null;
  external_message_id: string | null;
  created_at: string;
}

/**
 * GET /api/whatsapp/threads/[id]/messages
 * Devuelve los mensajes de un chat específico
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const threadId = parseInt(id, 10);

    if (isNaN(threadId)) {
      return NextResponse.json({ success: false, error: "ID de hilo inválido" }, { status: 400 });
    }

    const messages = await sql`
      SELECT 
        id, 
        thread_id, 
        sender_type, 
        content, 
        media_url, 
        external_message_id, 
        created_at
      FROM whatsapp_messages
      WHERE thread_id = ${threadId}
      ORDER BY created_at ASC;
    `;

    // Marcar mensajes como leídos
    await sql`
      UPDATE whatsapp_threads
      SET unread_count = 0
      WHERE id = ${threadId};
    `;

    return NextResponse.json({
      success: true,
      total: messages.length,
      messages,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al obtener mensajes";
    return NextResponse.json({ success: false, error: errorMsg, messages: [] }, { status: 500 });
  }
}

