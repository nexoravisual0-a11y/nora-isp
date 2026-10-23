"use client";

import React from "react";
import Link from "next/link";
import { Network, Server, Zap, AlertTriangle, CheckCircle, Bot } from "lucide-react";
import { MOCK_NODOS } from "@/lib/mock-data";

export default function NodosPage() {
  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Red FTTH • OLTs, Cajas NAP y Splitters
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              5 Equipos en Sandbox
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Telemetría de puertos PON, atenuación óptica, balanceo de divisores y cálculo de presupuesto.
          </p>
        </div>

        <Link
          href="/nora?prompt=Realiza+un+balance+de+presupuesto+%C3%B3ptico+y+diagn%C3%B3stico+de+la+caja+NAP-04+que+reporta+-30.5+dBm."
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition"
        >
          <Bot className="h-4 w-4" />
          <span>Diagnosticar Red con Nora</span>
        </Link>
      </div>

      {/* Grid de Nodos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MOCK_NODOS.map((nodo) => {
          const isCritical = nodo.estado === "Critical";
          return (
            <div
              key={nodo.id}
              className={`rounded-2xl border p-5 bg-slate-900/70 transition-all ${
                isCritical
                  ? "border-rose-500/40 shadow-lg shadow-rose-950/20"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      nodo.tipo === "OLT"
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : isCritical
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {nodo.tipo === "OLT" ? (
                      <Server className="h-5 w-5" />
                    ) : (
                      <Network className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-white">{nodo.nombre}</h2>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {nodo.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{nodo.ubicacion}</p>
                  </div>
                </div>

                {isCritical ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <AlertTriangle className="h-3 w-3" /> Crítico
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="h-3 w-3" /> Operativo
                  </span>
                )}
              </div>

              {/* Métricas Ópticas y Puertos */}
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-4 text-xs">
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-semibold">
                    Potencia Óptica
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      isCritical ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {nodo.potenciaSalidaDbm > 0 ? `+${nodo.potenciaSalidaDbm}` : nodo.potenciaSalidaDbm} dBm
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-semibold">
                    Puertos
                  </span>
                  <span className="font-semibold text-slate-200">
                    {nodo.puertosOcupados} / {nodo.puertosTotales}{" "}
                    <span className="text-[10px] text-slate-400">
                      ({Math.round((nodo.puertosOcupados / nodo.puertosTotales) * 100)}%)
                    </span>
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-semibold">
                    Atenuación
                  </span>
                  <span className="text-slate-300 text-[11px] truncate block">
                    {nodo.atenuacionPromedio}
                  </span>
                </div>
              </div>

              {/* Botón de acción */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-end">
                <Link
                  href={`/nora?prompt=${encodeURIComponent(
                    `Nora, necesito que analices el nodo ${nodo.nombre} (${nodo.id}) con potencia ${nodo.potenciaSalidaDbm} dBm en ${nodo.ubicacion}. Estado actual: ${nodo.estado}. Proporciona recomendaciones para el técnico de campo.`
                  )}`}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                >
                  <span>Pedir reporte a Nora Nivel 3</span>
                  <Zap className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
