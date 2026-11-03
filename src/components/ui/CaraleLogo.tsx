import React from "react";

interface CaraleLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Isotipo oficial de CARALE Comunicaciones
 * Estructura: Antena / Letra "A" estilizada con ondas de radiación y telecomunicación superiores.
 * Paleta: Blanco puro (#ffffff) para el cuerpo estructural, cian eléctrico (#06b6d4) para las ondas de emisión y resplandor neón.
 */
export function CaraleLogo({ className = "h-7 w-7 text-cyan-400", size, ...props }: CaraleLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <defs>
        {/* Filtro Glow Neón para las ondas de radiación */}
        <filter id="carale-cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#06b6d4" floodOpacity="0.8" />
        </filter>
        {/* Gradiente cian a azul para travesaños y acentos */}
        <linearGradient id="carale-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* 1. Ondas de radiación / emisión superiores (RF & Telecom Signal Waves) */}
      <g filter="url(#carale-cyan-glow)" stroke="#06b6d4" strokeLinecap="round">
        {/* Onda exterior superior */}
        <path
          d="M20 22 C30 10, 70 10, 80 22"
          strokeWidth="4"
          fill="none"
          opacity="0.85"
        />
        {/* Onda intermedia */}
        <path
          d="M28 29 C36 19, 64 19, 72 29"
          strokeWidth="3.5"
          fill="none"
          opacity="0.95"
        />
        {/* Onda focal interna */}
        <path
          d="M37 36 C42 30, 58 30, 63 36"
          strokeWidth="3"
          fill="none"
        />
      </g>

      {/* 2. Emisor central en la cúspide (Foco de antena) */}
      <circle cx="50" cy="38" r="3.5" fill="#22d3ee" />
      <circle cx="50" cy="38" r="1.5" fill="#ffffff" />

      {/* 3. Cuerpo principal de la Antena / "A" (Blanco puro para máximo contraste) */}
      <path
        d="M50 42 L25 88 L34 88 L46 64 L54 64 L66 88 L75 88 Z"
        fill="#ffffff"
      />

      {/* 4. Travesaño central de la A y enlace de radio (Cian neón / gradiente) */}
      <path
        d="M40 70 L60 70 L58 64 L42 64 Z"
        fill="url(#carale-accent-grad)"
      />

      {/* 5. Base y pedestal sutil con guía óptica inferior */}
      <path
        d="M22 92 L78 92"
        stroke="#06b6d4"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="50" cy="80" r="2" fill="#22d3ee" />
    </svg>
  );
}

interface CaraleBrandProps {
  className?: string;
  logoClassName?: string;
  subtitle?: string;
  showBadge?: boolean;
  badgeText?: string;
}

/**
 * Componente oficial de marca CARALE para cabeceras y portales
 */
export function CaraleBrand({
  className = "",
  logoClassName = "h-9 w-9 text-cyan-400 shrink-0",
  subtitle = "TELECOMUNICACIONES & DATOS",
  showBadge = true,
  badgeText = "Fibra Pura",
}: CaraleBrandProps) {
  return (
    <div className={`flex items-center gap-3 group select-none transition-all duration-200 ${className}`}>
      {/* Contenedor del Isotipo con halo luminoso reactivo */}
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-950 via-slate-900 to-blue-950 border border-cyan-500/30 p-1.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 group-hover:border-cyan-400/60 group-hover:shadow-cyan-500/35 transition-all duration-300">
        <div className="absolute inset-0 rounded-2xl bg-cyan-400/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CaraleLogo className={logoClassName} />
      </div>

      {/* Bloque Tipográfico Oficial */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold tracking-wider text-white text-lg leading-tight group-hover:text-cyan-50 transition-colors">
            CARALE
          </span>
          {showBadge && (
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/90 px-2 py-0.5 rounded-full border border-cyan-800/60 uppercase tracking-wider shadow-sm">
              {badgeText}
            </span>
          )}
        </div>
        <span className="block text-[9px] tracking-[0.22em] text-cyan-400 font-semibold uppercase truncate mt-0.5">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

export default CaraleLogo;

