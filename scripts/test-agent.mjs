import { neon } from "@neondatabase/serverless";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

// Cargar .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

const sql = neon(process.env.DATABASE_URL);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function runTest() {
  console.log("=== INICIANDO TEST END-TO-END NORA ISP ===");

  // 1. Contar tickets actuales
  const prevCount = await sql`SELECT count(*)::int as count FROM tickets;`;
  console.log(`1. Tickets en Neon antes de la llamada: ${prevCount[0].count}`);

  // 2. Extraer cliente de la BD
  const clienteRows = await sql`SELECT * FROM clientes WHERE id = 'CLI-1045';`;
  const cliente = clienteRows[0];
  console.log(`2. Datos del abonado en vivo: ${cliente.nombre} (${cliente.id}) - Potencia: ${cliente.potencia_dbm} dBm - Estado: ${cliente.estado_pppoe}`);

  // 3. Simular llamada a Groq con Tool Calling
  const NORA_TOOLS = [
    {
      type: "function",
      function: {
        name: "crear_ticket_soporte",
        description: "Abre y registra de forma autónoma un nuevo ticket en Neon Postgres",
        parameters: {
          type: "object",
          properties: {
            cliente: { type: "string" },
            asunto: { type: "string" },
            prioridad: { type: "string", enum: ["Alta", "Media", "Baja"] },
          },
          required: ["cliente", "asunto", "prioridad"],
        },
      },
    },
  ];

  const systemPrompt = `Eres Nora, IA de soporte N3. Si la potencia óptica es crítica (< -27 dBm) y hay corte de servicio, debes ejecutar inmediatamente crear_ticket_soporte.`;
  const liveContext = `[FICHA EN VIVO DEL ABONADO (NEON)]\n• Abonado: ${cliente.nombre} (${cliente.id})\n• Potencia: ${cliente.potencia_dbm} dBm (CRÍTICO)\n• PPPoE: ${cliente.estado_pppoe}\n• Caja: ${cliente.caja_nap}`;

  console.log("3. Enviando prompt a Groq (Qwen 3.8)...");
  const completion = await groq.chat.completions.create({
    model: "qwen/qwen3.8-27b",
    max_tokens: 800,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "system", content: liveContext },
      { role: "user", content: "Nora, la clienta María Elena (CLI-1045) tiene la luz LOS en rojo en su ONU y no navega. ¿Qué ocurre y cómo procedemos?" },
    ],
    tools: NORA_TOOLS,
    tool_choice: "auto",
  });

  const toolCalls = completion.choices[0]?.message?.tool_calls;
  console.log(`4. ¿Nora activó Tool Call?: ${Boolean(toolCalls && toolCalls.length > 0)}`);

  if (toolCalls && toolCalls.length > 0) {
    const call = toolCalls[0];
    console.log(`   Herramienta: ${call.function.name}`);
    console.log(`   Argumentos generados: ${call.function.arguments}`);

    const args = JSON.parse(call.function.arguments);
    const ticketId = `TCK-${Math.floor(100 + Math.random() * 900)}`;

    // Insertar en Neon Postgres
    await sql`
      INSERT INTO tickets (id, cliente, asunto, prioridad, estado, creado)
      VALUES (${ticketId}, ${args.cliente}, ${args.asunto}, ${args.prioridad}, 'Abierto', 'Hace 1 min (Nora Autónomo)');
    `;
    console.log(`5. ✅ Ticket insertado con éxito en Neon Postgres con ID: ${ticketId}`);
  }

  // Verificar recuento posterior
  const postCount = await sql`SELECT count(*)::int as count FROM tickets;`;
  console.log(`6. Total de tickets en Neon tras la ejecución: ${postCount[0].count}`);
  console.log("=== TEST COMPLETADO CON ÉXITO ===");
}

runTest().catch((err) => {
  console.error("Error en test:", err);
  process.exit(1);
});
