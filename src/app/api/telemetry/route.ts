import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/telemetry
 * Consulta segura de los eventos de feedback y fallas de interfaz registrados en tiempo real
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const status = searchParams.get("status");

    let rows: any[] = [];
    if (status) {
      rows = await sql`
        SELECT id, user_role, screen_path, issue_description, technical_details, status, created_at
        FROM system_feedback_telemetry
        WHERE status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit};
      `;
    } else {
      rows = await sql`
        SELECT id, user_role, screen_path, issue_description, technical_details, status, created_at
        FROM system_feedback_telemetry
        ORDER BY created_at DESC
        LIMIT ${limit};
      `;
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      telemetria: rows,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al consultar telemetría";
    return NextResponse.json({ success: false, error: errorMsg, telemetria: [] }, { status: 500 });
  }
}

