"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function DiagnosticChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola, soy Nora, el núcleo de Inteligencia Artificial (CRM, ERP y Soporte Técnico Nivel 3). ¿En qué puedo asistirte hoy con la red FTTH, clientes o equipos MikroTik?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setErrorMsg(null);
    const newMessages: Message[] = [...messages, { role: "user", content: trimmedInput }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
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
      console.error("[DIAGNOSTIC_CHAT_ERROR]:", err);
      const msg = err instanceof Error ? err.message : "Error inesperado de comunicación.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    if (isLoading) return;
    setInput(question);
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Header Corporativo */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 font-bold text-white shadow-md shadow-cyan-500/20">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-white">Nora ISP Core</h1>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Consola de Diagnóstico Directo • FTTH / MikroTik / CRM N3
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500 hidden sm:block">
            <span>Motor: Groq / Llama-3.3-70B</span>
          </div>
        </div>
      </header>

      {/* Sugerencias Rápidas para pruebas de diagnóstico */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 px-6 py-2">
        <div className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto text-xs text-slate-400 scrollbar-none py-1">
          <span className="font-medium text-slate-500 shrink-0">Pruebas rápidas:</span>
          <button
            onClick={() =>
              handleQuickQuestion(
                "Tengo una ONU con potencia óptica recibida de -29.8 dBm en una caja NAP de 1x8. ¿Qué atenuación y diagnóstico das?"
              )
            }
            className="rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-1 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors shrink-0"
          >
            Diagnóstico Óptico (-29.8 dBm)
          </button>
          <button
            onClick={() =>
              handleQuickQuestion(
                "¿Cómo creo un PPPoE Server en MikroTik con interfaz vlan100 y cola de 100M/50M para un cliente?"
              )
            }
            className="rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-1 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors shrink-0"
          >
            Configuración MikroTik PPPoE
          </button>
          <button
            onClick={() =>
              handleQuickQuestion(
                "Soy el cliente Juan Pérez. Me cortaron el servicio de internet hoy y ya pagué la factura hace una hora."
              )
            }
            className="rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-1 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors shrink-0"
          >
            Reclamo CRM / Facturación
          </button>
        </div>
      </div>

      {/* Contenedor de Mensajes */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg text-xs font-bold ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-cyan-700 text-cyan-100 border border-cyan-500/30"
                  }`}
                >
                  {isUser ? "TÚ" : "NR"}
                </div>

                {/* Burbuja de Mensaje */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
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

          {/* Loader de IA */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-cyan-700 text-xs font-bold text-cyan-100 border border-cyan-500/30">
                NR
              </div>
              <div className="rounded-2xl rounded-tl-none border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:200ms]"></span>
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:400ms]"></span>
                  <span className="ml-2 text-xs text-slate-400">Procesando diagnóstico FTTH/CRM...</span>
                </div>
              </div>
            </div>
          )}

          {/* Alerta de Error */}
          {errorMsg && (
            <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-4 text-sm text-rose-300">
              <span className="font-semibold">Error:</span> {errorMsg}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input de Envío */}
      <footer className="border-t border-slate-800 bg-slate-900/90 p-4 backdrop-blur">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Escribe tu consulta técnica (GPON, dBm, MikroTik) o reclamo de cliente..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 transition"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex items-center justify-center rounded-xl bg-cyan-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <span className="text-xs">Enviando...</span>
            ) : (
              <span>Enviar</span>
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}
