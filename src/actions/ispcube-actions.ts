"use server";

import { sql } from "@/lib/db";

export interface ClienteFTTH {
  id: string;
  nombre: string;
  plan: string;
  ipPppoe: string;
  estadoPppoe: "Conectado" | "Desconectado";
  estadoFacturacion: "Al día" | "Moroso" | "Pendiente";
  oltConectada: string;
  cajaNap: string;
  potenciaDbm: number;
  dni?: string;
  domicilio?: string;
  telefono?: string;
  correo?: string;
  condicionFiscal?: string;
}

export interface NuevoClienteInput {
  nombre: string;
  plan: string;
  ipPppoe: string;
  cajaNap: string;
  oltConectada: string;
  dni?: string;
  domicilio?: string;
  telefono?: string;
  correo?: string;
  condicionFiscal?: string;
  estadoPppoe?: "Conectado" | "Desconectado";
  estadoFacturacion?: "Al día" | "Moroso" | "Pendiente";
  potenciaDbm?: number;
}

export interface TicketFTTH {
  id: string;
  cliente: string;
  asunto: string;
  prioridad: "Alta" | "Media" | "Baja";
  estado: "Abierto" | "En Proceso" | "Cerrado";
  creado: string;
  synced?: boolean;
}

export interface OrdenTrabajoTecnico {
  id: string;
  cliente: string;
  customerId?: string;
  direccion: string;
  problema: string;
  estado: "Abierto" | "En Proceso" | "Cerrado" | "Derivado";
  prioridad: "Alta" | "Media" | "Baja";
  rxPower?: number | null;
  lat?: number | null;
  lng?: number | null;
  tecnicoId?: string;
  creado: string;
}

export interface ReporteCierreInput {
  ticketId: string;
  customerId?: string;
  tecnicoId: string;
  rxPower: number;
  estadoFinal: "Resuelto" | "Requiere Fusión / Derivación";
  observaciones?: string;
}

export interface MensajeInterno {
  id: string;
  sender_id: string;
  role: string;
  ticket_id?: string | null;
  content: string;
  created_at: string;
}

/**
 * Obtiene las órdenes de trabajo para cuadrillas de campo combinando isp_tickets, tickets y clientes.
 */
export async function getOrdenesTrabajo(tecnicoId?: string): Promise<OrdenTrabajoTecnico[]> {
  try {
    const rows = await sql`
      SELECT 
        t.id,
        t.cliente,
        t.asunto AS problema,
        t.prioridad,
        t.estado,
        t.creado,
        COALESCE(c.domicilio, ic.direccion, 'Ituzaingó, Corrientes') AS direccion,
        COALESCE(ic.lat, -27.5924) AS lat,
        COALESCE(ic.lng, -56.6845) AS lng,
        COALESCE(c.potencia_dbm, s.rx_power, -20.0) AS rx_power,
        COALESCE(it.customer_id, c.id) AS customer_id,
        COALESCE(it.tecnico_id, ${tecnicoId || 'Cuadrilla 1'}) AS tecnico_id
      FROM tickets t
      LEFT JOIN clientes c ON (c.nombre ILIKE t.cliente OR c.id ILIKE t.cliente)
      LEFT JOIN isp_tickets it ON (it.id_ispcube = t.id)
      LEFT JOIN isp_customers ic ON (ic.nombre ILIKE t.cliente OR ic.id_ispcube = it.customer_id)
      LEFT JOIN isp_services s ON (s.customer_id = ic.id_ispcube)
      ORDER BY 
        CASE WHEN t.prioridad = 'Alta' THEN 1 WHEN t.prioridad = 'Media' THEN 2 ELSE 3 END,
        t.created_at DESC;
    `;

    return rows.map((r) => ({
      id: String(r.id),
      cliente: String(r.cliente),
      customerId: r.customer_id ? String(r.customer_id) : undefined,
      direccion: String(r.direccion),
      problema: String(r.problema),
      estado: (r.estado as any) || "Abierto",
      prioridad: (r.prioridad as any) || "Media",
      rxPower: r.rx_power !== null ? Number(r.rx_power) : null,
      lat: r.lat !== null ? Number(r.lat) : null,
      lng: r.lng !== null ? Number(r.lng) : null,
      tecnicoId: r.tecnico_id ? String(r.tecnico_id) : undefined,
      creado: String(r.creado || "Hoy"),
    }));
  } catch (err) {
    console.error("[getOrdenesTrabajo ERROR]:", err);
    // Fallback con órdenes iniciales para no dejar la UI vacía
    return [
      {
        id: "TCK-801",
        cliente: "María Elena Rostagno",
        direccion: "Av. San Martín 840, Ituzaingó",
        problema: "Pérdida de señal de fibra / LED LOS en rojo en la ONU",
        estado: "Abierto",
        prioridad: "Alta",
        rxPower: -31.2,
        lat: -27.5924,
        lng: -56.6845,
        creado: "Hace 24 min",
      },
      {
        id: "TCK-780",
        cliente: "Juan Carlos Gómez",
        direccion: "Calle Las Heras 320, Ituzaingó",
        problema: "Revisión preventiva de acometida y medición de potencia en roseta",
        estado: "Abierto",
        prioridad: "Media",
        rxPower: -19.4,
        lat: -27.5891,
        lng: -56.6812,
        creado: "Ayer",
      },
    ];
  }
}

