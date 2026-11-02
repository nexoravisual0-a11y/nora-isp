import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface CommercialPlan {
  id: number;
  category: "residencial" | "b2b" | "mayorista" | string;
  title: string;
  badge: string | null;
  description: string;
  features: string[];
  cta_text: string;
  cta_action: string;
  display_order: number;
  is_active: boolean;
  updated_at?: string;
}

/**
 * GET /api/commercial-plans
 * Retorna todos los planes comerciales activos ordenados por display_order
 */
export async function GET() {
  try {
    const rows = await sql`
      SELECT 
        id, 
        category, 
        title, 
        badge, 
        description, 
        features, 
        cta_text, 
        cta_action, 
        display_order, 
        is_active, 
        updated_at
      FROM isp_commercial_plans
      ORDER BY display_order ASC, id ASC;
    `;

    return NextResponse.json({
      success: true,
      plans: rows,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al obtener planes comerciales";
    return NextResponse.json({ success: false, error: errorMsg, plans: [] }, { status: 500 });
  }
}

/**
 * PUT /api/commercial-plans
 * Permite al NOC actualizar un plan existente (título, descripción, badge, features, cta_text, is_active, display_order)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      title,
      badge,
      description,
      features,
      cta_text,
      cta_action,
      display_order,
      is_active,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "El ID del plan es obligatorio." }, { status: 400 });
    }

    const updatedRows = await sql`
      UPDATE isp_commercial_plans
      SET 
        title = COALESCE(${title}, title),
        badge = ${badge !== undefined ? badge : null},
        description = COALESCE(${description}, description),
        features = COALESCE(${JSON.stringify(features)}::jsonb, features),
        cta_text = COALESCE(${cta_text}, cta_text),
        cta_action = COALESCE(${cta_action}, cta_action),
        display_order = COALESCE(${display_order}, display_order),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    if (updatedRows.length === 0) {
      return NextResponse.json({ success: false, error: "Plan comercial no encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Plan comercial actualizado con éxito.",
      plan: updatedRows[0],
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al actualizar el plan comercial";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

