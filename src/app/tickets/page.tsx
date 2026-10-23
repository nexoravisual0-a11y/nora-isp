"use client";

import React from "react";
import Link from "next/link";
import { LifeBuoy, AlertCircle, Clock, CheckCircle2, Bot } from "lucide-react";
import { MOCK_TICKETS } from "@/lib/mock-data";

export default function TicketsPage() {
  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Tickets de Soporte Técnico y CRM
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              3 Activos
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Cola de reclamos técnicos de nivel 1, 2 y escalamiento automático a Nora Nivel 3.
          </p>
        </div>

        <Link
          href="/nora?prompt=Nora,+revisa+la+cola+de+tickets+abiertos+y+dime+cu%C3%A1l+requiere+atenci%C3%B3n+inmediata+en+la+red+FTTH."
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition"
        >
          <Bot className="h-4 w-4" />
          <span>Analizar Tickets con Nora</span>
        </Link>
      </div>

      <div className="space-y-4">
        {MOCK_TICKETS.map((ticket) => (
          <div
            key={ticket.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-2.5 rounded-xl mt-0.5 ${
                  ticket.prioridad === "Alta"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-400">{ticket.id}</span>
                  <h2 className="text-sm font-semibold text-white">{ticket.asunto}</h2>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      ticket.prioridad === "Alta"
                        ? "bg-rose-500/20 text-rose-400"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    Prioridad {ticket.prioridad}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span>
                    Abonado: <strong className="text-slate-200">{ticket.cliente}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-500" /> {ticket.creado}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                {ticket.estado}
              </span>
              <Link
                href={`/nora?prompt=${encodeURIComponent(
                  `Nora, asume el ticket ${ticket.id} del cliente ${ticket.cliente}: "${ticket.asunto}". Dime qué pasos técnicos o de facturación debemos ejecutar de inmediato.`
                )}`}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
              >
                Resolver con IA
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