/**
 * Reporta la telemetría óptica y cierra o deriva la orden de trabajo
 * Persiste en isp_tickets, actualiza la ONU/servicio y encola en sync_queue si ISPCube falla
 */
export async function reportarCierreOrden(input: ReporteCierreInput): Promise<{
  success: boolean;
  message: string;
  synced: boolean;
}> {
  try {
    const estadoTicket = input.estadoFinal === "Resuelto" ? "Cerrado" : "En Proceso";
    const notasCierre = `[CIERRE TÉCNICO]: Potencia Rx reportada: ${input.rxPower} dBm. Estado: ${input.estadoFinal}. Obs: ${input.observaciones || 'Sin notas adicionales'}.`;

    // 1. Actualizar en isp_tickets
    await sql`
      UPDATE isp_tickets
      SET 
        estado = ${estadoTicket},
        notas = COALESCE(notas, '') || E'\n' || ${notasCierre},
        synced = false
      WHERE id_ispcube = ${input.ticketId} OR id::text = ${input.ticketId};
    `;

    // 2. Actualizar en tabla legacy tickets
    await sql`
      UPDATE tickets
      SET 
        estado = ${estadoTicket},
        asunto = asunto || ${` (${input.estadoFinal} - ${input.rxPower} dBm)`}
      WHERE id = ${input.ticketId};
    `;

    // 3. Actualizar telemetría de potencia en clientes y isp_services
    if (input.customerId) {
      await sql`
        UPDATE clientes 
        SET potencia_dbm = ${input.rxPower}
        WHERE id = ${input.customerId} OR nombre ILIKE ${'%' + input.customerId + '%'};
      `;
      await sql`
        UPDATE isp_services
        SET rx_power = ${input.rxPower}, updated_at = NOW()
        WHERE customer_id = ${input.customerId} OR id_ispcube = ${input.customerId};
      `;
    }

    // 4. Registrar en sync_queue para sincronizar hacia ISPCube
    const payloadSync = {
      action: "ticket_close",
      ticketId: input.ticketId,
      customerId: input.customerId,
      tecnicoId: input.tecnicoId,
      rxPower: input.rxPower,
      status: estadoTicket,
      resolution: input.estadoFinal,
      notes: notasCierre,
    };

    const syncRes = await syncWithIspCubeApi("tickets/close", payloadSync);

    if (syncRes.success) {
      await sql`
        UPDATE isp_tickets
        SET synced = true
        WHERE id_ispcube = ${input.ticketId} OR id::text = ${input.ticketId};
      `;
      return {
        success: true,
        message: `Orden ${input.ticketId} cerrada exitosamente y sincronizada con ISPCube (${input.rxPower} dBm).`,
        synced: true,
      };
    } else {
      await enqueueSyncTask("tickets", "close", payloadSync, syncRes.error || "ISPCube offline");
      return {
        success: true,
        message: `Orden ${input.ticketId} registrada en Shadow DB (${input.rxPower} dBm). Encolada en sync_queue para sincronización.`,
        synced: false,
      };
    }
  } catch (err) {
    console.error("[reportarCierreOrden ERROR]:", err);
    throw new Error(err instanceof Error ? err.message : "Error al reportar el cierre de la orden.");
  }
}

