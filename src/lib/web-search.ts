/**
 * Módulo de Búsqueda Web Técnica Liviana para Nora ISP / Caralita Copilot
 * Realiza consultas autónomas a fuentes abiertas (DuckDuckGo HTML Lite) sin requerir claves de API
 * para resolver consultas sobre equipos nuevos, contraseñas de fábrica, manuales y comandos de red.
 */

export async function searchWebTechnical(query: string): Promise<string> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return "";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5500); // 5.5s timeout de resguardo

  try {
    // 1. Intentar primero con la API de Instant Answer de DuckDuckGo (rápida y estructurada)
    const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`;
    const apiRes = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoraISP/2.6 TechnicalBot",
      },
    });

    if (apiRes.ok) {
      const data = await apiRes.json().catch(() => null);
      if (data) {
        const snippets: string[] = [];
        if (data.AbstractText) {
          snippets.push(`[Resumen Principal]: ${data.AbstractText}`);
        }
        if (Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics.slice(0, 3)) {
            if (topic.Text) {
              snippets.push(`- ${topic.Text}`);
            }
          }
        }
        if (snippets.length > 0) {
          clearTimeout(timeoutId);
          return snippets.join("\n").slice(0, 1500);
        }
      }
    }

    // 2. Fallback a DuckDuckGo HTML Lite para extracción de snippets orgánicos
    const htmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
    const htmlRes = await fetch(htmlUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    clearTimeout(timeoutId);

    if (!htmlRes.ok) {
      return "";
    }

    const html = await htmlRes.text();

    // Extracción regex liviana de snippets en el markup de DuckDuckGo Lite
    // Clase típica: result__snippet o result__body
    const snippetMatches = html.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi) ||
                           html.match(/<td class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi);

    if (snippetMatches && snippetMatches.length > 0) {
      const cleanSnippets = snippetMatches.slice(0, 3).map((raw) => {
        return raw
          .replace(/<[^>]+>/g, " ") // quitar tags html
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s+/g, " ")
          .trim();
      }).filter((s) => s.length > 20);

      if (cleanSnippets.length > 0) {
        return cleanSnippets.join("\n\n").slice(0, 2000);
      }
    }

    return "";
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    // Manejo de fallo con gracia: devolver cadena vacía sin interrumpir el flujo del chat
    console.warn(`[searchWebTechnical]: No se pudo completar búsqueda para "${cleanQuery}":`, err instanceof Error ? err.message : String(err));
    return "";
  }
}

