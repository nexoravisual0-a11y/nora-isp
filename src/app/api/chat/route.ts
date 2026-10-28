import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { groq } from "@/lib/groq";
import { sql } from "@/lib/db";
import { NORA_SYSTEM_PROMPT } from "@/lib/nora-prompt";
import { CARALITA_PUBLIC_PROMPT } from "@/lib/caralita-public-prompt";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Groq.Chat.ChatCompletionMessageToolCall[];
}

export interface TechnicalItem {
  label: string;
  valor: string;
  alerta?: boolean;
  critico?: boolean;
}

export interface TechnicalPayload {
  tipo: "cliente" | "nodo" | "ticket";
  titulo: string;
  subtitulo?: string;
  datos: TechnicalItem[];
}

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
}

interface TicketRow {
  id: string;
  cliente: string;
  asunto: string;
  prioridad: string;
  estado: string;
  creado: string | null;
}

interface NodoRow {
  id: string;
  nombre: string;
  tipo: string;
  ubicacion: string | null;
  estado: string;
  potencia_salida_dbm: number | null;
  puertos_ocupados: number;
  puertos_totales: number;
  atenuacion_promedio: string | null;
}

// Definición de Herramientas para Caralita (Function Calling)
const NORA_TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "buscar_cliente",
      description:
        "Busca los datos de un abonado en la base de datos de Carale Internet mediante su DNI, CUIT, teléfono móvil, ID de cliente o nombre para verificar el estado de su conexión y telemetría óptica.",
      parameters: {
        type: "object",
        properties: {
          identificador: {
            type: "string",
            description: "DNI, CUIT, número de teléfono o ID del cliente (ej. 38123456, +5493786414533, CLI-1045)",
          },
        },
        required: ["identificador"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_ticket_soporte",
      description:
        "Abre y registra de forma autónoma un nuevo ticket o reclamo de soporte técnico en la base de datos PostgreSQL de Carale Internet cuando se detecta una falla técnica no resoluble remotamente (corte de fibra, atenuación < -27 dBm, rotura de acometida o avería de splitter/ONU).",
      parameters: {
        type: "object",
        properties: {
          cliente: {
            type: "string",
            description: "Nombre o ID del abonado afectado (ej. CLI-1045 o María Elena Rostagno)",
          },
          asunto: {
            type: "string",
            description: "Diagnóstico técnico preciso del incidente para el técnico de guardia o resumen del reclamo",
          },
          prioridad: {
            type: "string",
            enum: ["Alta", "Media", "Baja"],
            description: "Nivel de prioridad ('Alta' para cortes y potencias críticas, 'Media' para degradación, 'Baja' para consultas)",
          },
        },
        required: ["cliente", "asunto", "prioridad"],
      },
    },
  },
];

/**
 * Función ejecutora del Tool: Busca cliente en Neon Postgres por DNI, teléfono o ID
 */
