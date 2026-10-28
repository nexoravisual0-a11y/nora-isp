"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Network, Server, Zap, AlertTriangle, CheckCircle, Bot, RefreshCw, Loader2 } from "lucide-react";
import { getNodosOlt, NodoOlt } from "@/actions/ispcube-actions";

export default function NodosPage() {
  const [nodos, setNodos] = useState<NodoOlt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNodosData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNodosOlt();
      setNodos(data);
    } catch (err: unknown) {
      console.error("[ERROR FETCH NODOS]:", err);
      setError(err instanceof Error ? err.message : "Error al cargar topología de red de la base de datos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNodosData();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Red FTTH • OLTs, Cajas NAP y Splitters
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isLoading ? "Cargando..." : `${nodos.length} Nodos Activos en Sistema Central`}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Telemetría en tiempo real de puertos PON, atenuación óptica, balanceo de divisores y cálculo de presupuesto.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchNodosData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition disabled:opacity-50"
            title="Recargar topología de red"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <Link
            href="/nora?prompt=Realiza+un+balance+de+presupuesto+%C3%B3ptico+y+diagn%C3%B3stico+de+la+caja+NAP-04+que+reporta+-30.5+dBm."
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Bot className="h-4 w-4" />
            <span>Diagnosticar Red con Caralita</span>
          </Link>
        </div>
      </div>

      {/* Manejo de error de conexión */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchNodosData}
            className="text-[11px] underline font-semibold hover:text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Grid de Nodos */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span className="text-xs text-slate-400 font-medium">
              Cargando topología de red FTTH desde la base de datos central...
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {nodos.map((nodo) => {
            const isCritical = nodo.estado === "Critical";
            const potencia = nodo.potenciaSalidaDbm;
            const porcentaje = Math.round((nodo.puertosOcupados / (nodo.puertosTotales || 1)) * 100);

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
                      {potencia > 0 ? `+${potencia}` : potencia} dBm
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase font-semibold">
                      Puertos
                    </span>
                    <span className="font-semibold text-slate-200">
                      {nodo.puertosOcupados} / {nodo.puertosTotales}{" "}
                      <span className="text-[10px] text-slate-400">
                        ({porcentaje}%)
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
                      `Caralita, necesito que analices el nodo ${nodo.nombre} (${nodo.id}) con potencia ${potencia} dBm en ${nodo.ubicacion}. Estado actual: ${nodo.estado}. Proporciona recomendaciones para el técnico de campo.`
                    )}`}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                  >
                    <span>Pedir reporte a Caralita Nivel 3</span>
                    <Zap className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
