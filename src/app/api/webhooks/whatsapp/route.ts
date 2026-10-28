import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { groq } from "@/lib/groq";
import { sql } from "@/lib/db";
import { NORA_SYSTEM_PROMPT } from "@/lib/nora-prompt";

export const dynamic = "force-dynamic";

interface ClienteRow {
  id: string;
  nombre: string;
  plan: string;
  ip_pppoe: string | null;
  estado_pppoe: string;
  estado_facturacion: string;
  olt_conectada: string | null;
  caja_nap: string | null;
  potencia_dbm: number | null;
  telefono: string | null;
}

interface TicketRow {
  id: string;
  cliente: string;
  asunto: string;
  prioridad: string;
  estado: string;
  creado: string | null;
}

// Herramienta disponible para Nora desde WhatsApp
const NORA_WHATSAPP_TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "crear_ticket_soporte",
      description:
        "Abre y registra de forma autónoma un nuevo ticket de soporte técnico en la Base de Datos Central cuando el abonado de WhatsApp sufre una falla técnica no resoluble remotamente.",
      parameters: {
        type: "object",
        properties: {
          cliente: {
            type: "string",
            description: "Nombre o ID del abonado (ej. CLI-1045 o María Elena Rostagno)",
          },
          asunto: {
            type: "string",
            description: "Descripción técnica precisa de la falla reportada por WhatsApp",
          },
          prioridad: {
            type: "string",
            enum: ["Alta", "Media", "Baja"],
            description: "Prioridad del incidente técnico",
          },
        },
        required: ["cliente", "asunto", "prioridad"],
      },
    },
  },
];

/**
 * Inserta ticket en la base de datos de Neon
 */
async function ejecutarCrearTicket(args: {
  cliente: string;
  asunto: string;
  prioridad: "Alta" | "Media" | "Baja";
}) {
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const ticketId = `TCK-${randomSuffix}`;
  const timestampDesc = "Hace un momento (WhatsApp)";

  await sql`
    INSERT INTO tickets (id, cliente, asunto, prioridad, estado, creado)
    VALUES (${ticketId}, ${args.cliente}, ${args.asunto}, ${args.prioridad}, 'Abierto', ${timestampDesc});
  `;

  return {
    status: "creado_con_exito",
    ticket_id: ticketId,
    cliente: args.cliente,
    asunto: args.asunto,
    prioridad: args.prioridad,
    estado: "Abierto",
    mensaje: `Ticket ${ticketId} registrado en la Base de Datos Central y derivado a cuadrilla técnica.`,
  };
}

/**
 * Envío de mensaje saliente a través de Meta Graph API
 */
async function sendWhatsAppMessage(to: string, textBody: string, phoneNumberId?: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "me";

  if (!accessToken) {
    console.warn(
      `[WHATSAPP OUTBOUND SIMULADO]: WHATSAPP_ACCESS_TOKEN no configurado. Mensaje para ${to}:\n"${textBody}"`
    );
    return false;
  }

  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: textBody },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[META GRAPH API ERROR]:", data);
      return false;
    }

    console.log(`[WHATSAPP SENT]: Mensaje entregado a ${to} (ID: ${data?.messages?.[0]?.id})`);
    return true;
  } catch (err) {
    console.error("[WHATSAPP FETCH NETWORK ERROR]:", err);
    return false;
  }
}

