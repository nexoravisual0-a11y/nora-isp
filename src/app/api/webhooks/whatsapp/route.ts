import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint de validación y recepción de Webhook de WhatsApp (Meta Cloud API)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "nora_isp_verify_token";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WHATSAPP WEBHOOK]: Suscripción verificada exitosamente.");
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Token de verificación inválido" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[WHATSAPP WEBHOOK PAYLOAD RECIBIDO]:", JSON.stringify(payload, null, 2));

    // Estructura base para procesamiento de mensajes entrantes
    if (payload.object === "whatsapp_business_account") {
      const entries = payload.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value;
          if (value?.messages) {
            for (const message of value.messages) {
              const from = message.from;
              const text = message.text?.body;
              console.log(`[WHATSAPP MESSAGE]: De: ${from} | Contenido: ${text}`);
              // Aquí se enlaza con /api/chat y base de datos de Nora ISP
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: unknown) {
    console.error("[WHATSAPP WEBHOOK ERROR]:", error);
    return NextResponse.json({ error: "Error procesando webhook de WhatsApp" }, { status: 500 });
  }
}
