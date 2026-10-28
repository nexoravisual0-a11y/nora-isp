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
}

export interface NuevoClienteInput {
  nombre: string;
  plan: string;
  ipPppoe: string;
  cajaNap: string;
  oltConectada: string;
  estadoPppoe?: "Conectado" | "Desconectado";
  estadoFacturacion?: "Al día" | "Moroso" | "Pendiente";
  potenciaDbm?: number;
  telefono?: string;
}

export interface TicketFTTH {
  id: string;
  cliente: string;
  asunto: string;
  prioridad: "Alta" | "Media" | "Baja";
  estado: "Abierto" | "En Proceso" | "Cerrado";
  creado: string;
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
        potencia_dbm
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
    }));
  } catch (error) {
    console.error("[SERVER_ACTION getClientes ERROR]:", error);
    throw new Error("No se pudo obtener el listado de clientes de la base de datos.");
  }
}

/**
 * Registra un nuevo abonado en Neon Serverless Postgres.
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
    const telefono = clienteData.telefono || null;

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
        telefono
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
        ${telefono}
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
        potencia_dbm;
    `;

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
