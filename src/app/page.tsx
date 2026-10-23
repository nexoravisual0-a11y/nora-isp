"use client";

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
} from "lucide-react";
import { MOCK_KPIS, MOCK_CLIENTES, MOCK_NODOS } from "@/lib/mock-data";

export default function DashboardSummaryPage() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Bienvenida y Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Panel General de Control (NOC & ERP)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Supervisión en tiempo real de infraestructura FTTH, clientes PPPoE y salud de red.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/nora"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Zap className="h-4 w-4" />
            <span>Consultar con Nora Copilot</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Clientes Activos */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Clientes Activos</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {MOCK_KPIS.clientesActivos.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> +4.2%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Total servicios con PPPoE provisionado</p>
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
              {MOCK_KPIS.clientesMorosos}
            </span>
            <span className="text-xs text-slate-400">1.8% del padrón</span>
          </div>
          <p className="mt-2 text-[11px] text-amber-400/90">
            Pendientes de corte o suspensión automática
          </p>
        </div>

        {/* Card 3: Nodos OLT / Red */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Nodos OLT Caídos</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Network className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {MOCK_KPIS.nodosOltCaidos}
            </span>
            <span className="text-xs font-semibold text-emerald-400">100% Operativo</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">2 OLTs Huawei / FiberHome en línea</p>
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
              {MOCK_KPIS.ticketsAbiertos}
            </span>
            <span className="text-xs text-rose-400 font-medium">1 Urgente N3</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Tiempo prom. resolución: 18 min</p>
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
              <span>Ver todas las cajas NAP</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {/* Alerta 1 */}
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-rose-200">
                      Caja NAP-04 (Barrio Centro)
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      Crítico
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Lectura óptica: <strong>-30.5 dBm</strong>. Pérdida severa de potencia detectada en
                    splitter de segundo nivel. ONU de cliente María Elena desconectada por atenuación.
                  </p>
                </div>
              </div>
              <Link
                href="/nora"
                className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
              >
                Diagnosticar con IA
              </Link>
            </div>

            {/* Alerta 2 */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <Wifi className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">
                      OLT Huawei EA5800 - Pon 1/1 y 1/2
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Normal
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Potencia de transmisión SFP+ en +5.2 dBm. Tráfico nominal a 4.1 Gbps sin drop de paquetes.
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-500 self-center">Estable</span>
            </div>
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
              <span className="text-slate-400">Cerebro Nora ISP:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Modo Standby NOC
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
