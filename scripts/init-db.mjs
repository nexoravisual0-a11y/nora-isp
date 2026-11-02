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

  // Tablas existentes del MVP (clientes, nodos, tickets)
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
      telefono VARCHAR(50),
      dni VARCHAR(50),
      domicilio VARCHAR(255),
      correo VARCHAR(100),
      condicion_fiscal VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✅ Tabla 'clientes' verificada.");

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

  // =========================================================================
  // BLOQUE 1: Persistencia y Shadow DB en Neon Postgres
  // =========================================================================
  console.log("📦 Verificando y creando tablas de Shadow DB y Contingencia...");

  // 1. isp_customers
  await sql`
    CREATE TABLE IF NOT EXISTS isp_customers (
      id_ispcube VARCHAR(100) PRIMARY KEY,
      dni VARCHAR(50),
      nombre VARCHAR(255) NOT NULL,
      direccion TEXT,
      estado VARCHAR(50) DEFAULT 'Activo',
      saldo NUMERIC(12, 2) DEFAULT 0.00,
      lat FLOAT,
      lng FLOAT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✅ Tabla 'isp_customers' verificada.");

  // 2. isp_services
  await sql`
    CREATE TABLE IF NOT EXISTS isp_services (
      id_ispcube VARCHAR(100) PRIMARY KEY,
      customer_id VARCHAR(100) REFERENCES isp_customers(id_ispcube) ON DELETE CASCADE,
      ip VARCHAR(50),
      mac_cpe VARCHAR(50),
      plan VARCHAR(150),
      nodo VARCHAR(100),
      nap_puerto VARCHAR(100),
      rx_power FLOAT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✅ Tabla 'isp_services' verificada.");

  // 3. isp_tickets
  await sql`
    CREATE TABLE IF NOT EXISTS isp_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      id_ispcube VARCHAR(100),
      customer_id VARCHAR(100),
      tecnico_id VARCHAR(100),
      estado VARCHAR(50) DEFAULT 'Abierto',
      tipo VARCHAR(100) DEFAULT 'Incidencia Técnica',
      notas TEXT,
      synced BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✅ Tabla 'isp_tickets' verificada.");

  // 4. sync_queue
  await sql`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity VARCHAR(100) NOT NULL,
      action VARCHAR(50) NOT NULL,
      payload JSONB NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      retries INT DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✅ Tabla 'sync_queue' verificada.");

  // 5. internal_messages
  await sql`
    CREATE TABLE IF NOT EXISTS internal_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id VARCHAR(100) NOT NULL,
      role VARCHAR(50) NOT NULL,
      ticket_id VARCHAR(100),
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✅ Tabla 'internal_messages' verificada.");

  // 6. isp_knowledge
  await sql`
    CREATE TABLE IF NOT EXISTS isp_knowledge (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      keywords TEXT[] DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✅ Tabla 'isp_knowledge' verificada.");

  // Índices B-Tree y GIN
  console.log("⚡ Configurando índices B-Tree y GIN...");
  await sql`
    CREATE INDEX IF NOT EXISTS idx_isp_customers_dni ON isp_customers(dni);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_isp_knowledge_keywords ON isp_knowledge USING GIN(keywords);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  `;
  console.log("✅ Índices optimizados verificados.");

  // Insertar registros semilla en isp_knowledge
  const countKnowledge = await sql`SELECT count(*)::int as count FROM isp_knowledge;`;
  if (countKnowledge[0].count === 0) {
    console.log("🌱 Insertando procedimientos técnicos semilla en 'isp_knowledge'...");

    await sql`
      INSERT INTO isp_knowledge (category, title, content, keywords)
      VALUES
        (
          'Configuración ONT',
          'Configuración ONT ZTE/Huawei en modo Bridge',
          'Procedimiento oficial para configurar ONT Huawei (HG8245 / EG8145) y ZTE (F670L / F6600) en modo Bridge:\n1. Acceder a la interfaz web (192.168.1.1 o 192.168.100.1) con credenciales admin de planta externa.\n2. Ir a Network / WAN Connection y crear nueva interfaz WAN de tipo Bridge.\n3. Asignar VLAN Tag 100 con 802.1p en prioridad 0.\n4. Deshabilitar DHCP Server y NAT en la ONT.\n5. En Port Binding, asociar la WAN Bridge al puerto LAN1 o LAN4 según la topología del cliente.\n6. Verificar que la sesión PPPoE o IP fija se levante directamente desde el router neutro o MikroTik del abonado.',
          ARRAY['ont', 'huawei', 'zte', 'bridge', 'vlan 100', 'gpon', 'lan1', 'pppoe']
        ),
        (
          'Fibra y Planta Externa',
          'Protocolo ante potencia óptica degradada (< -27 dBm)',
          'Protocolo técnico de intervención ante alarma de señal óptica atenuada (< -27 dBm):\n1. Medir con Optical Power Meter (OPM) calibrado en 1490 nm directamente en el conector de la roseta o drop del abonado.\n2. Si la potencia es < -27 dBm, limpiar el conector SC/APC verde utilizando casete limpiador con cinta libre de pelusa y alcohol isopropílico al 99%.\n3. Inspeccionar el conector con microscopio de fibra o verificar que no existan fracturas en la férula cerámica.\n4. Si la potencia continúa degradada, acudir a la caja NAP asignada y medir el puerto del splitter (1x8 o 1x16). Si en la NAP la potencia es óptima (-18 a -22 dBm), reemplazar o reensamblar el conector mecánico del tramo de acometida drop.\n5. Si el splitter de la NAP mide < -26 dBm, derivar inmediatamente a cuadrilla de empalme troncal para revisión del sangrado de fibra.',
          ARRAY['potencia', 'atenuacion', 'sc/apc', 'dbm', 'power meter', 'nap', 'splitter', 'drop', 'limpieza', 'corte']
        ),
        (
          'Facturación y Soporte',
          'Política de reconexión temporal por promesa de pago comercial',
          'Directiva comercial y técnica para reconexión temporal de clientes con corte administrativo:\n1. Aplica exclusivamente para abonados con estado "Moroso" que no registren más de 2 facturas vencidas consecutivas.\n2. El cliente o el agente debe confirmar un compromiso de pago dentro de un plazo perentorio máximo de 48 a 72 horas hábiles.\n3. Habilitar la sesión PPPoE en el MikroTik / ISPCube asignándole el perfil temporal "Plan_Promesa_Pago" o restaurando el servicio a velocidad nominal.\n4. La apertura de tickets técnicos queda restringida durante la promesa de pago, a menos que se detecte una falla óptica física en la OLT/NAP (< -27 dBm o corte de acometida).\n5. Si el pago no impacta en 72 horas hábiles, el sistema bloqueará la navegación de forma automática redirigiendo al portal cautivo de cobranzas.',
          ARRAY['reconexion', 'promesa de pago', 'moroso', 'cobranzas', 'facturacion', 'pppoe', 'suspension']
        );
    `;
    console.log("Procedimientos técnicos iniciales sembrados en isp_knowledge.");
  } else {
    console.log("La tabla isp_knowledge ya contiene " + countKnowledge[0].count + " articulos tecnicos.");
  }

  // Insertar clientes y servicios semilla en Shadow DB si está vacía
  const countShadowCust = await sql`SELECT count(*)::int as count FROM isp_customers;`;
  if (countShadowCust[0].count === 0) {
    console.log("🌱 Insertando datos semilla en Shadow DB ('isp_customers' e 'isp_services')...");

    await sql`
      INSERT INTO isp_customers (id_ispcube, dni, nombre, direccion, estado, saldo, lat, lng)
      VALUES
        ('1029', '32109845', 'Juan Carlos Gómez', 'Calle Las Heras 320, Ituzaingó', 'Activo', 0.00, -27.5891, -56.6812),
        ('1045', '28456123', 'María Elena Rostagno', 'Av. San Martín 840, Ituzaingó', 'Activo', 0.00, -27.5924, -56.6845),
        ('1088', '30712345678', 'Transportes & Logística S.A.', 'Ruta 9 Km 4, Parque Industrial', 'Moroso', 45000.00, -27.6011, -56.6923)
      ON CONFLICT DO NOTHING;
    `;

    await sql`
      INSERT INTO isp_services (id_ispcube, customer_id, ip, mac_cpe, plan, nodo, nap_puerto, rx_power)
      VALUES
        ('SRV-1029', '1029', '100.64.12.44', '48:57:02:AB:12:34', 'Fibra 300 Mbps Simétrico', 'OLT-01', 'NAP-02 / Puerto 4', -19.4),
        ('SRV-1045', '1045', '100.64.14.89', 'E0:67:B3:CD:56:78', 'Fibra 100 Mbps Residencial', 'OLT-02', 'NAP-04 / Puerto 11', -31.2),
        ('SRV-1088', '1088', '181.45.22.10', '00:1A:2B:EF:90:12', 'Fibra Corporativa 500 Mbps + IP Fija', 'OLT-01', 'NAP-01 / Puerto 2', -17.8)
      ON CONFLICT DO NOTHING;
    `;
    console.log("✅ Shadow DB poblada con clientes y servicios iniciales.");
  }

  // Insertar datos iniciales si la tabla legacy clientes está vacía
  const countClientes = await sql`SELECT count(*)::int as count FROM clientes;`;
  if (countClientes[0].count === 0) {
    console.log("🌱 Insertando datos iniciales en tabla legacy 'clientes'...");
    await sql`
      INSERT INTO clientes (id, nombre, plan, ip_pppoe, estado_pppoe, estado_facturacion, olt_conectada, caja_nap, potencia_dbm, dni, telefono, domicilio)
      VALUES
        ('CLI-1029', 'Juan Carlos Gómez', 'Fibra 300 Mbps Simétrico', '100.64.12.44', 'Conectado', 'Al día', 'OLT-HUAWEI-01 (Pon 1/2)', 'NAP-02 (Barrio Norte)', -19.4, '32109845', '3786414533', 'Calle Las Heras 320'),
        ('CLI-1045', 'María Elena Rostagno', 'Fibra 100 Mbps Residencial', '100.64.14.89', 'Desconectado', 'Al día', 'OLT-FIBERHOME-02 (Pon 2/4)', 'NAP-04 (Barrio Centro)', -31.2, '28456123', '3786419988', 'Av. San Martín 840'),
        ('CLI-1088', 'Transportes & Logística S.A.', 'Fibra Corporativa 500 Mbps + IP Fija', '181.45.22.10', 'Conectado', 'Moroso', 'OLT-HUAWEI-01 (Pon 1/1)', 'NAP-01 (Parque Industrial)', -17.8, '30712345678', '3786450011', 'Ruta 9 Km 4')
      ON CONFLICT DO NOTHING;
    `;
  }

  console.log("🎉 Inicialización y sincronización Shadow DB completada con éxito en Neon!");
}

main().catch((err) => {
  console.error("❌ Error inicializando base de datos:", err);
  process.exit(1);
});
