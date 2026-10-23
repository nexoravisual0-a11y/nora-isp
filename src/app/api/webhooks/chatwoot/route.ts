import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint para recepción de Webhooks de Chatwoot (Omnicanalidad CRM/Soporte)
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[CHATWOOT WEBHOOK PAYLOAD RECIBIDO]:", JSON.stringify(payload, null, 2));

    const { event, message_type, content, sender, conversation } = payload;

    // Detectar mensajes entrantes creados por clientes o agentes
    if (event === "message_created" && message_type === "incoming") {
      console.log(`[CHATWOOT MENSAJE ENTRANTE]: Conversación #${conversation?.id} | De: ${sender?.name || sender?.id} | Contenido: ${content}`);
      // Aquí se conecta con el motor de respuesta de Nora ISP para automatizar Nivel 3 o CRM
    }

    return NextResponse.json({ status: "success", received: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("[CHATWOOT WEBHOOK ERROR]:", error);
    return NextResponse.json({ error: "Error procesando webhook de Chatwoot" }, { status: 500 });
  }
}
