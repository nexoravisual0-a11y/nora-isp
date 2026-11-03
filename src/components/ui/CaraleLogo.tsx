import React from "react";

/**
 * Isotipo oficial de CARALE Comunicaciones
 * Utiliza directamente el recurso oficial provisto en /carale-isotipo.png
 */
export function CaraleLogo({ className = "h-8 w-8 object-contain" }: { className?: string }) {
  return (
    <img
      src="/carale-isotipo.png"
      alt="CARALE Comunicaciones"
      className={className}
    />
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
  logoClassName = "h-8 w-8 object-contain",
  subtitle = "TELECOMUNICACIONES & DATOS",
  showBadge = true,
  badgeText = "Fibra Pura",
}: CaraleBrandProps) {
  return (
    <div className={`flex items-center gap-3 group select-none transition-all duration-200 ${className}`}>
      {/* Isotipo oficial con escala suave en hover */}
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0">
        <CaraleLogo className={logoClassName} />
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
