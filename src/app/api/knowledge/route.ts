import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { groq } from "@/lib/groq";

export const dynamic = "force-dynamic";

/**
 * Estructura de regla destilada de alta fidelidad
 */
export interface ReglaDestilada {
  parametro: string;
  valor_o_umbral: string;
  severidad?: "info" | "advertencia" | "critico";
}

export interface DocumentoDestilado {
  id?: number | string;
  titulo: string;
  categoria: string;
  resumen_destilado: string;
  reglas_clave: ReglaDestilada[];
  comandos_terminal: string[];
  creado_el?: string;
}

// Almacén en memoria de respaldo si Postgres no está conectado o la tabla no existe
const IN_MEMORY_KNOWLEDGE_STORE: DocumentoDestilado[] = [
  {
    titulo: "Normas Ópticas y Umbrales GPON Carale",
    categoria: "FTTH",
    resumen_destilado: "• Atenuación óptima en ONU: -15 a -24 dBm\n• Umbral de advertencia: -24 a -27 dBm\n• Umbral crítico de corte: < -27 dBm (Generar Ticket Inmediato)\n• Potencia de transmisión OLT GPON (Clase B+): +1.5 a +5 dBm (1490nm)",
    reglas_clave: [
      { parametro: "Potencia óptima ONU", valor_o_umbral: "-15 a -24 dBm", severidad: "info" },
      { parametro: "Atenuación elevada", valor_o_umbral: "-24 a -27 dBm", severidad: "advertencia" },
      { parametro: "Potencia crítica / Corte", valor_o_umbral: "< -27 dBm", severidad: "critico" },
    ],
    comandos_terminal: [
      "/interface pppoe-server print",
      "/interface pppoe-server remove [find user=CLI-1045]",
      "display ont info 0 1 1",
    ],
  },
];

/**
 * Filtro determinístico de destilación de conocimiento.
 * Extrae reglas duras, umbrales dBm/Mbps, comandos CLI y pares clave-valor,
 * desechando párrafos decorativos, introducciones o saludos.
 */
export function destilarConocimientoHeuristico(texto: string): {
  resumen_destilado: string;
  reglas_clave: ReglaDestilada[];
  comandos_terminal: string[];
} {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const reglas_clave: ReglaDestilada[] = [];
  const comandos_terminal: string[] = [];
  const bulletsDestilados: string[] = [];

  // Expresiones regulares para patrones técnicos
  const regexComandoCLI = /^(\/|\$|>|#|(interface|display|config|show|ip|vlan|gpon|ont|olt|snmp|ping|traceroute))\b/i;
  const regexUmbral = /(<=?|>=?|>|<|=|:)\s*-?\d+(\.\d+)?\s*(dbm|db|mbps|gbps|ms|v|a|w|nm|ghz|mhz|km|m)\b/i;
  const regexClaveValor = /^([A-ZÁÉÍÓÚa-záéíóú0-9_\-\s]{3,35})\s*[:=]\s*([^\n\r]+)$/;
  const regexFiltroRuido = /^(bienvenidos|hola|estimados|este manual|en este documento|el presente documento|a continuación|introducción|resumen general|índice|conclusión|muchas gracias)/i;

  for (const linea of lineas) {
    if (regexFiltroRuido.test(linea)) {
      continue; // Descartar texto decorativo
    }

    // Detectar comandos de consola / MikroTik / OLT
    if (regexComandoCLI.test(linea) || linea.startsWith("/") || linea.includes("print") || linea.includes("export")) {
      const limpio = linea.replace(/^[`"']|[`"']$/g, "").trim();
      if (!comandos_terminal.includes(limpio) && limpio.length > 3) {
        comandos_terminal.push(limpio);
        bulletsDestilados.push(`• Comando CLI: \`${limpio}\``);
      }
      continue;
    }

    // Detectar umbrales técnicos
    if (regexUmbral.test(linea)) {
      const esCritico = /critico|crítico|corte|alarma|grave|falla|down/i.test(linea);
      const esAlerta = /alerta|advertencia|atenuacion|degradacion|warning/i.test(linea);
      const severidad = esCritico ? "critico" : esAlerta ? "advertencia" : "info";

      reglas_clave.push({
        parametro: linea.split(/[:=]/)[0]?.replace(/^[-*•]\s*/, "").trim() || "Parámetro técnico",
        valor_o_umbral: linea.replace(/^[-*•]\s*/, "").trim(),
        severidad,
      });

      bulletsDestilados.push(`• [${severidad.toUpperCase()}] ${linea.replace(/^[-*•]\s*/, "").trim()}`);
      continue;
    }

    // Detectar pares clave-valor concisos
    const matchKV = linea.match(regexClaveValor);
    if (matchKV && matchKV[1].length < 30 && matchKV[2].length < 120) {
      const key = matchKV[1].replace(/^[-*•]\s*/, "").trim();
      const val = matchKV[2].trim();
      reglas_clave.push({
        parametro: key,
        valor_o_umbral: val,
        severidad: /critico|corte|rojo|down|fail/i.test(val) ? "critico" : "info",
      });
      bulletsDestilados.push(`• ${key}: ${val}`);
      continue;
    }

    // Si la línea es una directiva técnica corta (menor a 150 caracteres con términos técnicos)
    if (
      linea.length <= 150 &&
      /\b(dbm|ont|onu|olt|nap|splitter|pppoe|fibra|vlan|gpon|sc\/apc|otdr|potencia|atenuación)\b/i.test(linea)
    ) {
      bulletsDestilados.push(`• ${linea.replace(/^[-*•]\s*/, "").trim()}`);
    }
  }

  const resumen_destilado = bulletsDestilados.join("\n") || "No se detectaron reglas técnicas explícitas en el fragmento.";

  return {
    resumen_destilado,
    reglas_clave,
    comandos_terminal,
  };
}

/**
 * Función opcional asistida por IA para destilar con máxima precisión semántica
 */
async function destilarConIA(texto: string): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            "Eres un compilador y destilador técnico de telecomunicaciones ISP. Tu tarea es extraer EXCLUSIVAMENTE reglas duras, umbrales ópticos/eléctricos (dBm, ms, Mbps) y comandos exactos de consola. Elimina toda introducción, saludo, texto decorativo o explicativo. Responde ÚNICAMENTE en formato viñetas telegráficas (• Regla: ... o • Comando: ...).",
        },
        {
          role: "user",
          content: `Destila el siguiente texto técnico:\n\n${texto.slice(0, 4000)}`,
        },
      ],
    });
    return completion.choices[0]?.message?.content || null;
  } catch (err) {
    console.warn("[DESTILACION IA FALLBACK A HEURISTICA]:", err);
    return null;
  }
}

