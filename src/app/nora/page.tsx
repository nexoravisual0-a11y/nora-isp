"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Database,
  Bot,
  User,
  AlertCircle,
  Activity,
  CheckCircle2,
  LifeBuoy,
  Network,
  Wifi,
  Zap,
} from "lucide-react";

export interface TechnicalItem {
  label: string;
  valor: string;
  alerta?: boolean;
  critico?: boolean;
}

export interface TechnicalPayload {
  tipo: "cliente" | "nodo" | "ticket";
  titulo: string;
  subtitulo?: string;
  datos: TechnicalItem[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  technicalPayload?: TechnicalPayload | null;
}

function CaralitaChatInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola, soy Caralita, la asistente inteligente y técnica de Carale Internet. Estoy conectada a la Base de Datos Central vía Core API para auditar clientes, telemetría de cajas NAP/OLT o abrir tickets técnicos de forma autónoma.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && !input) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setErrorMsg(null);

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmedInput },
    ];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Error al comunicarse con Caralita IA.");
      }

      if (data.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.content,
            technicalPayload: data.technicalPayload || null,
          },
        ]);
      } else {
        throw new Error("Respuesta vacía del motor de IA.");
      }
    } catch (err: unknown) {
      console.error("[CARALITA_CHAT_ERROR]:", err);
      const msg = err instanceof Error ? err.message : "Error inesperado de comunicación.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-950 font-sans">
      {/* Barra Superior de Control de Caralita */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 font-bold text-white shadow-md shadow-cyan-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-white">Caralita (Nivel 3 FTTH & ERP)</h1>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Core DB Conectado
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Persistencia en Sistema Central • Telemetría óptica viva • Creación autónoma de tickets
            </p>
          </div>
        </div>

        {/* Indicador de Estado del Sistema */}
        <div className="flex items-center gap-2.5 bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-700/80 text-xs text-slate-300">
          <Database className="h-4 w-4 text-cyan-400" />
          <span className="font-medium text-slate-200">Motor de IA</span>
          <span className="text-[10px] text-slate-400 font-mono">Red Neuronal</span>
        </div>
      </div>

      {/* Área de Mensajes */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-5">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl text-xs font-bold ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-cyan-700 text-cyan-100 border border-cyan-500/30 shadow-md shadow-cyan-950"
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className={`max-w-[85%] sm:max-w-[78%] space-y-3`}>
                  {/* Burbuja de Texto */}
                  <div
                    className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                    }`}
                  >
                    <div>{msg.content}</div>

                    {/* Div minúsculo en la parte inferior derecha con "By Nora" */}
                    {!isUser && (
                      <div className="flex justify-end mt-2 pt-1 border-t border-slate-800/50">
                        <span className="text-[9px] text-slate-500 select-none font-medium opacity-60">
                          By Nora
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tarjeta Embebida (technicalPayload) */}
                  {!isUser && msg.technicalPayload && (
                    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-xl shadow-cyan-950/20 backdrop-blur">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          {msg.technicalPayload.tipo === "cliente" ? (
                            <Wifi className="h-4 w-4 text-cyan-400" />
                          ) : msg.technicalPayload.tipo === "ticket" ? (
                            <LifeBuoy className="h-4 w-4 text-amber-400" />
                          ) : (
                            <Network className="h-4 w-4 text-emerald-400" />
                          )}
                          <h4 className="text-xs font-bold text-white">
                            {msg.technicalPayload.titulo}
                          </h4>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {msg.technicalPayload.tipo === "ticket" ? "Core DB Ticket" : "Core Telemetría"}
                        </span>
                      </div>

                      {msg.technicalPayload.subtitulo && (
                        <p className="text-[11px] text-slate-400 mb-3 font-mono">
                          {msg.technicalPayload.subtitulo}
                        </p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        {msg.technicalPayload.datos.map((item, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-xl border ${
                              item.critico
                                ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                                : item.alerta
                                ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
                                : "bg-slate-800/50 border-slate-700/60 text-slate-200"
                            }`}
                          >
                            <span className="block text-[10px] text-slate-400 font-medium">
                              {item.label}
                            </span>
                            <span
                              className={`font-semibold font-mono text-[11px] truncate block mt-0.5 ${
                                item.critico
                                  ? "text-rose-400 font-bold"
                                  : item.alerta
                                  ? "text-amber-400 font-bold"
                                  : "text-slate-100"
                              }`}
                            >
                              {item.valor}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loader de Inferencia */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl bg-cyan-700 text-xs font-bold text-cyan-100 border border-cyan-500/30">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none border border-slate-800 bg-slate-900 px-5 py-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:200ms]" />
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:400ms]" />
                  <span className="ml-2 text-xs text-slate-300 font-medium">
                    Caralita está consultando la telemetría en la Base de Datos Central y razonando la solución...
                  </span>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input de Mensajes */}
      <footer className="border-t border-slate-800 bg-slate-900/80 p-4 backdrop-blur shrink-0">
        <form onSubmit={handleSendMessage} className="mx-auto max-w-4xl flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Pregúntale a Caralita por un abonado, atenuación en una NAP, o solicita abrir un ticket..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 transition"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </footer>
    </div>
  );
}

export default function NoraCopilotPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Cargando Consola Caralita...</div>}>
      <CaralitaChatInner />
    </Suspense>
  );
}
