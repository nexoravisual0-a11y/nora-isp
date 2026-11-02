import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface WhatsAppThread {
  id: number;
  phone_number: string;
  customer_name: string | null;
  dni_cuit: string | null;
  status: "bot_active" | "requires_human" | "in_human_call" | "resolved";
  assigned_operator: string | null;
  unread_count: number;
  last_message_preview: string | null;
  last_activity: string;
  created_at: string;
}

/**
 * GET /api/whatsapp/threads
 * Lista conversaciones de WhatsApp ordenadas por last_activity DESC
 * Parámetro opcional: ?status=requires_human
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let rows: any[] = [];
    if (status) {
      rows = await sql`
        SELECT 
          id, 
          phone_number, 
          customer_name, 
          dni_cuit, 
          status, 
          assigned_operator, 
          unread_count, 
          last_message_preview, 
          last_activity, 
          created_at
        FROM whatsapp_threads
        WHERE status = ${status}
        ORDER BY last_activity DESC;
      `;
    } else {
      rows = await sql`
        SELECT 
          id, 
          phone_number, 
          customer_name, 
          dni_cuit, 
          status, 
          assigned_operator, 
          unread_count, 
          last_message_preview, 
          last_activity, 
          created_at
        FROM whatsapp_threads
        ORDER BY 
          CASE WHEN status = 'requires_human' THEN 1 WHEN status = 'in_human_call' THEN 2 ELSE 3 END,
          last_activity DESC;
      `;
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      threads: rows,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al obtener conversaciones de WhatsApp";
    return NextResponse.json({ success: false, error: errorMsg, threads: [] }, { status: 500 });
  }
}

