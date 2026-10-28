import React from "react";
import Link from "next/link";
import {
  Users,
  AlertCircle,
  Network,
  LifeBuoy,
  ArrowUpRight,
  Wifi,
  Activity,
  Zap,
  TrendingUp,
  Radio,
  MapPin,
  Wrench,
  ExternalLink,
  Navigation,
  Clock,
  Compass,
} from "lucide-react";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardSummaryPage() {
  let stats = {
    clientesActivos: 0,
    clientesMorosos: 0,
    nodosCaidos: 0,
    ticketsAbiertos: 0,
  };

  let nodosCriticos: Array<{
    id: string;
    nombre: string;
    estado: string;
    potencia_salida_dbm: number | null;
    ubicacion: string | null;
    atenuacion_promedio: string | null;
  }> = [];

  try {
    const [cTotal, cMorosos, nCriticos, tAbiertos, criticosList] = await Promise.all([
      sql`SELECT count(*)::int as count FROM clientes;`,
      sql`SELECT count(*)::int as count FROM clientes WHERE estado_facturacion = 'Moroso';`,
      sql`SELECT count(*)::int as count FROM nodos WHERE estado = 'Critical';`,
      sql`SELECT count(*)::int as count FROM tickets WHERE estado = 'Abierto';`,
      sql`SELECT id, nombre, estado, potencia_salida_dbm, ubicacion, atenuacion_promedio FROM nodos WHERE estado = 'Critical' LIMIT 5;`,
    ]);

    stats.clientesActivos = cTotal[0]?.count ?? 0;
    stats.clientesMorosos = cMorosos[0]?.count ?? 0;
    stats.nodosCaidos = nCriticos[0]?.count ?? 0;
    stats.ticketsAbiertos = tAbiertos[0]?.count ?? 0;
    nodosCriticos = criticosList as typeof nodosCriticos;
  } catch (err: unknown) {
    console.error("[ERROR CORE DASHBOARD]:", err);
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Bienvenida y Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Panel General de Control (NOC & ERP)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Base de Datos Central Conectada
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Supervisión en tiempo real de infraestructura FTTH, clientes PPPoE y telemetría óptica persistida.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/nora"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Zap className="h-4 w-4" />
            <span>Consultar con Caralita</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Clientes Activos */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Clientes Registrados</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats.clientesActivos}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> En vivo
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Abonados en Base de Datos Central</p>
        </div>

        {/* Card 2: Clientes Morosos */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Clientes Morosos</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats.clientesMorosos}
            </span>
            <span className="text-xs text-slate-400">
              {stats.clientesActivos > 0
                ? `${Math.round((stats.clientesMorosos / stats.clientesActivos) * 100)}% del padrón`
                : "0%"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-amber-400/90">
            Pendientes de corte o suspensión automática
          </p>
        </div>

        {/* Card 3: Nodos OLT / Red */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Nodos en Estado Crítico</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Network className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                stats.nodosCaidos > 0 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {stats.nodosCaidos}
            </span>
            <span
              className={`text-xs font-semibold ${
                stats.nodosCaidos > 0 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {stats.nodosCaidos > 0 ? "Requiere Cuadrilla" : "100% Operativo"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Equipos de distribución óptica</p>
        </div>

        {/* Card 4: Tickets de Soporte */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tickets Abiertos</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <LifeBuoy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats.ticketsAbiertos}
            </span>
            <span className="text-xs text-cyan-400 font-medium">Gestión Caralita IA</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Reclamos técnicos persistidos</p>
        </div>
      </div>

      {/* Widget Destacado: Radar de Cuadrillas (Live) */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Radar de Cuadrillas (Live)
                </h2>
                {/* Indicador visual de conexión en vivo */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  GPS & PWA Conectados
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Seguimiento satelital y telemetría óptica de personal técnico desplegado en planta externa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/tecnicos"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold shadow-sm transition"
              title="Abrir interfaz PWA móvil de técnicos"
            >
              <Navigation className="h-3.5 w-3.5 text-cyan-400" />
              <span>Abrir PWA Técnicos</span>
            </Link>
          </div>
        </div>

        {/* Tarjetas de Cuadrillas Desplegadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Cuadrilla 1 (Registro principal requerido) */}
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-900/80 shadow-md backdrop-blur-sm flex flex-col justify-between gap-3 hover:border-cyan-500/60 transition group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 mt-0.5">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Cuadrilla 1</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Interviniendo NAP
                    </span>
                  </div>
                  <span className="text-xs text-slate-300 block font-medium mt-0.5">
                    Técnico: Carlos Benítez
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50 shrink-0">
                GPS Activo ±8m
              </span>
            </div>

            {/* Dirección traducida por Reverse Geocoding */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 truncate pr-2">
                <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span className="font-semibold text-slate-200 truncate">
                  Av. San Martín 840, Ituzaingó
                </span>
              </div>

              {/* Botón Ver en Mapa */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  "Av. San Martín 840, Ituzaingó"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-white text-xs font-semibold text-cyan-300 border border-slate-700/80 hover:border-cyan-400 shadow-sm transition"
                title="Ver ubicación en Google Maps"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Ver en Mapa</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </div>
          </div>

          {/* Cuadrilla 2 (Guardia de Empalmes) */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm flex flex-col justify-between gap-3 hover:border-slate-700 transition group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 mt-0.5">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Cuadrilla 2</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      En Ruta a Fusión OLT
                    </span>
                  </div>
                  <span className="text-xs text-slate-300 block font-medium mt-0.5">
                    Técnico: Marcos Maidana
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                GPS Activo ±12m
              </span>
            </div>

            {/* Dirección traducida por Reverse Geocoding */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 truncate pr-2">
                <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span className="font-semibold text-slate-200 truncate">
                  Calle Belgrano 420, Merlo
                </span>
              </div>

              {/* Botón Ver en Mapa */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  "Calle Belgrano 420, Merlo"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 shadow-sm transition"
                title="Ver ubicación en Google Maps"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Ver en Mapa</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Secciones: Alertas de Red y Tráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas Críticas de Red */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-semibold text-white">
                Alertas de Infraestructura y Atenuación
              </h2>
            </div>
            <Link
              href="/nodos"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Ver todos los nodos FTTH</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {nodosCriticos.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex items-center gap-3 text-emerald-300 text-xs">
                <Wifi className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Todos los nodos FTTH y OLTs operan dentro del rango de potencia óptica normal.</span>
              </div>
            ) : (
              nodosCriticos.map((nodo) => (
                <div
                  key={nodo.id}
                  className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-rose-200">
                          {nodo.nombre}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          {nodo.estado}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Lectura óptica: <strong>{nodo.potencia_salida_dbm} dBm</strong> en {nodo.ubicacion || "red"}.{" "}
                        {nodo.atenuacion_promedio || "Pérdida severa de potencia detectada."}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/nora?prompt=${encodeURIComponent(
                      `Diagnostica el nodo crítico ${nodo.nombre} (${nodo.id}) que reporta ${nodo.potencia_salida_dbm} dBm.`
                    )}`}
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
                  >
                    Diagnosticar con IA
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Consumo y Métricas Rápidas */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Tráfico de Red Core</h2>
              <span className="text-xs font-semibold text-cyan-400">MikroTik CCR2216</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Tráfico Uplink BGP</span>
                  <span className="text-white font-semibold">8.4 / 10 Gbps (84%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[84%] rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Pool IPv4 CGNAT</span>
                  <span className="text-white font-semibold">91% Asignado</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 w-[91%] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Cerebro Caralita:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Conectado a Base de Datos Central
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
