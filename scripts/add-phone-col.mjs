import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
const content = fs.readFileSync(envPath, "utf-8");
let dbUrl = "";
for (const line of content.split("\n")) {
  const t = line.trim();
  if (t.startsWith("DATABASE_URL=")) {
    dbUrl = t.split("=")[1].trim().replace(/^["']|["']$/g, "");
  }
}

const sql = neon(dbUrl);

async function run() {
  await sql`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);`;
  await sql`UPDATE clientes SET telefono = '5491123456789' WHERE id = 'CLI-1045';`;
  await sql`UPDATE clientes SET telefono = '5491198765432' WHERE id = 'CLI-1029';`;
  await sql`UPDATE clientes SET telefono = '5491155554444' WHERE id = 'CLI-1088';`;

  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'clientes';
  `;
  console.log("Columnas actuales en clientes:", cols.map((c) => c.column_name).join(", "));
  const sample = await sql`SELECT id, nombre, telefono FROM clientes;`;
  console.log("Abonados con teléfono asignado:", sample);
}

run().catch(console.error);
