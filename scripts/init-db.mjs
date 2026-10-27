import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

// Cargar .env.local manualmente para el script
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

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ Error: DATABASE_URL no encontrada en .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

async function main() {
  console.log("🚀 Conectando a Neon Serverless Postgres...");
  
  // Probar conexión básica
  const version = await sql`SELECT version();`;
  console.log("✅ Conexión exitosa a PostgreSQL!");
  console.log("Versión:", version[0].version.split(",")[0]);

  // 1. Crear tabla clientes
  await sql`
    CREATE TABLE IF NOT EXISTS clientes (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      plan VARCHAR(100) NOT NULL,
      ip_pppoe VARCHAR(50),
      estado_pppoe VARCHAR(50) DEFAULT 'Desconectado',
      estado_facturacion VARCHAR(50) DEFAULT 'Al día',
      olt_conectada VARCHAR(100),
      caja_nap VARCHAR(100),
      potencia_dbm NUMERIC(5, 2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✅ Tabla 'clientes' verificada.");

  // 2. Crear tabla nodos
  await sql`
    CREATE TABLE IF NOT EXISTS nodos (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      tipo VARCHAR(50) NOT NULL,
      ubicacion VARCHAR(255),
      estado VARCHAR(50) DEFAULT 'Online',
      potencia_salida_dbm NUMERIC(5, 2),
      puertos_ocupados INT DEFAULT 0,
      puertos_totales INT DEFAULT 0,
      atenuacion_promedio VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✅ Tabla 'nodos' verificada.");

  // 3. Crear tabla tickets
  await sql`
    CREATE TABLE IF NOT EXISTS tickets (
      id VARCHAR(50) PRIMARY KEY,
      cliente VARCHAR(255) NOT NULL,
      asunto VARCHAR(255) NOT NULL,
      prioridad VARCHAR(50) DEFAULT 'Media',
      estado VARCHAR(50) DEFAULT 'Abierto',
      creado VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✅ Tabla 'tickets' verificada.");

  // Insertar datos iniciales si la tabla clientes está vacía
  const countClientes = await sql`SELECT count(*)::int as count FROM clientes;`;
  if (countClientes[0].count === 0) {
    console.log("🌱 Insertando datos iniciales de Nora ISP...");

    await sql`
      INSERT INTO clientes (id, nombre, plan, ip_pppoe, estado_pppoe, estado_facturacion, olt_conectada, caja_nap, potencia_dbm)
      VALUES
        ('CLI-1029', 'Juan Carlos Gómez', 'Fibra 300 Mbps Simétrico', '100.64.12.44', 'Conectado', 'Al día', 'OLT-HUAWEI-01 (Pon 1/2)', 'NAP-02 (Barrio Norte)', -19.4),
        ('CLI-1045', 'María Elena Rostagno', 'Fibra 100 Mbps Residencial', '100.64.14.89', 'Desconectado', 'Al día', 'OLT-FIBERHOME-02 (Pon 2/4)', 'NAP-04 (Barrio Centro)', -31.2),
        ('CLI-1088', 'Transportes & Logística S.A.', 'Fibra Corporativa 500 Mbps + IP Fija', '181.45.22.10', 'Conectado', 'Moroso', 'OLT-HUAWEI-01 (Pon 1/1)', 'NAP-01 (Parque Industrial)', -17.8)
      ON CONFLICT DO NOTHING;
    `;

    await sql`
      INSERT INTO nodos (id, nombre, tipo, ubicacion, estado, potencia_salida_dbm, puertos_ocupados, puertos_totales, atenuacion_promedio)
      VALUES
        ('OLT-01', 'OLT Principal Huawei SmartAX EA5800', 'OLT', 'DataCenter Central - Rack A3', 'Online', 5.2, 14, 16, '0.35 dB/km'),
        ('OLT-02', 'OLT Secundaria FiberHome AN5516-04', 'OLT', 'Subestación Nodo Oeste', 'Online', 4.8, 6, 8, '0.38 dB/km'),
        ('NAP-04', 'Caja NAP-04 Splitter 1x16', 'NAP', 'Av. San Martín 840 (Barrio Centro)', 'Critical', -30.5, 15, 16, 'Atenuación excesiva (> 30 dB)'),
        ('NAP-02', 'Caja NAP-02 Splitter 1x8', 'NAP', 'Calle Las Heras 320 (Barrio Norte)', 'Online', -18.9, 7, 8, 'Atenuación normal (18.5 dB)'),
        ('NAP-01', 'Caja NAP-01 Splitter 1x8 Balanceado', 'NAP', 'Ruta 9 Km 4 - Parque Industrial', 'Online', -17.2, 6, 8, 'Atenuación óptima')
      ON CONFLICT DO NOTHING;
    `;

    await sql`
      INSERT INTO tickets (id, cliente, asunto, prioridad, estado, creado)
      VALUES
        ('TCK-801', 'María Elena Rostagno', 'Pérdida de señal de fibra / LED LOS en rojo en la ONU', 'Alta', 'Abierto', 'Hace 24 min'),
        ('TCK-794', 'Transportes & Logística S.A.', 'Aviso de suspensión por mora de factura vencida marzo', 'Media', 'En Proceso', 'Hace 2 horas'),
        ('TCK-780', 'Juan Carlos Gómez', 'Solicitud de upgrade de plan a 600 Mbps', 'Baja', 'Abierto', 'Ayer')
      ON CONFLICT DO NOTHING;
    `;
    console.log("✅ Datos iniciales cargados en Neon.");
  } else {
    console.log(`ℹ️ La base de datos ya contiene ${countClientes[0].count} clientes.`);
  }

  console.log("🎉 Inicialización completada con éxito en Neon!");
}

main().catch((err) => {
  console.error("❌ Error inicializando base de datos:", err);
  process.exit(1);
});
