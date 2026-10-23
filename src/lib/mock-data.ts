export interface ClienteMock {
  id: string;
  nombre: string;
  plan: string;
  ipPppoe: string;
  estadoPppoe: "Conectado" | "Desconectado";
  estadoFacturacion: "Al día" | "Moroso" | "Pendiente";
  oltConectada: string;
  cajaNap: string;
  potenciaDbm: number;
}

export interface NodoMock {
  id: string;
  nombre: string;
  tipo: "OLT" | "NAP" | "Troncal";
  ubicacion: string;
  estado: "Online" | "Warning" | "Critical";
  potenciaSalidaDbm: number;
  puertosOcupados: number;
  puertosTotales: number;
  atenuacionPromedio: string;
}

export interface TicketMock {
  id: string;
  cliente: string;
  asunto: string;
  prioridad: "Alta" | "Media" | "Baja";
  estado: "Abierto" | "En Proceso" | "Cerrado";
  creado: string;
}

export const MOCK_CLIENTES: ClienteMock[] = [
  {
    id: "CLI-1029",
    nombre: "Juan Carlos Gómez",
    plan: "Fibra 300 Mbps Simétrico",
    ipPppoe: "100.64.12.44",
    estadoPppoe: "Conectado",
    estadoFacturacion: "Al día",
    oltConectada: "OLT-HUAWEI-01 (Pon 1/2)",
    cajaNap: "NAP-02 (Barrio Norte)",
    potenciaDbm: -19.4,
  },
  {
    id: "CLI-1045",
    nombre: "María Elena Rostagno",
    plan: "Fibra 100 Mbps Residencial",
    ipPppoe: "100.64.14.89",
    estadoPppoe: "Desconectado",
    estadoFacturacion: "Al día",
    oltConectada: "OLT-FIBERHOME-02 (Pon 2/4)",
    cajaNap: "NAP-04 (Barrio Centro)",
    potenciaDbm: -31.2, // Alarma de potencia óptica
  },
  {
    id: "CLI-1088",
    nombre: "Transportes & Logística S.A.",
    plan: "Fibra Corporativa 500 Mbps + IP Fija",
    ipPppoe: "181.45.22.10",
    estadoPppoe: "Conectado",
    estadoFacturacion: "Moroso",
    oltConectada: "OLT-HUAWEI-01 (Pon 1/1)",
    cajaNap: "NAP-01 (Parque Industrial)",
    potenciaDbm: -17.8,
  },
];

export const MOCK_NODOS: NodoMock[] = [
  {
    id: "OLT-01",
    nombre: "OLT Principal Huawei SmartAX EA5800",
    tipo: "OLT",
    ubicacion: "DataCenter Central - Rack A3",
    estado: "Online",
    potenciaSalidaDbm: +5.2,
    puertosOcupados: 14,
    puertosTotales: 16,
    atenuacionPromedio: "0.35 dB/km",
  },
  {
    id: "OLT-02",
    nombre: "OLT Secundaria FiberHome AN5516-04",
    tipo: "OLT",
    ubicacion: "Subestación Nodo Oeste",
    estado: "Online",
    potenciaSalidaDbm: +4.8,
    puertosOcupados: 6,
    puertosTotales: 8,
    atenuacionPromedio: "0.38 dB/km",
  },
  {
    id: "NAP-04",
    nombre: "Caja NAP-04 Splitter 1x16",
    tipo: "NAP",
    ubicacion: "Av. San Martín 840 (Barrio Centro)",
    estado: "Critical",
    potenciaSalidaDbm: -30.5,
    puertosOcupados: 15,
    puertosTotales: 16,
    atenuacionPromedio: "Atenuación excesiva (> 30 dB)",
  },
  {
    id: "NAP-02",
    nombre: "Caja NAP-02 Splitter 1x8",
    tipo: "NAP",
    ubicacion: "Calle Las Heras 320 (Barrio Norte)",
    estado: "Online",
    potenciaSalidaDbm: -18.9,
    puertosOcupados: 7,
    puertosTotales: 8,
    atenuacionPromedio: "Atenuación normal (18.5 dB)",
  },
  {
    id: "NAP-01",
    nombre: "Caja NAP-01 Splitter 1x8 Balanceado",
    tipo: "NAP",
    ubicacion: "Ruta 9 Km 4 - Parque Industrial",
    estado: "Online",
    potenciaSalidaDbm: -17.2,
    puertosOcupados: 6,
    puertosTotales: 8,
    atenuacionPromedio: "Atenuación óptima",
  },
];

export const MOCK_TICKETS: TicketMock[] = [
  {
    id: "TCK-801",
    cliente: "María Elena Rostagno",
    asunto: "Pérdida de señal de fibra / LED LOS en rojo en la ONU",
    prioridad: "Alta",
    estado: "Abierto",
    creado: "Hace 24 min",
  },
  {
    id: "TCK-794",
    cliente: "Transportes & Logística S.A.",
    asunto: "Aviso de suspensión por mora de factura vencida marzo",
    prioridad: "Media",
    estado: "En Proceso",
    creado: "Hace 2 horas",
  },
  {
    id: "TCK-780",
    cliente: "Juan Carlos Gómez",
    asunto: "Solicitud de upgrade de plan a 600 Mbps",
    prioridad: "Baja",
    estado: "Abierto",
    creado: "Ayer",
  },
];

export const MOCK_KPIS = {
  clientesActivos: 1482,
  clientesMorosos: 27,
  nodosOltCaidos: 0,
  alertasCriticas: 1, // NAP-04
  ticketsAbiertos: 6,
  anchoBandaConsumido: "8.4 Gbps / 10 Gbps",
};
