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

  // 7. system_feedback_telemetry
  await sql`
    CREATE TABLE IF NOT EXISTS system_feedback_telemetry (
      id SERIAL PRIMARY KEY,
      user_role TEXT DEFAULT 'operador',
      screen_path TEXT,
      issue_description TEXT NOT NULL,
      technical_details JSONB DEFAULT '{}'::jsonb,
      status TEXT DEFAULT 'pending_review',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log("✅ Tabla 'system_feedback_telemetry' verificada.");

  // 8. isp_commercial_plans
  await sql`
    CREATE TABLE IF NOT EXISTS isp_commercial_plans (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      badge TEXT,
      description TEXT NOT NULL,
      features JSONB NOT NULL DEFAULT '[]'::jsonb,
      cta_text TEXT NOT NULL,
      cta_action TEXT NOT NULL DEFAULT 'contacto',
      display_order INT DEFAULT 1,
      is_active BOOLEAN DEFAULT true,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log("✅ Tabla 'isp_commercial_plans' verificada.");

  // Si está vacía, sembramos los 3 planes por defecto
  const countPlans = await sql`SELECT count(*)::int as count FROM isp_commercial_plans;`;
  if (countPlans[0].count === 0) {
    console.log("🌱 Sembrando planes comerciales semilla en 'isp_commercial_plans'...");
    await sql`
      INSERT INTO isp_commercial_plans (category, title, badge, description, features, cta_text, cta_action, display_order, is_active)
      VALUES
        (
          'residencial',
          'Internet Fibra Residencial',
          NULL,
          'Velocidades simétricas para gaming competitivo, streaming 4K y teletrabajo sin microcortes por atenuación.',
          '["Planes de 100, 300, 600 Mbps y 1 Gbps", "Módem ONU Dual Band WiFi 6 Gigabit", "Autogestión y soporte instantáneo vía Caralita"]'::jsonb,
          'Consultar Cobertura Barrial',
          'cobertura',
          1,
          true
        ),
        (
          'b2b',
          'Enlaces Dedicados B2B',
          'Misión Crítica',
          'Canales 1:1 no compartidos para corporaciones, industrias y entidades financieras con disponibilidad auditada.',
          '["SLA Garantizado del 99.8% por contrato", "Pool de IPs Públicas Fijas y BGP Multi-homing", "Ejecutivo de cuentas técnico y guardia NOC prioritaria"]'::jsonb,
          'Solicitar Propuesta Corporativa',
          'corporativo',
          2,
          true
        ),
        (
          'mayorista',
          'Transporte & Mayorista',
          NULL,
          'Interconexión de fibra oscura, lambdas protegidas y capacidad de tránsito IP para operadores de red y cooperativas.',
          '["Puertos 10G y 100G en anillo metropolitano", "Interconexión directa en CABASE / IXP Buenos Aires", "Rutas redundantes de fibra y bypass DWDM"]'::jsonb,
          'Contactar Ingeniería Carrier',
          'carrier',
          3,
          true
        );
    `;
    console.log("✅ Planes comerciales iniciales sembrados con éxito.");
  }

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

  // =========================================================================
  // BLOQUE: WhatsApp Inbox & Mesa de Entrada Unificada con Human Handoff
  // =========================================================================
  console.log("📱 Verificando y creando tablas de WhatsApp Inbox...");
  await sql`
    CREATE TABLE IF NOT EXISTS whatsapp_threads (
      id SERIAL PRIMARY KEY,
      phone_number VARCHAR(30) UNIQUE NOT NULL,
      customer_name VARCHAR(120),
      dni_cuit VARCHAR(20),
      status VARCHAR(30) DEFAULT 'bot_active',
      assigned_operator VARCHAR(60),
      unread_count INT DEFAULT 0,
      last_message_preview TEXT,
      last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log("✅ Tabla 'whatsapp_threads' verificada.");

  await sql`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id SERIAL PRIMARY KEY,
      thread_id INT REFERENCES whatsapp_threads(id) ON DELETE CASCADE,
      sender_type VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      media_url TEXT,
      external_message_id VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log("✅ Tabla 'whatsapp_messages' verificada.");

  await sql`
    CREATE INDEX IF NOT EXISTS idx_wa_threads_status ON whatsapp_threads(status);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_wa_messages_thread ON whatsapp_messages(thread_id);
  `;
  console.log("✅ Índices de WhatsApp Inbox verificados.");

  // Sembrar 2 conversaciones de prueba si está vacía
  const countThreads = await sql`SELECT count(*)::int as count FROM whatsapp_threads;`;
  if (countThreads[0].count === 0) {
    console.log("🌱 Sembrando conversaciones de prueba en WhatsApp Inbox...");
    
    // Thread 1: bot_active (Juan Carlos Gómez)
    const thread1 = await sql`
      INSERT INTO whatsapp_threads (
        phone_number, 
        customer_name, 
        dni_cuit, 
        status, 
        unread_count, 
        last_message_preview, 
        last_activity
      )
      VALUES (
        '+5493786414533', 
        'Juan Carlos Gómez', 
        '32109845', 
        'bot_active', 
        0, 
        'Tu módem ONU registra -19.4 dBm (potencia óptima). Navegación simétrica normal.',
        NOW() - INTERVAL '12 minutes'
      )
      RETURNING id;
    `;
    const t1Id = thread1[0].id;

    await sql`
      INSERT INTO whatsapp_messages (thread_id, sender_type, content, created_at)
      VALUES 
        (${t1Id}, 'customer', 'Hola buenas tardes, quería consultar el estado de mi conexión de fibra.', NOW() - INTERVAL '15 minutes'),
        (${t1Id}, 'bot', '¡Hola Juan Carlos! 👋 Te asiste Caralita. He auditado tu módem ONU en la Base de Datos Central. Registras -19.4 dBm (potencia óptima) y tu sesión PPPoE está Conectada.', NOW() - INTERVAL '12 minutes');
    `;

    // Thread 2: requires_human (María Elena Rostagno)
    const thread2 = await sql`
      INSERT INTO whatsapp_threads (
        phone_number, 
        customer_name, 
        dni_cuit, 
        status, 
        unread_count, 
        last_message_preview, 
        last_activity
      )
      VALUES (
        '+5493786419988', 
        'María Elena Rostagno', 
        '28456123', 
        'requires_human', 
        2, 
        'Se cayó la rama de un árbol sobre el cable de fibra de la entrada y quedó colgando.',
        NOW() - INTERVAL '3 minutes'
      )
      RETURNING id;
    `;
    const t2Id = thread2[0].id;

    await sql`
      INSERT INTO whatsapp_messages (thread_id, sender_type, content, created_at)
      VALUES 
        (${t2Id}, 'customer', 'Hola, sigo sin internet desde el temporal.', NOW() - INTERVAL '10 minutes'),
        (${t2Id}, 'bot', 'Hola María Elena, detecto una señal crítica de -31.2 dBm en tu ONU. ¿Observas la luz LOS roja parpadeando?', NOW() - INTERVAL '7 minutes'),
        (${t2Id}, 'customer', 'Sí, exactamente. Y además se cayó la rama de un árbol sobre el cable de fibra de la entrada y quedó colgando. Necesito hablar con una persona de guardia.', NOW() - INTERVAL '3 minutes');
    `;

    console.log("✅ Conversaciones semilla de WhatsApp creadas exitosamente.");
  }

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

  // =========================================================================
  // ARTÍCULOS DE CAPACITACIÓN OPERATIVA Y MANUAL DE USUARIO DEL SISTEMA
  // =========================================================================
  console.log("📚 Sembrando manual operativo y guías de capacitación en 'isp_knowledge'...");
  await sql`
    INSERT INTO isp_knowledge (category, title, content, keywords)
    VALUES
      (
        'manual_operativo',
        'Lógica de Shadow DB y Contingencia',
        'La arquitectura Shadow DB garantiza que ninguna operación de campo o guardia se detenga ante fallos externos:\n1. Persistencia Inmediata Local: Cada ticket, cliente o medición de potencia se guarda primero en la base de datos central de Neon Postgres en < 800ms.\n2. Encolado Seguro (sync_queue): Si la API de ISPCube o el enlace de internet troncal sufren un corte o timeout, la transacción no falla de cara al usuario. El sistema la deposita con estado "pending" en la tabla sync_queue.\n3. Reintento y Autorrecuperación: Un mecanismo background reintenta periódicamente enviar las mutaciones encoladas en cuanto se reestablece la conectividad con ISPCube, evitando pérdidas de datos o inconsistencias contables/técnicas.',
        ARRAY['shadow db', 'contingencia', 'sync_queue', 'ispcube', 'sincronizacion', 'offline', 'persistencia', 'cola']
      ),
      (
        'manual_operativo',
        'Uso de PWA de Trinchera para Técnicos',
        'Guía operativa para cuadrillas en calle con la PWA móvil (/tecnicos):\n1. Semáforo Óptico de Potencia (Rx): Al medir la roseta o drop del cliente, ingresar los dBm en el reporte rápido.\n   - Verde Óptimo (-15.0 a -24.9 dBm): Potencia ideal para navegación simétrica sin fluctuación.\n   - Amarillo Atenuado (-25.0 a -26.9 dBm): Señal degradada, requiere revisión de empalmes o limpieza de conector SC/APC.\n   - Rojo Crítico (<= -27.0 dBm): Alarma de pérdida de sincronismo GPON, corte o microcurvatura severa.\n2. Navegación GPS Rápida: Tocar el botón de navegación en la tarjeta de la orden para abrir automáticamente Google Maps con la ruta hacia las coordenadas exactas del abonado.\n3. Chat Interno de Guardia: Usar el panel inferior de mensajería interna para coordinar con el NOC o despachador en tiempo real sin usar WhatsApp personal ni exponer números privados.',
        ARRAY['pwa', 'tecnicos', 'semaforo', 'potencia', 'rx_power', 'dbm', 'gps', 'google maps', 'chat interno', 'cuadrillas']
      ),
      (
        'manual_operativo',
        'Navegación del Panel NOC / ERP',
        'Guía de lectura e interpretación del tablero principal del NOC (/):\n1. Abonados en Vivo: Muestra clientes activos con sesión PPPoE establecida y telemetría de potencia reportada por la OLT.\n2. Clientes Morosos: Listado de abonados con facturas impagas pasibles de suspensión o promesas de pago.\n3. Nodos en Alerta: Monitorea OLTs y cajas NAP; alerta cuando los puertos ocupados superan el 90% de capacidad o la atenuación promedio excede los límites admisibles.\n4. Radar de Cuadrillas: Mapeo geolocalizado en tiempo real de los móviles de servicio técnico activos en calle.\n5. Consulta y Búsqueda de Tickets: Búsqueda rápida por abonado, número de reclamo o prioridad.',
        ARRAY['noc', 'dashboard', 'panel', 'abonados', 'morosos', 'nodos', 'olt', 'nap', 'radar', 'tickets']
      ),
      (
        'manual_operativo',
        'Resolución y Cierre de Tickets',
        'Protocolo de cambio de estado y cierre de órdenes técnicas:\n1. Ubicación: En la tarjeta de la orden de trabajo (PWA Técnicos o Panel NOC /tickets), seleccionar el botón "Reportar Potencia / Cierre".\n2. Ingreso de Datos Obligatorios: Registrar el valor medido con Power Meter (rx_power en dBm), seleccionar el resultado ("Resuelto" o "Requiere Fusión / Derivación") y redactar notas de campo precisas.\n3. Derivación a Fusión: Si la potencia es <= -27 dBm y la causa es troncal o sangrado de splitter, cambiar estado a "Derivado" e ingresar en notas la NAP y splitter afectados para que tome intervención la cuadrilla de empalme.\n4. Impacto: Al confirmar el cierre, la orden se actualiza en isp_tickets, impacta en clientes/isp_services y se sincroniza automáticamente con el ERP o queda encolada en sync_queue.',
        ARRAY['cierre', 'resolucion', 'tickets', 'orden de trabajo', 'potencia', 'fusion', 'derivacion', 'reporte']
      )
    ON CONFLICT DO NOTHING;
  `;
  console.log("✅ Manual operativo sembrado exitosamente en 'isp_knowledge'.");

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
