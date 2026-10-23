"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Database,
  Sparkles,
  Bot,
  User,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { MOCK_CLIENTES, MOCK_NODOS, MOCK_TICKETS, MOCK_KPIS } from "@/lib/mock-data";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function NoraChatInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola, soy Nora, el núcleo de Inteligencia Artificial (CRM, ERP y Soporte Nivel 3) de Nexora ISP. Estoy lista para diagnosticar fallas de fibra FTTH, auditar potencias de OLT/NAP, o gestionar trámites y cobranzas de abonados.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [injectContext, setInjectContext] = useState(true);
  const [contextInjectedOnce, setContextInjectedOnce] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Si viene con un prompt por URL (desde un botón del Dashboard o Clientes), lo cargamos
  useEffect(() => {
    if (initialPrompt && !input) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setErrorMsg(null);
    let updatedMessages: Message[] = [...messages];

    // Inyección de Contexto Simulado en el primer mensaje de usuario o si el interruptor está activo
    if (injectContext && !contextInjectedOnce) {
      const simulatedContext = {
        empresa: "Nexora ISP",
        kpis: MOCK_KPIS,
        clientesRegistrados: MOCK_CLIENTES,
        infraestructuraNodos: MOCK_NODOS,
        ticketsActivos: MOCK_TICKETS,
      };

      const contextMessage: Message = {
        role: "user",
        content: `[SISTEMA - TELEMETRÍA EN TIEMPO REAL DEL ERP NEXORA/ISPCUBE]:\n${JSON.stringify(
          simulatedContext,
          null,
          2
        )}\n\n[INSTRUCCIÓN DEL OPERADOR]:\n${trimmedInput}`,
      };

      updatedMessages.push(contextMessage);
      setContextInjectedOnce(true);
    } else {
      updatedMessages.push({ role: "user", content: trimmedInput });
    }

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Error al comunicarse con Nora ISP");
      }

      if (data.content) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content },
        ]);
      } else {
        throw new Error("Respuesta vacía del servidor.");
      }
    } catch (err: unknown) {
      console.error("[NORA_CHAT_ERROR]:", err);
      const msg = err instanceof Error ? err.message : "Error inesperado de comunicación.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-950 font-sans">
      {/* Barra Superior de Control de Nora */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 font-bold text-white shadow-md shadow-cyan-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-white">Nora Copilot (Nivel 3 FTTH & ERP)</h1>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conectado a Groq
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Modo adaptativo: Atención empática a abonados y precisión técnica para cuadrillas de fibra
            </p>
          </div>
        </div>

        {/* Interruptor de Inyección de Contexto Simulado */}
        <div className="flex items-center gap-3 bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-700/80">
          <Database className={`h-4 w-4 ${injectContext ? "text-cyan-400" : "text-slate-400"}`} />
          <div className="text-left">
            <span className="block text-xs font-semibold text-slate-200">
              Inyectar Contexto Simulado (ERP Sandbox)
            </span>
            <span className="block text-[10px] text-slate-400">
              {injectContext ? "Incluye Clientes, Cajas NAP y OLTs" : "Sin contexto del ERP"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setInjectContext(!injectContext)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              injectContext ? "bg-cyan-600" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                injectContext ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Área de Mensajes */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
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

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                  }`}
                >
                  {msg.content}
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
                    Nora está calculando telemetría óptica y evaluando el contexto...
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
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Pregúntale a Nora por un abonado, atenuación en una NAP, o comando MikroTik..."
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
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Cargando Nora Copilot...</div>}>
      <NoraChatInner />
    </Suspense>
  );
}
