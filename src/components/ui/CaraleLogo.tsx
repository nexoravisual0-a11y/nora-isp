import React from "react";

interface CaraleLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Isotipo oficial de CARALE Comunicaciones
 * Glifo lineal limpio (antena estilizada / "A" en trazo continuo) con dos arcos de emisión superiores.
 * Sin rellenos triangulares macizos.
 */
export function CaraleLogo({ className = "h-7 w-7 text-cyan-400", size, ...props }: CaraleLogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <defs>
        {/* Resplandor neón sutil para los arcos superiores de emisión */}
        <filter id="carale-signal-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#06b6d4" floodOpacity="0.75" />
        </filter>
      </defs>

      {/* 1. Dos arcos concéntricos superiores de emisión (ondas de radio / telecom) */}
      <g filter="url(#carale-signal-glow)" strokeLinecap="round">
        {/* Arco superior exterior */}
        <path
          d="M13 14 C19 7, 29 7, 35 14"
          stroke="#67e8f9"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Arco interior */}
        <path
          d="M18 19 C21.5 14.5, 26.5 14.5, 30 19"
          stroke="#06b6d4"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* 2. Cuerpo de la "A" / Antena estilizada en trazo continuo limpio (blanco/currentColor, abierto) */}
      <path
        d="M12 43 L23.2 23.5 C23.6 22.8, 24.4 22.8, 24.8 23.5 L36 43"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Barra horizontal arqueada (travesaño de la A y enlace de antena) */}
      <path
        d="M16.5 35.5 C20.5 33.8, 27.5 33.8, 31.5 35.5"
        stroke="#22d3ee"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* 4. Emisor focal / fotón óptico sutil en el ápice */}
      <circle cx="24" cy="22" r="1.5" fill="#67e8f9" />
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
 * Integración fluida, limpia y sin recuadros pesados
 */
export function CaraleBrand({
  className = "",
  logoClassName = "h-8 w-8 text-cyan-400 shrink-0",
  subtitle = "TELECOMUNICACIONES & DATOS",
  showBadge = true,
  badgeText = "Fibra Pura",
}: CaraleBrandProps) {
  return (
    <div className={`flex items-center gap-3 group select-none transition-all duration-200 ${className}`}>
      {/* Isotipo fluido sin recuadro rígido */}
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <CaraleLogo className={`${logoClassName} transition-all duration-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.35)] group-hover:drop-shadow-[0_0_14px_rgba(34,211,238,0.55)]`} />
      </div>

      {/* Bloque Tipográfico Oficial */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-white text-lg leading-tight group-hover:text-cyan-50 transition-colors">
            CARALE
          </span>
          {showBadge && (
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60 uppercase tracking-wider">
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
