/**
/**
 * Utilitario de limpieza de texto para mensajes de chat en Nora ISP
 * Remueve de forma consistente y universal marcas crudas de Markdown
 * (asteriscos, numerales de encabezados, backticks, viñetas pesadas)
 * preservando saltos de línea naturales y formato legible para operadores y clientes.
 */
export function cleanMessageText(text: string | null | undefined): string {
  if (!text) return "";

  return text
    // 1. Eliminar bloques de código de triple backtick preservando el contenido interno
    .replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, "$1")
    // 2. Eliminar backticks simples o dobles
    .replace(/`{1,2}([^`]+)`{1,2}/g, "$1")
    .replace(/`/g, "")
    // 3. Eliminar negritas, cursivas y asteriscos simples o dobles
    .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
    .replace(/\*/g, "")
    // 4. Eliminar encabezados Markdown (#, ##, ###, etc.)
    .replace(/^#{1,6}\s+/gm, "")
    // 5. Eliminar subrayados de formato Markdown tipo __texto__ o _texto_
    .replace(/_{1,2}(.*?)_{1,2}/g, "$1")
    // 6. Normalizar viñetas con asterisco/más a guión limpio con espacio
    .replace(/^[\*\+]\s+/gm, "- ")
    // 7. Normalizar espacios múltiples horizontales manteniendo los saltos de línea
    .replace(/[ \t]+/g, " ")
    // 8. Limpiar saltos de línea excesivos (más de 2 consecutivos a 2)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