/**
 * Misión 1: Endpoint de Verificación de Webhook (Meta Challenge)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "nora_isp_verify_token";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WHATSAPP WEBHOOK]: Suscripción verificada exitosamente con Meta.");
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("[WHATSAPP WEBHOOK]: Intento de verificación fallido con token inválido.");
  return NextResponse.json({ error: "Token de verificación inválido" }, { status: 403 });
}

/**
 * Misión 2 & 3: Procesador de Mensajes Entrantes y Respuesta con Nora IA
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Validar si el evento proviene de una cuenta de WhatsApp Business
    if (payload.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "IGNORED_NON_WHATSAPP_OBJECT" }, { status: 200 });
    }

    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        const messages = value?.messages || [];

        for (const message of messages) {
          // Solo procesamos mensajes de texto de clientes
          if (message.type !== "text" || !message.text?.body) {
            continue;
          }

          const from = String(message.from); // Ej: 5491123456789
          const userText = String(message.text.body).trim();

          console.log(`[WHATSAPP ENTRANTE]: De: ${from} | Contenido: "${userText}"`);

          // 1. Identificación del abonado en Neon Serverless Postgres
          let cliente: ClienteRow | null = null;
          let activeTickets: TicketRow[] = [];

          try {
            // Limpieza básica del número para match flexible
            const cleanedPhone = from.replace(/\D/g, "");
            const suffixPhone = cleanedPhone.slice(-8); // Últimos 8 dígitos para evitar discrepancias de prefijo país

            const rows = await sql`
              SELECT * FROM clientes 
              WHERE telefono ILIKE ${"%" + suffixPhone + "%"}
                 OR id ILIKE ${"%" + userText + "%"}
              LIMIT 1;
            `;

            if (rows.length > 0) {
              cliente = rows[0] as ClienteRow;

              const ticketsRows = await sql`
                SELECT id, cliente, asunto, prioridad, estado, creado
                FROM tickets
                WHERE (cliente ILIKE ${"%" + cliente.nombre + "%"} OR cliente ILIKE ${"%" + cliente.id + "%"})
                  AND estado != 'Cerrado'
                ORDER BY created_at DESC LIMIT 2;
              `;
              activeTickets = ticketsRows as TicketRow[];
            }
          } catch (dbErr) {
            console.error("[WHATSAPP DB LOOKUP ERROR]:", dbErr);
          }

          // 2. Construcción de Contexto en Vivo para Nora
          const contextLines: string[] = [
            "[CANAL OMNICANAL • WHATSAPP CLOUD API]",
            `• Remitente WhatsApp: +${from}`,
          ];

          if (cliente) {
            const pot = Number(cliente.potencia_dbm ?? 0);
            contextLines.push(
              `• Abonado Identificado: ${cliente.nombre} (${cliente.id})`,
              `• Plan: ${cliente.plan}`,
              `• Estado Financiero / Cobranzas: ${cliente.estado_facturacion}`,
              `• Sesión PPPoE: ${cliente.estado_pppoe} (IP: ${cliente.ip_pppoe || "Sin asignar"})`,
              `• Conexión Física: ${cliente.caja_nap || "N/A"} (OLT: ${cliente.olt_conectada || "N/A"})`,
              `• Potencia Óptica en ONU: ${cliente.potencia_dbm} dBm (${
                pot < -27 ? "CRÍTICO - Corte Óptico" : pot < -24 ? "ADVERTENCIA" : "NORMAL"
              })`
            );

            if (activeTickets.length > 0) {
              contextLines.push(
                "• Tickets Abiertos:",
                ...activeTickets.map(
                  (t) => `  - [${t.id}] ${t.asunto} (${t.prioridad}, ${t.estado})`
                )
              );
            }
          } else {
            contextLines.push(
              "• Abonado: Número telefónico no registrado previamente en el padrón.",
              "• Instrucción: Solicita amablemente el número de DNI o código de abonado (ej. CLI-XXXX) para consultar su telemetría."
            );
          }

          // 3. Inferencia con Groq
          let replyText = "";
          try {
            const conversationMessages: Groq.Chat.ChatCompletionMessageParam[] = [
              { role: "system", content: NORA_SYSTEM_PROMPT },
              { role: "system", content: contextLines.join("\n") },
              { role: "user", content: userText },
            ];

            const initialCompletion = await groq.chat.completions.create({
              messages: conversationMessages,
              model: "qwen/qwen3.8-27b",
              temperature: 0.35,
              max_tokens: 800,
              tools: NORA_WHATSAPP_TOOLS,
              tool_choice: "auto",
            });

            const choice = initialCompletion.choices[0];
            const messageObj = choice?.message;
            const toolCalls = messageObj?.tool_calls;

            replyText = messageObj?.content || "";

            // Manejo de Creación de Ticket si Nora detectó corte técnico
            if (toolCalls && toolCalls.length > 0) {
              conversationMessages.push(messageObj as Groq.Chat.ChatCompletionMessageParam);

              for (const toolCall of toolCalls) {
                if (toolCall.function.name === "crear_ticket_soporte") {
                  let toolArgs = {
                    cliente: cliente ? `${cliente.nombre} (${cliente.id})` : from,
                    asunto: "Reclamo técnico por WhatsApp",
                    prioridad: "Alta" as const,
                  };
                  try {
                    toolArgs = JSON.parse(toolCall.function.arguments);
                  } catch (e) {
                    console.error("Error parseando args tool WhatsApp:", e);
                  }

                  const ticketResult = await ejecutarCrearTicket(toolArgs);

                  conversationMessages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(ticketResult),
                  });
                }
              }

              // Segunda pasada para respuesta final empática por WhatsApp
              const secondCompletion = await groq.chat.completions.create({
                messages: conversationMessages,
                model: "qwen/qwen3.8-27b",
                temperature: 0.35,
                max_tokens: 800,
              });

              replyText = secondCompletion.choices[0]?.message?.content || replyText;
            }
          } catch (aiErr) {
            console.error("[WHATSAPP AI INFERENCE ERROR]:", aiErr);
            replyText =
              "Hola, te habla Caralita, la asistente inteligente de Carale Internet. En este momento estamos experimentando una breve intermitencia en el sistema de autogestión. Nuestro equipo de guardia técnica ha recibido tu notificación y se pondrá en contacto a la brevedad.";
          }

          // 4. Misión 3: Enviar mensaje saliente a WhatsApp mediante Graph API
          await sendWhatsAppMessage(from, replyText, phoneNumberId);
        }
      }
    }

    // Siempre retornar 200 OK a Meta para evitar reintentos masivos
    return NextResponse.json({ status: "EVENT_PROCESSED" }, { status: 200 });
  } catch (error: unknown) {
    // Zero-Spill: Log interno sin romper el contrato con Meta
    console.error("[WHATSAPP WEBHOOK ROOT ERROR]:", error);
    return NextResponse.json({ status: "EVENT_RECEIVED_WITH_LOGS" }, { status: 200 });
  }
}
