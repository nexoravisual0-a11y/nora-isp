import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { groq } from "@/lib/groq";

export const dynamic = "force-dynamic";

export interface ReglaDestilada {
  parametro: string;
  valor_o_umbral: string;
  severidad?: "info" | "advertencia" | "critico";
}

export interface ProcedimientoWiki {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  created_at?: string;
}

/**
 * Filtro determinístico de destilación de conocimiento.
 * Extrae reglas duras, umbrales dBm/Mbps, comandos CLI y pares clave-valor/problema-solución,
 * desechando párrafos decorativos, introducciones o saludos.
 */
export function destilarConocimientoHeuristico(texto: string): {
  resumen_destilado: string;
  reglas_clave: ReglaDestilada[];
  comandos_terminal: string[];
  keywords: string[];
} {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const reglas_clave: ReglaDestilada[] = [];
  const comandos_terminal: string[] = [];
  const bulletsDestilados: string[] = [];
  const keywordsSet = new Set<string>();

  // Expresiones regulares para patrones técnicos
  const regexComandoCLI = /^(\/|\$|>|#|(interface|display|config|show|ip|vlan|gpon|ont|olt|snmp|ping|traceroute))\b/i;
  const regexUmbral = /(<=?|>=?|>|<|=|:)\s*-?\d+(\.\d+)?\s*(dbm|db|mbps|gbps|ms|v|a|w|nm|ghz|mhz|km|m)\b/i;
  const regexClaveValor = /^([A-ZÁÉÍÓÚa-záéíóú0-9_\-\s]{3,35})\s*[:=]\s*([^\n\r]+)$/;
  const regexFiltroRuido = /^(bienvenidos|hola|estimados|este manual|en este documento|el presente documento|a continuación|introducción|resumen general|índice|conclusión|muchas gracias)/i;

  const palabrasClaveCandidatas = [
    "ont", "huawei", "zte", "fiberhome", "bridge", "router", "vlan", "gpon", "pppoe", 
    "dbm", "atenuacion", "potencia", "sc/apc", "nap", "splitter", "drop", "fibra", 
    "corte", "reconexion", "promesa de pago", "moroso", "facturacion", "mikrotik"
  ];

  for (const kw of palabrasClaveCandidatas) {
    if (texto.toLowerCase().includes(kw)) {
      keywordsSet.add(kw);
    }
  }

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

    // Detectar pares clave-valor concisos (Problema / Solución / Regla)
    const matchKV = linea.match(regexClaveValor);
    if (matchKV && matchKV[1].length < 35 && matchKV[2].length < 160) {
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

    // Directiva técnica corta
    if (
      linea.length <= 160 &&
      /\b(dbm|ont|onu|olt|nap|splitter|pppoe|fibra|vlan|gpon|sc\/apc|otdr|potencia|atenuación|conector|limpieza)\b/i.test(linea)
    ) {
      bulletsDestilados.push(`• ${linea.replace(/^[-*•]\s*/, "").trim()}`);
    }
  }

  const resumen_destilado = bulletsDestilados.join("\n") || texto.slice(0, 500);

  return {
    resumen_destilado,
    reglas_clave,
    comandos_terminal,
    keywords: Array.from(keywordsSet),
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
            "Eres un compilador y destilador técnico de telecomunicaciones ISP. Extrae EXCLUSIVAMENTE reglas duras, procedimientos paso a paso, pares Problema-Solución, umbrales ópticos/eléctricos (dBm, ms, Mbps) y comandos exactos de consola. Elimina toda introducción, saludo, texto decorativo o explicativo. Responde ÚNICAMENTE en viñetas estructuradas.",
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
 * Búsqueda de fragmentos y procedimientos por coincidencia de texto/keywords en la tabla 'isp_knowledge'
 * Parámetros opcionales: ?q=ont+bridge o ?category=Configuración
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();
    const category = (searchParams.get("category") || "").trim();

    let articulos: any[] = [];

    if (query) {
      const searchPattern = `%${query}%`;
      // Búsqueda en title, content o matriz de keywords
      articulos = await sql`
        SELECT id, category, title, content, keywords, created_at
        FROM isp_knowledge
        WHERE 
          title ILIKE ${searchPattern}
          OR content ILIKE ${searchPattern}
          OR category ILIKE ${searchPattern}
          OR ${query.toLowerCase()} = ANY(keywords)
        ORDER BY created_at DESC
        LIMIT 20;
      `;
    } else if (category) {
      articulos = await sql`
        SELECT id, category, title, content, keywords, created_at
        FROM isp_knowledge
        WHERE category ILIKE ${'%' + category + '%'}
        ORDER BY created_at DESC
        LIMIT 20;
      `;
    } else {
      articulos = await sql`
        SELECT id, category, title, content, keywords, created_at
        FROM isp_knowledge
        ORDER BY created_at DESC
        LIMIT 20;
      `;
    }

    return NextResponse.json({
      success: true,
      total: articulos.length,
      documentos: articulos,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al consultar la base de conocimiento";
    return NextResponse.json({ success: false, error: errorMsg, documentos: [] }, { status: 500 });
  }
}

/**
 * POST /api/knowledge
 * Ingesta de procedimientos de la Wiki que limpia texto decorativo y persiste
 * pares problema/solución estructurados y palabras clave en 'isp_knowledge'.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      titulo,
      title = titulo || "Procedimiento Operativo",
      categoria,
      category = categoria || "General",
      contenido,
      content = contenido,
      keywords = [],
    } = body;

    const rawContent = String(content || "").trim();

    if (!rawContent) {
      return NextResponse.json(
        { error: "El campo 'content' o 'contenido' es obligatorio y debe contener texto técnico." },
        { status: 400 }
      );
    }

    // 1. Destilación de conocimiento (eliminar ruido decorativo y extraer pares técnicos)
    const heuristica = destilarConocimientoHeuristico(rawContent);

    let contenidoDestilado = heuristica.resumen_destilado;
    if (rawContent.length > 500) {
      const resumenIA = await destilarConIA(rawContent);
      if (resumenIA && resumenIA.trim().length > 0) {
        contenidoDestilado = resumenIA.trim();
      }
    }

    // Combinar keywords enviadas con las detectadas
    const combinedKeywords = Array.from(
      new Set([
        ...(Array.isArray(keywords) ? keywords.map((k: string) => String(k).toLowerCase().trim()) : []),
        ...heuristica.keywords,
      ])
    ).filter(Boolean);

    // 2. Persistencia en la tabla 'isp_knowledge'
    const insertRes = await sql`
      INSERT INTO isp_knowledge (category, title, content, keywords)
      VALUES (
        ${String(category).trim()}, 
        ${String(title).trim()}, 
        ${contenidoDestilado}, 
        ${combinedKeywords}
      )
      RETURNING id, category, title, content, keywords, created_at;
    `;

    const savedDoc = insertRes[0];

    return NextResponse.json({
      success: true,
      mensaje: "Procedimiento de la Wiki destilado y persistido exitosamente en isp_knowledge.",
      documento: savedDoc,
      metricas: {
        caracteres_originales: rawContent.length,
        caracteres_destilados: contenidoDestilado.length,
        reduccion_porcentual: `${Math.max(0, Math.round((1 - contenidoDestilado.length / rawContent.length) * 100))}%`,
        reglas_extraidas: heuristica.reglas_clave.length,
        comandos_extraidos: heuristica.comandos_terminal.length,
        keywords: combinedKeywords,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al procesar la ingesta en la Wiki";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