/**
 * Obtiene los mensajes internos de campo (internal_messages)
 */
export async function getMensajesInternos(ticketId?: string): Promise<MensajeInterno[]> {
  try {
    let rows: any[] = [];
    if (ticketId) {
      rows = await sql`
        SELECT id, sender_id, role, ticket_id, content, created_at
        FROM internal_messages
        WHERE ticket_id = ${ticketId} OR ticket_id IS NULL
        ORDER BY created_at ASC
        LIMIT 50;
      `;
    } else {
      rows = await sql`
        SELECT id, sender_id, role, ticket_id, content, created_at
        FROM internal_messages
        ORDER BY created_at ASC
        LIMIT 50;
      `;
    }

    return rows.map((r) => ({
      id: String(r.id),
      sender_id: String(r.sender_id),
      role: String(r.role),
      ticket_id: r.ticket_id ? String(r.ticket_id) : null,
      content: String(r.content),
      created_at: new Date(r.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    }));
  } catch (err) {
    console.warn("[getMensajesInternos ERROR]:", err);
    return [];
  }
}

/**
 * Envía un mensaje interno seguro
 */
export async function enviarMensajeInterno(input: {
  senderId: string;
  role?: string;
  ticketId?: string;
  content: string;
}): Promise<MensajeInterno> {
  try {
    const role = input.role || "Técnico Campo";
    const rows = await sql`
      INSERT INTO internal_messages (sender_id, role, ticket_id, content)
      VALUES (${input.senderId}, ${role}, ${input.ticketId || null}, ${input.content.trim()})
      RETURNING id, sender_id, role, ticket_id, content, created_at;
    `;
    const r = rows[0];
    return {
      id: String(r.id),
      sender_id: String(r.sender_id),
      role: String(r.role),
      ticket_id: r.ticket_id ? String(r.ticket_id) : null,
      content: String(r.content),
      created_at: new Date(r.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch (err) {
    console.error("[enviarMensajeInterno ERROR]:", err);
    throw new Error("No se pudo enviar el mensaje interno.");
  }
}


export interface NuevoTicketInput {
  cliente: string;
  asunto: string;
  prioridad?: "Alta" | "Media" | "Baja";
  tipo?: string;
  notas?: string;
  customerId?: string;
  tecnicoId?: string;
}

export interface NodoOlt {
  id: string;
  nombre: string;
  tipo: "OLT" | "NAP" | "Troncal";
  ubicacion: string;
  estado: "Online" | "Warning" | "Critical";
  potenciaSalidaDbm: number;
  puertosOcupados: number;
  puertosTotales: number;
  atenuacionPromedio: string;
}

/**
 * Cliente de contingencia para la API externa de ISPCube
 */
async function syncWithIspCubeApi(action: string, payload: Record<string, unknown>): Promise<{ success: boolean; data?: any; error?: string }> {
  const ispcubeUrl = process.env.ISPCUBE_API_URL;
  const ispcubeToken = process.env.ISPCUBE_API_TOKEN;

  if (!ispcubeUrl || !ispcubeToken) {
    return {
      success: false,
      error: "ISPCUBE_API_URL o ISPCUBE_API_TOKEN no configurados en las variables de entorno.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const res = await fetch(`${ispcubeUrl.replace(/\/+$/, "")}/api/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ispcubeToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { success: false, error: `ISPCube HTTP ${res.status}: ${errText.slice(0, 120)}` };
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, data };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error de conexión o timeout con ISPCube",
    };
  }
}

/**
 * Inserta una tarea en sync_queue ante falla o indisponibilidad de la API externa
 */
async function enqueueSyncTask(entity: string, action: string, payload: Record<string, unknown>, lastError: string) {
  try {
    await sql`
      INSERT INTO sync_queue (entity, action, payload, status, retries, last_error)
      VALUES (${entity}, ${action}, ${JSON.stringify(payload)}, 'pending', 0, ${lastError});
    `;
    console.warn(`[SYNC_QUEUE ENQUEUED]: Entidad: ${entity} | Acción: ${action} | Error previo: ${lastError}`);
  } catch (queueErr) {
    console.error("[CRITICAL: ERROR GUARDANDO EN SYNC_QUEUE]:", queueErr);
  }
}

/**
 * BLOQUE 2: Mutación de Tickets con Persistencia Instantánea en Shadow DB (isp_tickets)
 * y Fallback / Contingencia hacia sync_queue
 */
export async function crearTicket(input: NuevoTicketInput): Promise<{
  success: boolean;
  ticketId: string;
  synced: boolean;
  message: string;
  ticket: TicketFTTH;
}> {
  try {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const ticketIdLegacy = `TCK-${randomSuffix}`;
    const prioridad = input.prioridad || "Media";
    const tipo = input.tipo || "Incidencia Técnica";
    const estado = "Abierto";
    const notas = input.notas || input.asunto;
    const customerId = input.customerId || input.cliente;
    const tecnicoId = input.tecnicoId || "GUARDIA-NOC";
    const timestampDesc = "Hace un instante";

    // 1. Inserción inmediata en isp_tickets (Shadow DB)
    const shadowRows = await sql`
      INSERT INTO isp_tickets (id_ispcube, customer_id, tecnico_id, estado, tipo, notas, synced)
      VALUES (${ticketIdLegacy}, ${customerId}, ${tecnicoId}, ${estado}, ${tipo}, ${notas}, false)
      RETURNING id, id_ispcube, customer_id, tecnico_id, estado, tipo, notas, synced, created_at;
    `;

    // 2. Sincronización en tabla legacy tickets para compatibilidad con el dashboard NOC
    await sql`
      INSERT INTO tickets (id, cliente, asunto, prioridad, estado, creado)
      VALUES (${ticketIdLegacy}, ${input.cliente}, ${input.asunto}, ${prioridad}, ${estado}, ${timestampDesc})
      ON CONFLICT (id) DO NOTHING;
    `;

    const shadowTicket = shadowRows[0];

    // 3. Intento de sincronización hacia API de ISPCube
    const payloadSync = {
      external_id: ticketIdLegacy,
      shadow_uuid: shadowTicket?.id,
      customer: input.cliente,
      customerId,
      subject: input.asunto,
      priority: prioridad,
      type: tipo,
      notes: notas,
    };

    const ispcubeResult = await syncWithIspCubeApi("tickets/create", payloadSync);

    let isSynced = false;

    if (ispcubeResult.success) {
      isSynced = true;
      if (shadowTicket?.id) {
        await sql`
          UPDATE isp_tickets 
          SET synced = true, id_ispcube = ${ispcubeResult.data?.id ? String(ispcubeResult.data.id) : ticketIdLegacy}
          WHERE id = ${shadowTicket.id};
        `;
      }
    } else {
      // 4. Contingencia: Encolar en sync_queue si falló o no está configurado
      await enqueueSyncTask("tickets", "create", payloadSync, ispcubeResult.error || "ISPCube inaccesible");
    }

    const ticketResult: TicketFTTH = {
      id: ticketIdLegacy,
      cliente: input.cliente,
      asunto: input.asunto,
      prioridad,
      estado: "Abierto",
      creado: timestampDesc,
      synced: isSynced,
    };

    return {
      success: true,
      ticketId: ticketIdLegacy,
      synced: isSynced,
      message: isSynced
        ? `Ticket ${ticketIdLegacy} creado y sincronizado con ISPCube exitosamente.`
        : `Ticket ${ticketIdLegacy} creado instantáneamente en Shadow DB y encolado en cola de contingencia para sincronización posterior.`,
      ticket: ticketResult,
    };
  } catch (error) {
    console.error("[SERVER_ACTION crearTicket ERROR]:", error);
    throw new Error(
      error instanceof Error ? error.message : "Error al registrar el ticket de soporte en la base de datos."
    );
  }
}

/**
 * Obtiene la lista completa de abonados desde Neon Serverless Postgres.
 */
export async function getClientes(): Promise<ClienteFTTH[]> {
  try {
    const rows = await sql`
      SELECT 
        id, 
        nombre, 
        plan, 
        ip_pppoe, 
        estado_pppoe, 
        estado_facturacion, 
        olt_conectada, 
        caja_nap, 
        potencia_dbm,
        dni,
        domicilio,
        telefono,
        correo,
        condicion_fiscal
      FROM clientes
      ORDER BY id ASC;
    `;

    return rows.map((r) => ({
      id: String(r.id),
      nombre: String(r.nombre),
      plan: String(r.plan),
      ipPppoe: r.ip_pppoe ? String(r.ip_pppoe) : "Sin asignar",
      estadoPppoe: (r.estado_pppoe as "Conectado" | "Desconectado") || "Desconectado",
      estadoFacturacion: (r.estado_facturacion as "Al día" | "Moroso" | "Pendiente") || "Al día",
      oltConectada: r.olt_conectada ? String(r.olt_conectada) : "N/A",
      cajaNap: r.caja_nap ? String(r.caja_nap) : "N/A",
      potenciaDbm: r.potencia_dbm !== null ? Number(r.potencia_dbm) : -20.0,
      dni: r.dni ? String(r.dni) : undefined,
      domicilio: r.domicilio ? String(r.domicilio) : undefined,
      telefono: r.telefono ? String(r.telefono) : undefined,
      correo: r.correo ? String(r.correo) : undefined,
      condicionFiscal: r.condicion_fiscal ? String(r.condicion_fiscal) : undefined,
    }));
  } catch (error) {
    console.error("[SERVER_ACTION getClientes ERROR]:", error);
    throw new Error("No se pudo obtener el listado de clientes de la base de datos.");
  }
}

/**
 * Obtiene las cajas NAP dinámicamente desde nodos y clientes para sugerencias en el selector.
 */
export async function getCajasNapList(): Promise<string[]> {
  try {
    const rows = await sql`
      SELECT DISTINCT nombre FROM nodos WHERE tipo = 'NAP'
      UNION
      SELECT DISTINCT caja_nap AS nombre FROM clientes WHERE caja_nap IS NOT NULL AND caja_nap != ''
      ORDER BY nombre ASC;
    `;
    const names = rows.map((r) => String(r.nombre)).filter(Boolean);
    if (names.length > 0) return names;
    return [
      "NAP-01 (Barrio Centro)",
      "NAP-02 (Barrio Norte)",
      "NAP-03 (Barrio Sur)",
      "NAP-04 (Barrio Centro)",
      "NAP-05 (Parque Industrial)",
    ];
  } catch (e) {
    console.error("[getCajasNapList ERROR]:", e);
    return [
      "NAP-01 (Barrio Centro)",
      "NAP-02 (Barrio Norte)",
      "NAP-03 (Barrio Sur)",
      "NAP-04 (Barrio Centro)",
      "NAP-05 (Parque Industrial)",
    ];
  }
}

/**
 * Registra un nuevo abonado en Neon Serverless Postgres con información de facturación y técnica,
 * reflejando tanto en la tabla legacy como en la Shadow DB (isp_customers & isp_services).
 */
export async function crearCliente(clienteData: NuevoClienteInput): Promise<ClienteFTTH> {
  try {
    if (!clienteData.nombre?.trim()) {
      throw new Error("El nombre del abonado es obligatorio.");
    }
    if (!clienteData.plan?.trim()) {
      throw new Error("El plan de servicio es obligatorio.");
    }
    if (!clienteData.ipPppoe?.trim()) {
      throw new Error("La IP PPPoE es obligatoria.");
    }
    if (!clienteData.cajaNap?.trim()) {
      throw new Error("La Caja NAP es obligatoria.");
    }
    if (!clienteData.oltConectada?.trim()) {
      throw new Error("La OLT conectada es obligatoria.");
    }

    // Generar ID unívoco (CLI-XXXX)
    let clienteId = `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = await sql`SELECT id FROM clientes WHERE id = ${clienteId};`;
    if (existing.length > 0) {
      clienteId = `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const estadoPppoe = clienteData.estadoPppoe || "Conectado";
    const estadoFacturacion = clienteData.estadoFacturacion || "Al día";
    const potenciaDbm = clienteData.potenciaDbm ?? -19.5;
    const dni = clienteData.dni?.trim() || null;
    const domicilio = clienteData.domicilio?.trim() || null;
    const telefono = clienteData.telefono?.trim() || null;
    const correo = clienteData.correo?.trim() || null;
    const condicionFiscal = clienteData.condicionFiscal?.trim() || null;

    const rows = await sql`
      INSERT INTO clientes (
        id, 
        nombre, 
        plan, 
        ip_pppoe, 
        estado_pppoe, 
        estado_facturacion, 
        olt_conectada, 
        caja_nap, 
        potencia_dbm,
        telefono,
        dni,
        domicilio,
        correo,
        condicion_fiscal
      )
      VALUES (
        ${clienteId},
        ${clienteData.nombre.trim()},
        ${clienteData.plan.trim()},
        ${clienteData.ipPppoe.trim()},
        ${estadoPppoe},
        ${estadoFacturacion},
        ${clienteData.oltConectada.trim()},
        ${clienteData.cajaNap.trim()},
        ${potenciaDbm},
        ${telefono},
        ${dni},
        ${domicilio},
        ${correo},
        ${condicionFiscal}
      )
      RETURNING 
        id, 
        nombre, 
        plan, 
        ip_pppoe, 
        estado_pppoe, 
        estado_facturacion, 
        olt_conectada, 
        caja_nap, 
        potencia_dbm,
        dni,
        domicilio,
        telefono,
        correo,
        condicion_fiscal;
    `;

    // Replicar en Shadow DB (isp_customers e isp_services)
    try {
      const ispcubeCleanId = clienteId.replace("CLI-", "");
      await sql`
        INSERT INTO isp_customers (id_ispcube, dni, nombre, direccion, estado, saldo)
        VALUES (${ispcubeCleanId}, ${dni}, ${clienteData.nombre.trim()}, ${domicilio}, 'Activo', 0.00)
        ON CONFLICT (id_ispcube) DO UPDATE 
        SET dni = EXCLUDED.dni, nombre = EXCLUDED.nombre, direccion = EXCLUDED.direccion;
      `;

      await sql`
        INSERT INTO isp_services (id_ispcube, customer_id, ip, plan, nodo, nap_puerto, rx_power)
        VALUES (
          ${'SRV-' + ispcubeCleanId}, 
          ${ispcubeCleanId}, 
          ${clienteData.ipPppoe.trim()}, 
          ${clienteData.plan.trim()}, 
          ${clienteData.oltConectada.trim()}, 
          ${clienteData.cajaNap.trim()}, 
          ${potenciaDbm}
        )
        ON CONFLICT (id_ispcube) DO NOTHING;
      `;
    } catch (shadowErr) {
      console.warn("[SHADOW_DB REPLICATION NON-BLOCKING]:", shadowErr);
    }

    const r = rows[0];
    return {
      id: String(r.id),
      nombre: String(r.nombre),
      plan: String(r.plan),
      ipPppoe: r.ip_pppoe ? String(r.ip_pppoe) : "Sin asignar",
      estadoPppoe: (r.estado_pppoe as "Conectado" | "Desconectado") || "Conectado",
      estadoFacturacion: (r.estado_facturacion as "Al día" | "Moroso" | "Pendiente") || "Al día",
      oltConectada: r.olt_conectada ? String(r.olt_conectada) : "N/A",
      cajaNap: r.caja_nap ? String(r.caja_nap) : "N/A",
      potenciaDbm: r.potencia_dbm !== null ? Number(r.potencia_dbm) : -19.5,
      dni: r.dni ? String(r.dni) : undefined,
      domicilio: r.domicilio ? String(r.domicilio) : undefined,
      telefono: r.telefono ? String(r.telefono) : undefined,
      correo: r.correo ? String(r.correo) : undefined,
      condicionFiscal: r.condicion_fiscal ? String(r.condicion_fiscal) : undefined,
    };
  } catch (error) {
    console.error("[SERVER_ACTION crearCliente ERROR]:", error);
    throw new Error(
      error instanceof Error ? error.message : "Error al registrar el nuevo cliente en la base de datos."
    );
  }
}

/**
 * Obtiene la lista completa de tickets de soporte técnico desde Neon Serverless Postgres.
 */
export async function getTickets(): Promise<TicketFTTH[]> {
  try {
    const rows = await sql`
      SELECT 
        id, 
        cliente, 
        asunto, 
        prioridad, 
        estado, 
        creado,
        created_at
      FROM tickets
      ORDER BY created_at DESC, id DESC;
    `;

    return rows.map((r) => ({
      id: String(r.id),
      cliente: String(r.cliente),
      asunto: String(r.asunto),
      prioridad: (r.prioridad as "Alta" | "Media" | "Baja") || "Media",
      estado: (r.estado as "Abierto" | "En Proceso" | "Cerrado") || "Abierto",
      creado: r.creado
        ? String(r.creado)
        : r.created_at
        ? new Date(r.created_at).toLocaleString("es-AR")
        : "Reciente",
    }));
  } catch (error) {
    console.error("[SERVER_ACTION getTickets ERROR]:", error);
    throw new Error("No se pudo obtener el listado de tickets de la base de datos.");
  }
}

/**
 * Obtiene la topología de red FTTH (OLTs, cajas NAP, splitters) desde Neon Serverless Postgres.
 */
export async function getNodosOlt(): Promise<NodoOlt[]> {
  try {
    const rows = await sql`
      SELECT 
        id, 
        nombre, 
        tipo, 
        ubicacion, 
        estado, 
        potencia_salida_dbm, 
        puertos_ocupados, 
        puertos_totales, 
        atenuacion_promedio
      FROM nodos
      ORDER BY id ASC;
    `;

    return rows.map((r) => ({
      id: String(r.id),
      nombre: String(r.nombre),
      tipo: (r.tipo as "OLT" | "NAP" | "Troncal") || "NAP",
      ubicacion: r.ubicacion ? String(r.ubicacion) : "Sin ubicación registrada",
      estado: (r.estado as "Online" | "Warning" | "Critical") || "Online",
      potenciaSalidaDbm: r.potencia_salida_dbm !== null ? Number(r.potencia_salida_dbm) : 0,
      puertosOcupados: Number(r.puertos_ocupados ?? 0),
      puertosTotales: Number(r.puertos_totales ?? 1),
      atenuacionPromedio: r.atenuacion_promedio ? String(r.atenuacion_promedio) : "Atenuación nominal",
    }));
  } catch (error) {
    console.error("[SERVER_ACTION getNodosOlt ERROR]:", error);
    throw new Error("No se pudo obtener la infraestructura de red FTTH de la base de datos.");
  }
}
