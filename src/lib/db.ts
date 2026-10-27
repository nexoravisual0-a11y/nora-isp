import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL no está definida en las variables de entorno.");
}

export const sql = neon(process.env.DATABASE_URL || "");