/**
 * GET /api/knowledge
 * Retorna las reglas y documentos técnicos destilados actualmente activos
 */
export async function GET() {
  try {
    let dbDocs: any[] = [];
    try {
      dbDocs = await sql`
        SELECT id, titulo, categoria, resumen_destilado, reglas_clave, comandos_terminal, creado_el
        FROM conocimiento_tecnico
        ORDER BY id DESC
        LIMIT 20;
      `;
    } catch {
      // Si la tabla no existe en la base de datos de Neon, usamos la memoria activa
      dbDocs = [];
    }

    const items = dbDocs.length > 0 ? dbDocs : IN_MEMORY_KNOWLEDGE_STORE;

    return NextResponse.json({
      success: true,
      total: items.length,
      documentos: items,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al obtener conocimiento";
    return NextResponse.json(
      { success: false, error: errorMsg, documentos: IN_MEMORY_KNOWLEDGE_STORE },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge
 * Recibe un manual o texto extenso, aplica el filtro de destilación y almacena solo el extracto puro
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titulo = "Documentación Técnica", categoria = "General", contenido } = body;

    if (!contenido || typeof contenido !== "string" || contenido.trim().length === 0) {
      return NextResponse.json(
        { error: "El campo 'contenido' es obligatorio y debe contener texto técnico." },
        { status: 400 }
      );
    }

    // 1. Destilación determinística pura (rápida y precisa)
    const heuristica = destilarConocimientoHeuristico(contenido);

    // 2. Destilación semántica asistida si el texto es muy extenso y hay API disponible
    let resumenFinal = heuristica.resumen_destilado;
    if (contenido.length > 500) {
      const resumenIA = await destilarConIA(contenido);
      if (resumenIA && resumenIA.trim().length > 0) {
        resumenFinal = resumenIA.trim();
      }
    }

    const docDestilado: DocumentoDestilado = {
      titulo: String(titulo).trim(),
      categoria: String(categoria).trim(),
      resumen_destilado: resumenFinal,
      reglas_clave: heuristica.reglas_clave,
      comandos_terminal: heuristica.comandos_terminal,
      creado_el: new Date().toISOString(),
    };

    // 3. Almacenar en Neon Postgres si la tabla está disponible
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS conocimiento_tecnico (
          id SERIAL PRIMARY KEY,
          titulo VARCHAR(255) NOT NULL,
          categoria VARCHAR(100) NOT NULL,
          resumen_destilado TEXT NOT NULL,
          reglas_clave JSONB,
          comandos_terminal JSONB,
          creado_el TIMESTAMP DEFAULT NOW()
        );
      `;

      const insertRes = await sql`
        INSERT INTO conocimiento_tecnico (titulo, categoria, resumen_destilado, reglas_clave, comandos_terminal)
        VALUES (
          ${docDestilado.titulo}, 
          ${docDestilado.categoria}, 
          ${docDestilado.resumen_destilado}, 
          ${JSON.stringify(docDestilado.reglas_clave)}, 
          ${JSON.stringify(docDestilado.comandos_terminal)}
        )
        RETURNING id;
      `;
      if (insertRes.length > 0) {
        docDestilado.id = insertRes[0].id;
      }
    } catch (dbErr) {
      console.warn("[KNOWLEDGE DB FALLBACK A MEMORIA]:", dbErr);
      docDestilado.id = `mem-${Date.now()}`;
      IN_MEMORY_KNOWLEDGE_STORE.unshift(docDestilado);
    }

    return NextResponse.json({
      success: true,
      mensaje: "Documento técnico destilado exitosamente. Se filtraron saludos y párrafos decorativos.",
      documento: docDestilado,
      metricas: {
        caracteres_originales: contenido.length,
        caracteres_destilados: docDestilado.resumen_destilado.length,
        reduccion_porcentual: `${Math.max(0, Math.round((1 - docDestilado.resumen_destilado.length / contenido.length) * 100))}%`,
        reglas_extraidas: docDestilado.reglas_clave.length,
        comandos_extraidos: docDestilado.comandos_terminal.length,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al procesar destilación de conocimiento";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
