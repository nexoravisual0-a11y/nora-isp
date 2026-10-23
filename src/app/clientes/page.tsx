"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, Filter, Plus, Wifi, WifiOff, AlertCircle, Bot, Check } from "lucide-react";
import { MOCK_CLIENTES, ClienteMock } from "@/lib/mock-data";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteMock[]>(MOCK_CLIENTES);
  const [filtro, setFiltro] = useState<string>("todos");

  const clientesFiltrados = clientes.filter((c) => {
    if (filtro === "morosos") return c.estadoFacturacion === "Moroso";
    if (filtro === "desconectados") return c.estadoPppoe === "Desconectado";
    return true;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Gestión de Clientes (CRM / PPPoE)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              3 en Sandbox
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Administración de abonados, estado de sesiones MikroTik, facturación y telemetría óptica.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/nora"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-semibold transition"
          >
            <Bot className="h-4 w-4" />
            <span>Consultar CRM con Nora</span>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition">
            <Plus className="h-4 w-4" />
            <span>Nuevo Abonado</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 text-xs font-medium text-slate-400">
        <span className="text-slate-500 mr-2 flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> Filtrar:
        </span>
        <button
          onClick={() => setFiltro("todos")}
          className={`px-3 py-1.5 rounded-lg transition ${
            filtro === "todos"
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              : "hover:bg-slate-800"
          }`}
        >
          Todos ({clientes.length})
        </button>
        <button
          onClick={() => setFiltro("desconectados")}
          className={`px-3 py-1.5 rounded-lg transition ${
            filtro === "desconectados"
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              : "hover:bg-slate-800"
          }`}
        >
          Desconectados (1)
        </button>
        <button
          onClick={() => setFiltro("morosos")}
          className={`px-3 py-1.5 rounded-lg transition ${
            filtro === "morosos"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "hover:bg-slate-800"
          }`}
        >
          Morosos (1)
        </button>
      </div>

      {/* Tabla de Clientes */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ID & Cliente</th>
                <th className="py-3.5 px-4">Plan Contratado</th>
                <th className="py-3.5 px-4">IP PPPoE</th>
                <th className="py-3.5 px-4">Sesión</th>
                <th className="py-3.5 px-4">Facturación</th>
                <th className="py-3.5 px-4">Caja NAP / OLT</th>
                <th className="py-3.5 px-4">Potencia Óptica</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-white block text-sm">{cliente.nombre}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{cliente.id}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{cliente.plan}</td>
                  <td className="py-3.5 px-4 font-mono text-cyan-400">{cliente.ipPppoe}</td>
                  <td className="py-3.5 px-4">
                    {cliente.estadoPppoe === "Conectado" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Wifi className="h-3 w-3" /> Conectado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <WifiOff className="h-3 w-3" /> Desconectado
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {cliente.estadoFacturacion === "Al día" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <Check className="h-3.5 w-3.5" /> Al día
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                        <AlertCircle className="h-3.5 w-3.5" /> Moroso
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="font-medium text-slate-200">{cliente.cajaNap}</div>
                    <div className="text-[10px] text-slate-500">{cliente.oltConectada}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span
                      className={`font-semibold ${
                        cliente.potenciaDbm < -27
                          ? "text-rose-400"
                          : cliente.potenciaDbm < -24
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {cliente.potenciaDbm} dBm
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/nora?prompt=${encodeURIComponent(
                        `Analiza el estado del cliente ${cliente.nombre} (${cliente.id}), con plan ${cliente.plan}, estado ${cliente.estadoPppoe}, facturación ${cliente.estadoFacturacion} y potencia óptica ${cliente.potenciaDbm} dBm.`
                      )}`}
                      className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-[11px] text-cyan-300 hover:border-cyan-500/40 transition"
                    >
                      Auditar con Nora
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
