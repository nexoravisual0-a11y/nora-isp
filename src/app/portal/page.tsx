"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cleanMessageText } from "@/lib/utils";
import {
  Wifi,
  Building2,
  Network,
  ShieldCheck,
  Zap,
  PhoneCall,
  Send,
  Paperclip,
  Bot,
  User,
  X,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Globe,
  Clock,
  Layers,
  ChevronDown,
} from "lucide-react";

interface CommercialPlanData {
  id: number;
  category: string;
  title: string;
  badge: string | null;
  description: string;
  features: string[];
  cta_text: string;
  cta_action: string;
  display_order: number;
  is_active: boolean;
}

const DEFAULT_PLANS: CommercialPlanData[] = [
  {
    id: 1,
    category: "residencial",
    title: "Internet Fibra Residencial",
    badge: null,
    description: "Velocidades simétricas para gaming competitivo, streaming 4K y teletrabajo sin microcortes por atenuación.",
    features: [
      "Planes de 100, 300, 600 Mbps y 1 Gbps",
      "Módem ONU Dual Band WiFi 6 Gigabit",
      "Autogestión y soporte instantáneo vía Caralita",
    ],
    cta_text: "Consultar Cobertura Barrial",
    cta_action: "cobertura",
    display_order: 1,
    is_active: true,
  },
  {
    id: 2,
    category: "b2b",
    title: "Enlaces Dedicados B2B",
    badge: "Misión Crítica",
    description: "Canales 1:1 no compartidos para corporaciones, industrias y entidades financieras con disponibilidad auditada.",
    features: [
      "SLA Garantizado del 99.8% por contrato",
      "Pool de IPs Públicas Fijas y BGP Multi-homing",
      "Ejecutivo de cuentas técnico y guardia NOC prioritaria",
    ],
    cta_text: "Solicitar Propuesta Corporativa",
    cta_action: "corporativo",
    display_order: 2,
    is_active: true,
  },
  {
    id: 3,
    category: "mayorista",
    title: "Transporte & Mayorista",
    badge: null,
    description: "Interconexión de fibra oscura, lambdas protegidas y capacidad de tránsito IP para operadores de red y cooperativas.",
    features: [
      "Puertos 10G y 100G en anillo metropolitano",
      "Interconexión directa en CABASE / IXP Buenos Aires",
      "Rutas redundantes de fibra y bypass DWDM",
    ],
    cta_text: "Contactar Ingeniería Carrier",
    cta_action: "carrier",
    display_order: 3,
    is_active: true,
  },
];
function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function RevealSection({
  children,
  className = "",
  delay = 0,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      id={id}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${isVisible
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-8 pointer-events-none"
        } ${className}`}
    >
      {children}
    </div>
  );
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  attachmentName?: string | null;
  photoUrl?: string | null;
  technicalPayload?: {
    tipo: "cliente" | "nodo" | "ticket";
    titulo: string;
    subtitulo?: string;
    datos: Array<{ label: string; valor: string; alerta?: boolean; critico?: boolean }>;
  } | null;
}

export default function CaraleCorporativaUI() {
  // Estado de los Planes Comerciales (Consumo dinámico)
  const [plans, setPlans] = useState<CommercialPlanData[]>(DEFAULT_PLANS);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch("/api/commercial-plans");
        const data = await res.json();
        if (data.success && Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans.filter((p: CommercialPlanData) => p.is_active));
        }
      } catch (e) {
        // Fallback transparente a DEFAULT_PLANS
      } finally {
        setIsLoadingPlans(false);
      }
    }
    loadPlans();
  }, []);

  // Estado del Widget Flotante de Caralita
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "¡Hola! 👋 Te damos la bienvenida a Carale Internet. Soy Caralita, tu asesora de ventas y asistente técnica oficial.\n\n¿Deseas cotizar cobertura para tu hogar, consultar por enlaces dedicados B2B con SLA 99.8% o gestionar soporte técnico con tu DNI?",
    },
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático en el chat
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending, isChatOpen]);

  // Previsualización de archivo/comprobante
  useEffect(() => {
    if (!selectedFile) {
      setPhotoPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleQuickPrompt = (promptText: string) => {
    setIsChatOpen(true);
    setInputMessage(promptText);
  };

  /**
   * Conexión del Widget IA a /api/chat con source: 'portal'
   */
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedText = inputMessage.trim();
    if ((!trimmedText && !selectedFile) || isSending) return;

    setChatError(null);
    setIsSending(true);

    let base64Image: string | null = null;

    try {
      if (selectedFile) {
        base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(selectedFile);
        });
      }

      const promptText =
        trimmedText ||
        (base64Image
          ? "Adjunto comprobante de pago / fotografía para procesamiento contable o técnico."
          : "");

      const userMsg: ChatMessage = {
        role: "user",
        content: promptText,
        attachmentName: selectedFile ? selectedFile.name : null,
        photoUrl: photoPreview,
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInputMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          source: "portal",
          image: base64Image,
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
        throw new Error("Respuesta vacía del servidor.");
      }
    } catch (err) {
      console.error("[PORTAL_CHAT_ERROR]:", err);
      const msg = err instanceof Error ? err.message : "Error de conexión temporal.";
      setChatError(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* Fondo con Glow y Micro-Efectos Tecnológicos */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* 1. Navbar Institucional Premium */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 font-black text-white text-xl shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform duration-200">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-lg">CARALE</span>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/90 px-2 py-0.5 rounded-full border border-cyan-800/60 uppercase tracking-wider">
                  Fibra Pura
                </span>
              </div>
              <span className="block text-[11px] font-medium text-slate-400">
                Telecomunicaciones & Datos
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#residencial" className="hover:text-cyan-400 transition">
              Residencial
            </a>
            <a href="#empresas" className="hover:text-cyan-400 transition flex items-center gap-1.5">
              <span>Empresas B2B</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                SLA 99.8%
              </span>
            </a>
            <a href="#mayorista" className="hover:text-cyan-400 transition">
              Mayorista & Tránsito
            </a>
            <a href="#infraestructura" className="hover:text-cyan-400 transition">
              Red & Cobertura
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsChatOpen(true);
                setInputMessage("Hola, quiero consultar el estado de mi servicio con mi DNI o regularizar un pago.");
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 shadow-sm transition"
            >
              <User className="h-3.5 w-3.5 text-cyan-400" />
              <span>Mi Cuenta / Autogestión</span>
            </button>
            <button
              onClick={() => {
                setIsChatOpen(true);
                setInputMessage("Hola Caralita, quiero consultar cobertura y contratar fibra óptica en mi barrio.");
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-xs text-white shadow-lg shadow-cyan-500/25 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Contratar Ahora</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section de Telecomunicaciones Avanzado */}
      <RevealSection className="relative z-10 pt-16 pb-20 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Capa de Fondo Tecnológico del Hero con Radial Gradients, Resplandor y Grid Pattern de Fibra */}
        <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Gradiente radial principal de telecomunicaciones */}
          <div className="absolute w-[800px] h-[550px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-600/25 via-blue-900/15 to-transparent blur-[110px] -top-20" />
          {/* Núcleo de resplandor óptico centrado detrás del título para volumen 3D */}
          <div className="absolute w-[450px] h-[220px] bg-cyan-400/20 blur-[80px] rounded-full -top-6 transform -rotate-3" />
          {/* Malla tecnológica / grid de fibra óptica con máscara de desvanecimiento */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d415_1px,transparent_1px),linear-gradient(to_bottom,#06b6d415_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_75%)] opacity-70" />
        </div>

        <div className="text-center max-w-5xl mx-auto space-y-8 relative">
          {/* Badge Superior Tecnológico con Pulso Neón */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-xs font-semibold text-cyan-300 shadow-lg shadow-cyan-500/20 backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <span className="tracking-wide">Infraestructura FTTH & Carrier-Grade Cloud Core en Argentina</span>
          </div>

          {/* Título de Alto Impacto Telecom */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
            La red de fibra óptica{" "}
            <span className="relative whitespace-nowrap">
              <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(6,182,212,0.45)]">
                más avanzada
              </span>
            </span>{" "}
            para tu hogar y empresa.
          </h1>

          {/* Subtítulo Tecnológico Descriptivo */}
          <p className="text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed max-w-3xl mx-auto">
            Conectividad simétrica de ultrabaja latencia, enlaces dedicados B2B con SLA 99.8% y
            transporte mayorista directo a los principales puntos de intercambio de tráfico de Argentina.
          </p>

          {/* 3 Píldoras Interactivas Flotantes Glassmorphism con Brillo y Pulsos de Luz */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400/60 backdrop-blur-xl shadow-lg shadow-cyan-950/40 transition-all hover:scale-[1.03]">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              <span className="text-xs font-bold text-cyan-200">
                Latencia Ultrabaja (&lt; 5ms) — Rutas Directas CABASE
              </span>
            </div>

            <div className="group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-400/60 backdrop-blur-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.03]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              <span className="text-xs font-bold text-emerald-200">
                Disponibilidad 99.8% SLA Garantizado
              </span>
            </div>

            <div className="group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/80 border border-blue-500/30 hover:border-blue-400/60 backdrop-blur-xl shadow-lg shadow-blue-950/40 transition-all hover:scale-[1.03]">
              <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-pulse" />
              <span className="text-xs font-bold text-blue-200">
                Red FTTH Simétrica 100% Fibra Óptica Pura
              </span>
            </div>
          </div>

          {/* Botones de Acción (CTA) de Alto Impacto */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#residencial"
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/35 hover:shadow-cyan-400/50 transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2.5 border border-cyan-400/40"
            >
              <span>Ver Planes Residenciales y B2B</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <button
              onClick={() => {
                setIsChatOpen(true);
                setInputMessage("Hola Caralita, quiero realizar un test de cobertura inmediata para mi domicilio.");
              }}
              className="group px-7 py-4 rounded-2xl border border-cyan-500/40 hover:border-cyan-400 bg-slate-900/80 hover:bg-slate-800/90 text-cyan-200 hover:text-white font-bold text-sm shadow-lg shadow-cyan-950/50 backdrop-blur-xl transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2.5"
            >
              <Zap className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Test de Cobertura Inmediata</span>
              <ChevronRight className="h-4 w-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Métricas Operativas de Red */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md shadow-inner">
              <span className="block text-2xl md:text-3xl font-black text-cyan-400">99.8%</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                SLA Garantizado
              </span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md shadow-inner">
              <span className="block text-2xl md:text-3xl font-black text-emerald-400">100%</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Fibra Pura GPON
              </span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md shadow-inner">
              <span className="block text-2xl md:text-3xl font-black text-blue-400">&lt; 5 ms</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Latencia CABASE IXP
              </span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md shadow-inner">
              <span className="block text-2xl md:text-3xl font-black text-indigo-400">24/7/365</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Monitoreo NOC IA
              </span>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 3. Grilla de Servicios con Reveal Fluido */}
      <section id="residencial" className="relative z-10 py-20 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800/60">
              Soluciones Integrales de Conectividad
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ingeniería óptica para cada necesidad de tráfico
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Desde hogares de alto rendimiento hasta interconexiones de centros de datos y carriers.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((p, idx) => {
              const isB2B = p.category === "b2b";
              const isMayorista = p.category === "mayorista";

              return (
                <RevealSection
                  key={p.id}
                  delay={(idx + 1) * 100}
                  className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 group ${isB2B
                      ? "border-2 border-cyan-500/60 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-cyan-500/20"
                      : "border border-slate-800 bg-slate-900/80 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10"
                    }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md tracking-wider">
                      {p.badge}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform ${isB2B
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : isMayorista
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                        }`}
                    >
                      {isB2B ? (
                        <Building2 className="h-6 w-6" />
                      ) : isMayorista ? (
                        <Network className="h-6 w-6" />
                      ) : (
                        <Wifi className="h-6 w-6" />
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white">{p.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>

                    <ul className="space-y-2.5 pt-4 text-xs text-slate-300">
                      {(Array.isArray(p.features) ? p.features : []).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2">
                          <CheckCircle2
                            className={`h-4 w-4 shrink-0 ${isB2B ? "text-cyan-400" : isMayorista ? "text-blue-400" : "text-emerald-400"
                              }`}
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <button
                      onClick={() => {
                        setIsChatOpen(true);
                        if (p.cta_action === "cobertura") {
                          setInputMessage(`Hola Caralita, quiero consultar cobertura y planes para: ${p.title}`);
                        } else if (p.cta_action === "corporativo") {
                          setInputMessage(`Hola Caralita, solicito una propuesta corporativa de: ${p.title}`);
                        } else if (p.cta_action === "carrier") {
                          setInputMessage(`Hola Caralita, quiero consultar con ingeniería sobre: ${p.title}`);
                        } else {
                          setInputMessage(`Hola Caralita, quiero información sobre el plan ${p.title}`);
                        }
                      }}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition shadow-sm ${isB2B
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25"
                          : "bg-slate-800 hover:bg-cyan-500 hover:text-white text-slate-200"
                        }`}
                    >
                      {p.cta_text}
                    </button>
                  </div>
                </RevealSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Banner Institucional con Scroll Reveal */}
      <RevealSection id="infraestructura" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800/60">
              <Bot className="h-3.5 w-3.5" />
              <span>Cerebro Autónomo de Carale Internet</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              ¿Ya eres cliente de Carale? Autogestiónate en segundos.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Caralita audita en vivo la potencia óptica de tu módem en la Base de Datos Central,
              recibe comprobantes de pago para habilitación inmediata y genera reclamos técnicos con
              seguimiento de cuadrilla en tiempo real.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setIsChatOpen(true);
                setInputMessage("Quiero consultar el estado de mi conexión de fibra con mi DNI.");
              }}
              className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition"
            >
              Consultar con mi DNI
            </button>
            <button
              onClick={() => {
                setIsChatOpen(true);
                setInputMessage("Quiero adjuntar mi comprobante de pago para registrar la factura.");
              }}
              className="px-6 py-3.5 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Paperclip className="h-4 w-4 text-cyan-400" />
              <span>Subir Comprobante</span>
            </button>
          </div>
        </div>
      </RevealSection>

      {/* 5. Tarea 2: Footer Corporativo con Firma Oficial Exacta y Resguardo de Padding */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-12 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left pr-0 md:pr-48">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-extrabold text-white text-sm">CARALE</span>
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800/50">
                by Nora
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Red FTTH de Telecomunicaciones & ISP Cloud Core.
            </p>
          </div>

          {/* Firma exacta global */}
          <div className="text-zinc-400 text-center md:text-left text-[11px] leading-relaxed">
            <div>
              Desarrollado por: <strong className="text-slate-200">Nexora One</strong> | Soporte:{" "}
              <a href="tel:3786414533" className="text-cyan-400 hover:underline font-mono">
                3786414533
              </a>{" "}
              | Email:{" "}
              <a
                href="mailto:nexoraone@nexativanews.com.ar"
                className="text-cyan-400 hover:underline font-mono"
              >
                nexoraone@nexativanews.com.ar
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* 6. El Rol Estrella: Widget Flotante Premium de Caralita con Avatar Oficial */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="group relative flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white font-bold text-xs shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all duration-300 hover:scale-105 active:scale-95 border border-cyan-300/30"
          >
            <div className="relative">
              <img
                src="/caralita-avatar.jpg"
                alt="Avatar de Caralita"
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover object-top ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
            </div>
            <div className="text-left">
              <span className="block leading-none">Hablá con Caralita</span>
              <span className="text-[9px] text-cyan-100 font-normal">Ventas & Soporte IA</span>
            </div>
          </button>
        ) : (
          <div className="w-[92vw] sm:w-[420px] h-[580px] rounded-3xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header del Chat */}
            <div className="h-16 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/caralita-avatar.jpg"
                    alt="Caralita Avatar Oficial"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover object-top ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/30"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Caralita</span>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 inline-flex items-center gap-1 font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      En línea
                    </span>
                  </div>
                  <span className="block text-[10px] text-slate-400">
                    Ventas B2B, Residencial & Reclamos
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Minimizar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chips Rápidos de Conversación */}
            <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => handleQuickPrompt("Quiero saber cobertura y planes en mi barrio")}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-medium text-slate-300 border border-slate-700/60 transition"
              >
                📍 Cobertura Barrial
              </button>
              <button
                onClick={() => handleQuickPrompt("Cotizar Enlace Dedicado Corporativo con SLA 99.8%")}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-medium text-slate-300 border border-slate-700/60 transition"
              >
                🏢 Enlace B2B SLA 99.8%
              </button>
              <button
                onClick={() => handleQuickPrompt("Consultar estado técnico de mi conexión con mi DNI")}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-medium text-slate-300 border border-slate-700/60 transition"
              >
                🩺 Reclamo con DNI
              </button>
            </div>

            {/* Historial de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex gap-2.5 max-w-[88%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isUser
                        ? "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white"
                        : "bg-slate-800 text-cyan-400 border border-slate-700"
                        }`}
                    >
                      {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>

                    <div className="space-y-1.5">
                      <div
                        className={`rounded-2xl p-3 leading-relaxed shadow-sm ${isUser
                          ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none"
                          : "bg-slate-800/90 border border-slate-700/70 text-slate-200 rounded-tl-none"
                          }`}
                      >
                        {msg.photoUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-[200px]">
                            <img
                              src={msg.photoUrl}
                              alt="Comprobante"
                              className="w-full h-auto max-h-40 object-cover"
                            />
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{cleanMessageText(msg.content)}</p>
                      </div>

                      {msg.technicalPayload && (
                        <div className="rounded-xl border border-cyan-500/40 bg-slate-950/80 p-2.5 space-y-1.5">
                          <span className="font-bold text-white text-[11px] block">
                            {msg.technicalPayload.titulo}
                          </span>
                          <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                            {msg.technicalPayload.datos.map((item, i) => (
                              <div key={i} className="bg-slate-900 p-1.5 rounded border border-slate-800">
                                <span className="block text-slate-400 uppercase text-[8px]">
                                  {item.label}
                                </span>
                                <span className="font-semibold text-cyan-300">{item.valor}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
                    <Bot className="h-3.5 w-3.5 animate-spin" />
                  </div>
                  <div className="rounded-2xl bg-slate-800/90 border border-slate-700/70 px-3 py-2 text-xs text-slate-400 rounded-tl-none flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Caralita procesando tu consulta...</span>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {chatError}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Previsualización de Comprobante / Imagen adjunta */}
            {photoPreview && (
              <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-9 w-9 rounded-lg object-cover border border-cyan-500/40"
                  />
                  <div className="text-[11px]">
                    <span className="text-white block font-medium truncate max-w-[200px]">
                      {selectedFile?.name}
                    </span>
                    <span className="text-[9px] text-slate-400">Listo para enviar</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Input Footer del Widget */}
            <footer className="p-3 bg-slate-950/95 border-t border-slate-800 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-xl border transition ${selectedFile
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700"
                    }`}
                  title="Adjuntar comprobante o archivo"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    selectedFile
                      ? "Describe el comprobante..."
                      : "Escribe tu consulta o DNI..."
                  }
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />

                <button
                  type="submit"
                  disabled={(!inputMessage.trim() && !selectedFile) || isSending}
                  className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white shadow-md shadow-cyan-500/25 transition"
                  title="Enviar mensaje"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
