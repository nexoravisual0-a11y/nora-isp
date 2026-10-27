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