async function ejecutarBuscarCliente(args: { identificador: string }) {
  const rawId = (args.identificador || "").trim();
  if (!rawId) {
    return {
      encontrado: false,
      mensaje: "No se proporcionó ningún número de DNI o teléfono.",
    };
  }

  const cleanDigits = rawId.replace(/[^0-9]/g, "");

  const rows = await sql`
    SELECT 
      id, 
      nombre, 
      plan, 
      ip_pppoe, 
      estado_pppoe, 
      estado_facturacion, 
      olt_conectada, 
      caja_nap, 
      potencia_dbm, 
      telefono, 
      dni, 
      domicilio
    FROM clientes
    WHERE 
      id ILIKE ${'%' + rawId + '%'}
      OR (LENGTH(${cleanDigits}) >= 4 AND regexp_replace(COALESCE(dni, ''), '[^0-9]', '', 'g') = ${cleanDigits})
      OR (LENGTH(${cleanDigits}) >= 6 AND regexp_replace(COALESCE(telefono, ''), '[^0-9]', '', 'g') LIKE ${'%' + cleanDigits + '%'})
      OR dni ILIKE ${'%' + rawId + '%'}
      OR telefono ILIKE ${'%' + rawId + '%'}
      OR nombre ILIKE ${'%' + rawId + '%'}
    LIMIT 1;
  `;

  if (rows.length === 0) {
    return {
      encontrado: false,
      mensaje: `No se encontró ningún abonado con el identificador "${rawId}" en la Base de Datos Central. Por favor, solicita verificar el número de DNI o teléfono.`,
    };
  }

  const c = rows[0];
  const pot = Number(c.potencia_dbm ?? 0);
  const diagnosticoOptico =
    pot < -27
      ? "CRÍTICO - Pérdida de potencia / desconexión óptica inminente"
      : pot < -24
      ? "ADVERTENCIA - Atenuación elevada"
      : "ÓPTIMO - Señal dentro de norma GPON";

  return {
    encontrado: true,
    mensaje: `Cliente localizado: ${c.nombre} (ID: ${c.id}, Plan: ${c.plan}, Conexión: ${c.estado_pppoe}, Potencia: ${c.potencia_dbm} dBm - ${diagnosticoOptico}, Facturación: ${c.estado_facturacion}).`,
    datos: {
      id: c.id,
      nombre: c.nombre,
      plan: c.plan,
      ip_pppoe: c.ip_pppoe,
      estado_pppoe: c.estado_pppoe,
      estado_facturacion: c.estado_facturacion,
      potencia_dbm: c.potencia_dbm,
      caja_nap: c.caja_nap,
      olt_conectada: c.olt_conectada,
      diagnostico_optico: diagnosticoOptico,
    },
  };
}

/**
 * Función ejecutora del Tool: Inserta el ticket en Neon Postgres
 */
async function ejecutarCrearTicket(args: {
  cliente: string;
  asunto: string;
  prioridad: "Alta" | "Media" | "Baja";
}) {
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const ticketId = `TCK-${randomSuffix}`;
  const timestampDesc = "Hace un instante (Caralita IA)";

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
    mensaje: `Ticket ${ticketId} registrado en la Base de Datos Central con prioridad ${args.prioridad} y asignado a guardia técnica.`,
  };
}

/**
 * Misión 2 & 3: Construye e inyecta la memoria viva y genera technicalPayload
 */
async function buildRealtimeContextAndPayload(
  userMessage: string,
  explicitClienteId?: string
): Promise<{ contextMessage: ChatMessage | null; technicalPayload: TechnicalPayload | null }> {
  try {
    let technicalPayload: TechnicalPayload | null = null;

    // 1. Detección de Cliente
    const matchId = userMessage.match(/\b(CLI-\d+)\b/i);
    const targetId = explicitClienteId || (matchId ? matchId[1].toUpperCase() : null);

    let clienteData: ClienteRow | null = null;
    let clienteTickets: TicketRow[] = [];

    if (targetId) {
      const rows = await sql`SELECT * FROM clientes WHERE id ILIKE ${targetId} LIMIT 1;`;
      if (rows.length > 0) clienteData = rows[0] as ClienteRow;
    } else {
      const posiblesNombres = ["María Elena", "Juan Carlos", "Transportes"];
      for (const nombre of posiblesNombres) {
        if (userMessage.toLowerCase().includes(nombre.toLowerCase())) {
          const rows = await sql`SELECT * FROM clientes WHERE nombre ILIKE ${"%" + nombre + "%"} LIMIT 1;`;
          if (rows.length > 0) {
            clienteData = rows[0] as ClienteRow;
            break;
          }
        }
      }

      // Detección por DNI o Teléfono en el mensaje
      if (!clienteData) {
        const digitsMatch = userMessage.match(/\b\d{7,13}\b/);
        if (digitsMatch) {
          const num = digitsMatch[0];
          const rows = await sql`
            SELECT * FROM clientes 
            WHERE 
              regexp_replace(COALESCE(dni, ''), '[^0-9]', '', 'g') = ${num}
              OR regexp_replace(COALESCE(telefono, ''), '[^0-9]', '', 'g') LIKE ${'%' + num + '%'}
              OR dni ILIKE ${'%' + num + '%'}
              OR telefono ILIKE ${'%' + num + '%'}
            LIMIT 1;
          `;
          if (rows.length > 0) clienteData = rows[0] as ClienteRow;
        }
      }
    }

    if (clienteData) {
      const ticketsRows = await sql`
        SELECT id, cliente, asunto, prioridad, estado, creado 
        FROM tickets 
        WHERE cliente ILIKE ${"%" + clienteData.nombre + "%"} OR cliente ILIKE ${"%" + clienteData.id + "%"}
        ORDER BY created_at DESC LIMIT 3;
      `;
      clienteTickets = ticketsRows as TicketRow[];

      const pot = Number(clienteData.potencia_dbm ?? 0);
      technicalPayload = {
        tipo: "cliente",
        titulo: `${clienteData.nombre} (${clienteData.id})`,
        subtitulo: `Plan ${clienteData.plan} • ${clienteData.caja_nap || "Red FTTH"}`,
        datos: [
          {
            label: "Potencia Óptica",
            valor: `${clienteData.potencia_dbm} dBm`,
            critico: pot < -27,
            alerta: pot < -24 && pot >= -27,
          },
          {
            label: "Sesión PPPoE",
            valor: clienteData.estado_pppoe,
            critico: clienteData.estado_pppoe === "Desconectado",
          },
          {
            label: "Facturación",
            valor: clienteData.estado_facturacion,
            alerta: clienteData.estado_facturacion === "Moroso",
          },
          {
            label: "IP PPPoE",
            valor: clienteData.ip_pppoe || "Sin asignar",
          },
          {
            label: "Caja NAP",
            valor: clienteData.caja_nap || "N/A",
          },
          {
            label: "OLT Cabecera",
            valor: clienteData.olt_conectada || "N/A",
          },
        ],
      };
    }

    // 2. Detección de Nodo si no hay cliente (ej. NAP-04, OLT-01)
    if (!clienteData) {
      const matchNodo = userMessage.match(/\b(NAP-\d+|OLT-\d+)\b/i);
      if (matchNodo) {
        const nodoId = matchNodo[1].toUpperCase();
        const nodoRows = await sql`SELECT * FROM nodos WHERE id ILIKE ${nodoId} LIMIT 1;`;
        if (nodoRows.length > 0) {
          const nodo = nodoRows[0] as NodoRow;
          const isCrit = nodo.estado === "Critical";
          technicalPayload = {
            tipo: "nodo",
            titulo: `${nodo.nombre} (${nodo.id})`,
            subtitulo: `${nodo.tipo} • ${nodo.ubicacion || "Red FTTH"}`,
            datos: [
              { label: "Estado", valor: nodo.estado, critico: isCrit },
              {
                label: "Potencia Salida",
                valor: `${nodo.potencia_salida_dbm} dBm`,
                critico: isCrit,
              },
              {
                label: "Puertos Ocupados",
                valor: `${nodo.puertos_ocupados} / ${nodo.puertos_totales}`,
              },
              {
                label: "Atenuación",
                valor: nodo.atenuacion_promedio || "Normal",
                alerta: isCrit,
              },
            ],
          };
        }
      }
    }

    // Traer telemetría general
    const [nodosCriticos, totalStats] = await Promise.all([
      sql`SELECT id, nombre, tipo, ubicacion, estado, potencia_salida_dbm, atenuacion_promedio FROM nodos WHERE estado = 'Critical' LIMIT 2;`,
      sql`SELECT count(*)::int as total_clientes, (SELECT count(*)::int FROM tickets WHERE estado = 'Abierto') as tickets_abiertos FROM clientes;`,
    ]);

    const lineasContexto: string[] = [
      "[TELEMETRÍA EN VIVO • BASE DE DATOS CENTRAL]",
      `• Padrón General: ${totalStats[0]?.total_clientes ?? 0} abonados registrados | ${totalStats[0]?.tickets_abiertos ?? 0} tickets abiertos actualmente.`,
    ];

    if (nodosCriticos.length > 0) {
      const nc = nodosCriticos as unknown as NodoRow[];
      lineasContexto.push("• Alertas Críticas de Infraestructura:");
      for (const nodo of nc) {
        lineasContexto.push(
          `  - ${nodo.nombre} (${nodo.id}): Potencia ${nodo.potencia_salida_dbm} dBm en ${nodo.ubicacion}. Estado: ${nodo.estado}.`
        );
      }
    }

    if (clienteData) {
      const pot = Number(clienteData.potencia_dbm ?? 0);
      const diagnosticoOptico =
        pot < -27
          ? "CRÍTICO - Pérdida de potencia / desconexión óptica inminente"
          : pot < -24
          ? "ADVERTENCIA - Atenuación elevada"
          : "ÓPTIMO - Señal dentro de norma GPON";

      lineasContexto.push("\n[FICHA EN VIVO DEL ABONADO CONSULTADO]");
      lineasContexto.push(`• ID / Nombre: ${clienteData.nombre} (${clienteData.id})`);
      lineasContexto.push(`• Plan Contratado: ${clienteData.plan}`);
      lineasContexto.push(`• Estado Financiero / Cobranzas: ${clienteData.estado_facturacion}`);
      lineasContexto.push(`• Sesión MikroTik PPPoE: ${clienteData.estado_pppoe} (IP: ${clienteData.ip_pppoe || "Sin IP"})`);
      lineasContexto.push(`• Conexión Física: ${clienteData.caja_nap || "Sin NAP"} (OLT: ${clienteData.olt_conectada || "Sin OLT"})`);
      lineasContexto.push(`• Potencia Óptica en ONU: ${clienteData.potencia_dbm} dBm (${diagnosticoOptico})`);

      if (clienteTickets.length > 0) {
        lineasContexto.push("• Historial de Tickets del Abonado:");
        for (const t of clienteTickets) {
          lineasContexto.push(`  - [${t.id}] ${t.asunto} (Estado: ${t.estado}, Prioridad: ${t.prioridad})`);
        }
      }
    }

    return {
      contextMessage: { role: "system", content: lineasContexto.join("\n") },
      technicalPayload,
    };
  } catch (err) {
    console.error("[ERROR CONTEXTO CORE]:", err);
    return { contextMessage: null, technicalPayload: null };
  }
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
      clienteId,
      source = "noc",
      model = "qwen/qwen3.8-27b",
      temperature = 0.4,
    } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "El campo 'messages' debe ser un array válido." },
        { status: 400 }
      );
    }

    // Último mensaje del usuario
    const lastUserMessage =
      [...messages].reverse().find((m: ChatMessage) => m.role === "user")?.content || "";

    // Misión 2 & 3: Consulta en vivo a Neon y generación de technicalPayload
    const { contextMessage, technicalPayload: initialPayload } =
      await buildRealtimeContextAndPayload(lastUserMessage, clienteId);

    let activePayload: TechnicalPayload | null = initialPayload;

    // Enrutamiento inteligente de System Prompt: portal público vs consola técnica NOC
    const selectedSystemPrompt =
      source === "portal" ? CARALITA_PUBLIC_PROMPT : NORA_SYSTEM_PROMPT;

    // Ensamblado de mensajes con System Prompt y memoria viva
    const conversationMessages: ChatMessage[] = [
      { role: "system", content: selectedSystemPrompt },
      ...(contextMessage ? [contextMessage] : []),
      ...messages.filter((m: ChatMessage) => m.role !== "system"),
    ];

    // Llamada con Function Calling
    const initialCompletion = await groq.chat.completions.create({
      messages: conversationMessages as Groq.Chat.ChatCompletionMessageParam[],
      model,
      temperature,
      max_tokens: 800,
      tools: NORA_TOOLS,
      tool_choice: "auto",
    });

    const choice = initialCompletion.choices[0];
    const initialMessage = choice?.message;
    const toolCalls = initialMessage?.tool_calls;

    let finalContent = initialMessage?.content || "";
    let ticketsCreados: Array<Record<string, unknown>> = [];

    // Si Caralita ejecutó herramientas (buscar cliente o crear ticket)
    if (toolCalls && toolCalls.length > 0) {
      conversationMessages.push(initialMessage as ChatMessage);

      for (const toolCall of toolCalls) {
        if (toolCall.function.name === "buscar_cliente") {
          let toolArgs = { identificador: "" };
          try {
            toolArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            console.error("Error parseando argumentos de buscar_cliente:", e);
          }

          const resultado = await ejecutarBuscarCliente(toolArgs);

          if (resultado.encontrado && resultado.datos) {
            const c = resultado.datos;
            const pot = Number(c.potencia_dbm ?? 0);
            activePayload = {
              tipo: "cliente",
              titulo: `${c.nombre} (${c.id})`,
              subtitulo: `Plan ${c.plan} • ${c.caja_nap || "Red FTTH"}`,
              datos: [
                {
                  label: "Potencia Óptica",
                  valor: `${c.potencia_dbm} dBm`,
                  critico: pot < -27,
                  alerta: pot < -24 && pot >= -27,
                },
                {
                  label: "Sesión PPPoE",
                  valor: c.estado_pppoe,
                  critico: c.estado_pppoe === "Desconectado",
                },
                {
                  label: "Facturación",
                  valor: c.estado_facturacion,
                  alerta: c.estado_facturacion === "Moroso",
                },
                {
                  label: "IP PPPoE",
                  valor: c.ip_pppoe || "Sin asignar",
                },
              ],
            };
          }

          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify(resultado),
          });
        } else if (toolCall.function.name === "crear_ticket_soporte") {
          let toolArgs = { cliente: "Desconocido", asunto: "Incidencia técnica", prioridad: "Alta" as const };
          try {
            toolArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            console.error("Error parseando argumentos de tool:", e);
          }

          // Ejecución real en Neon Postgres
          const resultado = await ejecutarCrearTicket(toolArgs);
          ticketsCreados.push(resultado);

          // Actualizar technicalPayload con la tarjeta del ticket creado
          activePayload = {
            tipo: "ticket",
            titulo: `Ticket Abierto: ${resultado.ticket_id}`,
            subtitulo: `Abonado: ${resultado.cliente} • Prioridad: ${resultado.prioridad}`,
            datos: [
              { label: "Número Ticket", valor: resultado.ticket_id },
              { label: "Estado", valor: "Abierto", critico: true },
              { label: "Prioridad", valor: resultado.prioridad, critico: resultado.prioridad === "Alta" },
              { label: "Diagnóstico", valor: resultado.asunto },
            ],
          };

          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify(resultado),
          });
        }
      }

      // Segunda llamada a Groq para generar la respuesta final
      const secondCompletion = await groq.chat.completions.create({
        messages: conversationMessages as Groq.Chat.ChatCompletionMessageParam[],
        model,
        temperature,
        max_tokens: 800,
      });

      finalContent = secondCompletion.choices[0]?.message?.content || "";
    }

    return NextResponse.json({
      success: true,
      role: "assistant",
      content: finalContent,
      technicalPayload: activePayload,
      ticketsCreados,
      contextInjected: Boolean(contextMessage),
      usage: initialCompletion.usage,
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
              "El Motor de IA rechazó la clave de autenticación (401). Verifica la configuración en .env y reinicia el servidor.",
            code: "AI_UNAUTHORIZED",
          },
          { status: 401 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          {
            error: "Límite de uso del Motor de IA alcanzado (429). Espera unos segundos y vuelve a intentar.",
            code: "AI_RATE_LIMIT",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Error del Motor de IA (${error.status ?? "desconocido"}): ${error.message}`, code: "AI_ERROR" },
        { status: error.status ?? 502 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { error: `Fallo en el procesamiento de Caralita IA: ${errorMessage}`, code: "INTERNAL" },
      { status: 500 }
    );
  }
}
