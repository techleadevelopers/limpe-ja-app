import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLiveStatus } from "@/lib/api";
import { Booking, BookingStatus, LiveStatusPayload, Provider, VerificationStatus } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L, { type LatLngExpression, type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Activity, RefreshCcw } from "lucide-react";
import { useThrottle } from "@/hooks/use-throttle";

type ActiveProviderEntry = {
  provider: Provider;
  booking: Booking;
  lat: number;
  lng: number;
  engineStarted: boolean;
  isJoaquim: boolean;
};

const DEFAULT_CENTER: LatLngExpression = [-15.7801, -47.9292];

const createMarkerIcon = (color: string, pulsing = false): L.DivIcon => {
  const pulseRing = pulsing
    ? `<span style="position:absolute; inset:-6px; border-radius:999px; border:2px solid ${color}; animation: providerPulse 1.6s ease-out infinite;"></span>`
    : "";
  const animationStyle = pulsing
    ? `<style>
        @keyframes providerPulse {
          0% { transform: scale(0.6); opacity: 0.75; }
          70% { transform: scale(1.3); opacity: 0; }
          100% { opacity: 0; }
        }
      </style>`
    : "";
  const html = `
    <span style="position:relative; display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px;">
      ${pulseRing}
      <span style="width:16px; height:16px; border-radius:999px; background:${color}; box-shadow:0 0 12px ${color}80;"></span>
    </span>
    ${animationStyle}
  `;
  return L.divIcon({
    className: "",
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};

const engineMarkerIcon = createMarkerIcon("#16a34a", true);
const confirmedMarkerIcon = createMarkerIcon("#f97316", false);
const demoMarkerIcon = createMarkerIcon("#0e53e9", true);
const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "Pendente",
  [BookingStatus.CONFIRMED]: "Confirmado",
  [BookingStatus.ON_THE_WAY]: "A caminho",
  [BookingStatus.ARRIVED]: "Chegou",
  [BookingStatus.STARTED]: "Em andamento",
  [BookingStatus.FINISHED]: "Finalizado",
  [BookingStatus.CANCELED]: "Cancelado",
  [BookingStatus.PENDING_DISPUTE]: "Pendente de disputa",
  [BookingStatus.RESCHEDULED]: "Reagendado",
  [BookingStatus.PENDING_PROVIDER_CONFIRMATION]: "Aguardando provedor",
  [BookingStatus.REJECTED]: "Rejeitado",
  [BookingStatus.NO_SHOW]: "Não compareceu",
  [BookingStatus.PENDING_PAYMENT]: "Aguardando pagamento",
  [BookingStatus.EXPIRED]: "Expirado",
};

const statusLabel = (status: BookingStatus) =>
  BOOKING_STATUS_LABELS[status] ?? status;

const MapContainerComponent = MapContainer as unknown as React.ComponentType<any>;
const TileLayerComponent = TileLayer as unknown as React.ComponentType<any>;
const MarkerComponent = Marker as unknown as React.ComponentType<any>;

const parseCoordinate = (value?: number | string | null): number | null => {
  if (value === undefined || value === null) return null;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveCoordinates = (
  provider: Provider,
  booking: Booking,
): { lat: number; lng: number } | null => {
  const providerWithLast = provider as Provider & {
    lastLat?: number | string;
    lastLng?: number | string;
  };
  const latCandidates = [
    providerWithLast.lastLat,
    provider.latitude,
    provider.address?.latitude,
    booking.address?.latitude,
  ];
  const lngCandidates = [
    providerWithLast.lastLng,
    provider.longitude,
    provider.address?.longitude,
    booking.address?.longitude,
  ];
  const lat = latCandidates
    .map(parseCoordinate)
    .find((candidate) => candidate !== null);
  const lng = lngCandidates
    .map(parseCoordinate)
    .find((candidate) => candidate !== null);
  if (lat === undefined || lng === undefined || lat === null || lng === null) {
    return null;
  }
  return { lat, lng };
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const formatAvatarUrl = (seed: string) => {
  const numericSeed = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageId = (numericSeed % 95) + 1;
  return `https://randomuser.me/api/portraits/women/${imageId}.jpg`;
};

function ProviderAvatar({
  name,
  id,
}: {
  name: string;
  id?: string;
}) {
  const [useFallback, setUseFallback] = useState(false);
  const initials = getInitials(name || "PJ");
  return (
    <div className="h-10 w-10 rounded-full bg-slate-100 text-xs font-semibold uppercase text-slate-700">
      {!useFallback ? (
        <img
          src={formatAvatarUrl(id ? `${name}-${id}` : name)}
          alt={name}
          className="h-full w-full rounded-full object-cover"
          onError={() => setUseFallback(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-600">
          {initials || "PJ"}
        </div>
      )}
    </div>
  );
}

const EMPTY_LIVE_STATUS: LiveStatusPayload = {
  providers: [],
  confirmedBookings: [],
  activeBookings: [],
};

const isDemoEnv =
  typeof process !== "undefined" && process.env?.NODE_ENV === "demo";

type DemoProviderDefinition = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: BookingStatus;
  client: string;
  meta: string;
  engineStarted?: boolean;
};

const CITY_EXPANSION_GROUPS = [
  {
    baseId: "brasilia",
    cityName: "Brasília",
    lat: -15.7942,
    lng: -47.8822,
    note: "Capital federal rastreada no plano piloto",
  },
  {
    baseId: "goiania",
    cityName: "Goiânia",
    lat: -16.6864,
    lng: -49.2648,
    note: "Goiânia em monitoramento metropolitano",
  },
  {
    baseId: "belo-horizonte",
    cityName: "Belo Horizonte",
    lat: -19.9167,
    lng: -43.9345,
    note: "Belo Horizonte com alerta de chegada",
  },
  {
    baseId: "vitoria",
    cityName: "Vitória",
    lat: -20.3155,
    lng: -40.3128,
    note: "Vitória em rota costeira",
  },
  {
    baseId: "salvador",
    cityName: "Salvador",
    lat: -12.9777,
    lng: -38.5016,
    note: "Salvador com coordenação de segurança",
  },
];

const mgExpansionCities = [
  {
    baseId: "uberlandia",
    cityName: "Uberlândia",
    lat: -18.9208,
    lng: -48.2752,
  },
  {
    baseId: "uberaba",
    cityName: "Uberaba",
    lat: -19.7456,
    lng: -47.9389,
  },
  {
    baseId: "ituiutaba",
    cityName: "Ituiutaba",
    lat: -18.9870,
    lng: -49.4533,
  },
  {
    baseId: "patosdeminas",
    cityName: "Patos de Minas",
    lat: -18.5790,
    lng: -46.5169,
  },
  {
    baseId: "araguari",
    cityName: "Araguari",
    lat: -18.6479,
    lng: -48.1909,
  },
  {
    baseId: "araxa",
    cityName: "Araxá",
    lat: -19.5923,
    lng: -46.9410,
  },
  {
    baseId: "montes-claros",
    cityName: "Montes Claros",
    lat: -16.7289,
    lng: -43.8650,
  },
  {
    baseId: "sete-lagoas",
    cityName: "Sete Lagoas",
    lat: -19.4561,
    lng: -44.2434,
  },
  {
    baseId: "itabira",
    cityName: "Itabira",
    lat: -19.6197,
    lng: -43.2325,
  },
  {
    baseId: "joao-pinheiro",
    cityName: "João Pinheiro",
    lat: -17.7760,
    lng: -46.1680,
  },
  {
    baseId: "governador-valadares",
    cityName: "Governador Valadares",
    lat: -18.8569,
    lng: -41.9540,
  },
  {
    baseId: "teofilo-otoni",
    cityName: "Teófilo Otoni",
    lat: -17.8572,
    lng: -41.5070,
  },
  {
    baseId: "aracatuba",
    cityName: "Araçatuba",
    lat: -21.2059,
    lng: -50.4319,
  },
  {
    baseId: "presidente-prudente",
    cityName: "Presidente Prudente",
    lat: -22.1206,
    lng: -51.3840,
  },
  {
    baseId: "marilia",
    cityName: "Marília",
    lat: -22.2230,
    lng: -49.9435,
  },
  {
    baseId: "bauru",
    cityName: "Bauru",
    lat: -22.3145,
    lng: -49.0603,
  },
  {
    baseId: "assis",
    cityName: "Assis",
    lat: -22.6530,
    lng: -50.4124,
  },
  {
    baseId: "ourinhos",
    cityName: "Ourinhos",
    lat: -22.9823,
    lng: -49.8714,
  },
  {
    baseId: "birigui",
    cityName: "Birigui",
    lat: -21.2875,
    lng: -50.3393,
  },
  {
    baseId: "catanduva",
    cityName: "Catanduva",
    lat: -21.1399,
    lng: -48.9746,
  },
  {
    baseId: "jau",
    cityName: "Jaú",
    lat: -22.2917,
    lng: -48.5576,
  },
  {
    baseId: "botucatu",
    cityName: "Botucatu",
    lat: -22.8790,
    lng: -48.4568,
  },
  {
    baseId: "tres-lagoas",
    cityName: "Três Lagoas",
    lat: -20.7899,
    lng: -51.6983,
  },
  {
    baseId: "rio-de-janeiro",
    cityName: "Rio de Janeiro",
    lat: -22.9068,
    lng: -43.1729,
  },
  {
    baseId: "juiz-de-fora",
    cityName: "Juiz de Fora",
    lat: -21.7646,
    lng: -43.3487,
  },
  {
    baseId: "campos-dos-goytacazes",
    cityName: "Campos dos Goytacazes",
    lat: -21.7614,
    lng: -41.3183,
  },
  {
    baseId: "petropolis",
    cityName: "Petrópolis",
    lat: -22.5046,
    lng: -43.1782,
  },
  {
    baseId: "macae",
    cityName: "Macaé",
    lat: -22.3671,
    lng: -41.7859,
  },
  {
    baseId: "cabo-frio",
    cityName: "Cabo Frio",
    lat: -22.8890,
    lng: -42.0308,
  },
  {
    baseId: "guarapari",
    cityName: "Guarapari",
    lat: -20.6617,
    lng: -40.4998,
  },
  {
    baseId: "cachoeiro-de-itapemirim",
    cityName: "Cachoeiro de Itapemirim",
    lat: -20.8468,
    lng: -41.1081,
  },
  {
    baseId: "itaperuna",
    cityName: "Itaperuna",
    lat: -21.1969,
    lng: -42.1705,
  },
  {
    baseId: "muriae",
    cityName: "Muriaé",
    lat: -21.1309,
    lng: -42.3394,
  },
  {
    baseId: "uba",
    cityName: "Ubá",
    lat: -21.1258,
    lng: -42.9474,
  },
  {
    baseId: "barbacena",
    cityName: "Barbacena",
    lat: -21.2330,
    lng: -43.7756,
  },
  {
    baseId: "conselheiro-lafaiete",
    cityName: "Conselheiro Lafaiete",
    lat: -20.6633,
    lng: -43.7871,
  },
  {
    baseId: "itaguai",
    cityName: "Itaguaí",
    lat: -22.8091,
    lng: -43.7236,
  },
];

const expandCityEntries = (group: typeof CITY_EXPANSION_GROUPS[number]) =>
  Array.from({ length: 4 }, (_, index) => ({
    id: `${group.baseId}-${index + 1}`,
    name: `${group.cityName} ${index + 1}`,
    lat: group.lat + 0.001 * index,
    lng: group.lng + 0.0015 * index,
    status: BookingStatus.STARTED,
    client: `Cliente ${index + 1}`,
    meta: group.note,
    engineStarted: true,
  }));

const expandMgCities = (group: typeof mgExpansionCities[number]) =>
  Array.from({ length: 4 }, (_, index) => ({
    id: `${group.baseId}-${index + 1}`,
    name: `${group.cityName} ${index + 1}`,
    lat: group.lat + 0.001 * index,
    lng: group.lng + 0.0015 * index,
    status: BookingStatus.STARTED,
    client: `Cliente ${index + 1}`,
    meta: `${group.cityName} - serviço em andamento`,
    engineStarted: true,
  }));

const DEMO_PROVIDER_DEFINITIONS: DemoProviderDefinition[] = [
  {
    id: "regina-perez",
    name: "Regina Perez",
    lat: -23.547,
    lng: -46.640,
    status: BookingStatus.ON_THE_WAY,
    client: "Marcelo Lima",
    meta: "Check-in de partida registrado há 2 min",
    engineStarted: false,
  },
  {
    id: "mariana-silva",
    name: "Mariana Silva",
    lat: -23.5525,
    lng: -46.6321,
    status: BookingStatus.STARTED,
    client: "Carla Menezes",
    meta: "Cerca digital confirmada na Zona Oeste de SP",
    engineStarted: true,
  },
  {
    id: "fernanda-costa",
    name: "Fernanda Costa",
    lat: -23.5634,
    lng: -46.6248,
    status: BookingStatus.STARTED,
    client: "Carlos Andrade",
    meta: "Auditoria de sessão ativa em Pinheiros",
    engineStarted: true,
  },
  {
    id: "ana-rodrigues",
    name: "Ana Rodrigues",
    lat: -23.5652,
    lng: -46.6320,
    status: BookingStatus.STARTED,
    client: "Daniela Souza",
    meta: "Serviço em andamento na região central",
    engineStarted: true,
  },
  {
    id: "patricia-lima",
    name: "Patrícia Lima",
    lat: -23.5532,
    lng: -46.6479,
    status: BookingStatus.STARTED,
    client: "Felipe Pires",
    meta: "Confirmado em Perdizes com GPS estabilizado",
    engineStarted: true,
  },
  {
    id: "bruna-santos",
    name: "Bruna Santos",
    lat: -23.5579,
    lng: -46.6146,
    status: BookingStatus.STARTED,
    client: "Laura Duarte",
    meta: "Cliente recebeu alerta de chegada na Mooca",
    engineStarted: true,
  },
  {
    id: "laura-oliveira",
    name: "Laura Oliveira",
    lat: -23.5365,
    lng: -46.6296,
    status: BookingStatus.STARTED,
    client: "Rodrigo Castro",
    meta: "Auditoria de sessão ativa na Vila Mariana",
    engineStarted: true,
  },
  {
    id: "juliana-ferreira",
    name: "Juliana Ferreira",
    lat: -23.5451,
    lng: -46.6242,
    status: BookingStatus.STARTED,
    client: "Tati Ferreira",
    meta: "GPS confirma presença no endereço da Consolação",
    engineStarted: true,
  },
  {
    id: "renata-moura",
    name: "Renata Moura",
    lat: -23.5621,
    lng: -46.6169,
    status: BookingStatus.STARTED,
    client: "Luís Andrade",
    meta: "Serviço em execução com alerta passivo ligado em Niterói",
    engineStarted: true,
  },
  {
    id: "sabrina-martins",
    name: "Sabrina Martins",
    lat: -23.5478,
    lng: -46.6311,
    status: BookingStatus.STARTED,
    client: "Paula Menezes",
    meta: "Pagamento bloqueado até check-out mútuo",
    engineStarted: true,
  },
  {
    id: "victor-campos-1",
    name: "Victor Campos",
    lat: -22.9068,
    lng: -47.0625,
    status: BookingStatus.STARTED,
    client: "Aline Prado",
    meta: "Serviço em andamento no centro de Campinas",
    engineStarted: true,
  },
  {
    id: "camila-campos-2",
    name: "Camila Campos",
    lat: -22.9113,
    lng: -47.0568,
    status: BookingStatus.STARTED,
    client: "Maria Pires",
    meta: "Rota no distrito do Cambuí",
    engineStarted: true,
  },
  {
    id: "gabriela-jundiai-1",
    name: "Gabriela Souza",
    lat: -23.1857,
    lng: -46.8865,
    status: BookingStatus.STARTED,
    client: "Luciana Braga",
    meta: "Monitoramento em andamento em Jundiaí",
    engineStarted: true,
  },
  {
    id: "renan-jundiai-2",
    name: "Renan Cardoso",
    lat: -23.1995,
    lng: -46.8782,
    status: BookingStatus.STARTED,
    client: "Tiago Costa",
    meta: "Check-in confirmado próximo à estação central",
    engineStarted: true,
  },
  {
    id: "paula-caraguatatuba-1",
    name: "Paula Ribeiro",
    lat: -23.6180,
    lng: -45.4125,
    status: BookingStatus.STARTED,
    client: "Fernando Lopes",
    meta: "Operação costeira em Caraguatatuba",
    engineStarted: true,
  },
  {
    id: "leo-caraguatatuba-2",
    name: "Leo Santos",
    lat: -23.6085,
    lng: -45.3888,
    status: BookingStatus.STARTED,
    client: "Camila Nunes",
    meta: "Cliente aguardando chegada na Praia do Centro",
    engineStarted: true,
  },
  {
    id: "bianca-caraguatatuba-3",
    name: "Bianca Silva",
    lat: -23.6138,
    lng: -45.3940,
    status: BookingStatus.STARTED,
    client: "Rafael Torres",
    meta: "Serviço em andamento em Caraguá",
    engineStarted: true,
  },
  {
    id: "rafaela-pg-1",
    name: "Rafaela Pereira",
    lat: -24.0068,
    lng: -46.3970,
    status: BookingStatus.STARTED,
    client: "Daniel Seixas",
    meta: "Praia Grande em monitoramento passivo",
    engineStarted: true,
  },
  {
    id: "marcelo-pg-2",
    name: "Marcelo Dias",
    lat: -24.0129,
    lng: -46.4055,
    status: BookingStatus.STARTED,
    client: "Marina Lima",
    meta: "Alerta de desvio próximo ao canal",
    engineStarted: true,
  },
  {
    id: "natasha-pg-3",
    name: "Natasha Lima",
    lat: -24.0179,
    lng: -46.3852,
    status: BookingStatus.STARTED,
    client: "Heitor Gomes",
    meta: "Checklist completo e pagamento pendente",
    engineStarted: true,
  },
  {
    id: "claudia-itapetininga-1",
    name: "Cláudia Souza",
    lat: -23.5923,
    lng: -48.0559,
    status: BookingStatus.STARTED,
    client: "Rafael Mota",
    meta: "Serviço rural em Itapetininga",
    engineStarted: true,
  },
  {
    id: "ronaldo-itapetininga-2",
    name: "Ronaldo Andrade",
    lat: -23.5938,
    lng: -48.0643,
    status: BookingStatus.STARTED,
    client: "Fernanda Marques",
    meta: "Chegou à região industrial",
    engineStarted: true,
  },
  {
    id: "eduardo-itapetininga-3",
    name: "Eduardo Santos",
    lat: -23.5991,
    lng: -48.0737,
    status: BookingStatus.STARTED,
    client: "Márcia Rios",
    meta: "Operação de pós-obra",
    engineStarted: true,
  },
  {
    id: "fabiola-itapetininga-4",
    name: "Fabiola Lima",
    lat: -23.5975,
    lng: -48.0820,
    status: BookingStatus.STARTED,
    client: "Arthur Lima",
    meta: "Checklist completo com foto de chegada",
    engineStarted: true,
  },
  {
    id: "sergio-itapetininga-5",
    name: "Sérgio Moreira",
    lat: -23.5940,
    lng: -48.0690,
    status: BookingStatus.STARTED,
    client: "Larissa Prado",
    meta: "Pagamento retido até check-out mútuo",
    engineStarted: true,
  },
  // Novo lote: Eixo Norte/Interior (SP/MG)
  {
    id: "ribeirao-preto-1",
    name: "Marcos Prado",
    lat: -21.1765,
    lng: -47.8104,
    status: BookingStatus.STARTED,
    client: "Letícia Freitas",
    meta: "Serviço com checklist parcial em Ribeirão Preto",
    engineStarted: true,
  },
  {
    id: "ribeirao-preto-2",
    name: "Letícia Araújo",
    lat: -21.1523,
    lng: -47.8091,
    status: BookingStatus.STARTED,
    client: "Rafael Gomes",
    meta: "Cliente recebeu aviso de chegada em Ribeirão Preto",
    engineStarted: true,
  },
  {
    id: "ribeirao-preto-3",
    name: "Nádia Ferreira",
    lat: -21.1952,
    lng: -47.8107,
    status: BookingStatus.STARTED,
    client: "Paulo Mendes",
    meta: "Auditoria ativa e pagamento seguro",
    engineStarted: true,
  },
  {
    id: "sj-rio-preto-1",
    name: "Diego Marques",
    lat: -20.8199,
    lng: -49.4021,
    status: BookingStatus.STARTED,
    client: "Fernanda Mira",
    meta: "São José do Rio Preto - serviço em andamento",
    engineStarted: true,
  },
  {
    id: "sj-rio-preto-2",
    name: "Vivian Costa",
    lat: -20.8058,
    lng: -49.4167,
    status: BookingStatus.STARTED,
    client: "Marcos Jorge",
    meta: "Rota do norte em monitoramento",
    engineStarted: true,
  },
  {
    id: "sj-rio-preto-3",
    name: "Paulo Lima",
    lat: -20.8205,
    lng: -49.3934,
    status: BookingStatus.STARTED,
    client: "Camila Siqueira",
    meta: "Atualizando coordenadas na saída da cidade",
    engineStarted: true,
  },
  {
    id: "araraquara-1",
    name: "Rafaela Prado",
    lat: -21.7956,
    lng: -48.1711,
    status: BookingStatus.STARTED,
    client: "Eduardo Lopes",
    meta: "Monitoramento no eixo Araraquara",
    engineStarted: true,
  },
  {
    id: "araraquara-2",
    name: "Giovana Melo",
    lat: -21.8210,
    lng: -48.1793,
    status: BookingStatus.STARTED,
    client: "Vanessa Soares",
    meta: "Serviço em Araraquara passando por validação",
    engineStarted: true,
  },
  {
    id: "araraquara-3",
    name: "Renata Lopes",
    lat: -21.7889,
    lng: -48.2106,
    status: BookingStatus.STARTED,
    client: "Luiza Barros",
    meta: "Ponto de apoio em Araraquara com geofence ativo",
    engineStarted: true,
  },
  {
    id: "saocarlos-1",
    name: "Maira Costa",
    lat: -22.0180,
    lng: -47.8941,
    status: BookingStatus.STARTED,
    client: "Paula Brito",
    meta: "São Carlos - roteiros urbanos circulando",
    engineStarted: true,
  },
  {
    id: "saocarlos-2",
    name: "Leandro Teixeira",
    lat: -22.0302,
    lng: -47.9139,
    status: BookingStatus.STARTED,
    client: "Thiago Moraes",
    meta: "Auditoria confirmando chegada",
    engineStarted: true,
  },
  {
    id: "saocarlos-3",
    name: "Débora Nunes",
    lat: -22.0105,
    lng: -47.8920,
    status: BookingStatus.STARTED,
    client: "Isabela Prates",
    meta: "Coordinate check final aguardando cliente",
    engineStarted: true,
  },
  {
    id: "pocos-caldas-1",
    name: "Márcia Faria",
    lat: -21.7896,
    lng: -46.5613,
    status: BookingStatus.STARTED,
    client: "Pedro Cunha",
    meta: "Auditoria rápida em Poços de Caldas",
    engineStarted: true,
  },
  {
    id: "pocos-caldas-2",
    name: "Eduarda Veiga",
    lat: -21.7798,
    lng: -46.5674,
    status: BookingStatus.STARTED,
    client: "Roberto Nogueira",
    meta: "Monitoramento de subida na Mantiqueira",
    engineStarted: true,
  },
  {
    id: "pocos-caldas-3",
    name: "Tadeu Campos",
    lat: -21.8031,
    lng: -46.5560,
    status: BookingStatus.STARTED,
    client: "Renata Oliveira",
    meta: "Check-in final na entrada mineira",
    engineStarted: true,
  },
  {
    id: "pouso-alegre-1",
    name: "Helena Leal",
    lat: -22.2282,
    lng: -45.9394,
    status: BookingStatus.STARTED,
    client: "Bruno Monteiro",
    meta: "Pouso Alegre - conferindo documentos",
    engineStarted: true,
  },
  {
    id: "pouso-alegre-2",
    name: "Jarbas Lima",
    lat: -22.2389,
    lng: -45.9422,
    status: BookingStatus.STARTED,
    client: "Luciane Alves",
    meta: "Aviso enviado ao cliente com 10 minutos restantes",
    engineStarted: true,
  },
  {
    id: "pouso-alegre-3",
    name: "Daniela Peixoto",
    lat: -22.2334,
    lng: -45.9478,
    status: BookingStatus.STARTED,
    client: "Fabio Rocha",
    meta: "Status \"Em serviço\" com check-out pendente",
    engineStarted: true,
  },
  {
    id: "piracicaba-1",
    name: "Carine Souza",
    lat: -22.7185,
    lng: -47.6495,
    status: BookingStatus.STARTED,
    client: "Igor Barros",
    meta: "Serviço em Piracicaba, rota interior",
    engineStarted: true,
  },
  {
    id: "piracicaba-2",
    name: "Fabio Moreira",
    lat: -22.7012,
    lng: -47.6470,
    status: BookingStatus.STARTED,
    client: "Bruna Tavares",
    meta: "Chegada prevista em três minutos",
    engineStarted: true,
  },
  {
    id: "piracicaba-3",
    name: "Daniela Silva",
    lat: -22.7240,
    lng: -47.6433,
    status: BookingStatus.STARTED,
    client: "Lívia Fernandes",
    meta: "Passagem pela ponte com GPS ativo",
    engineStarted: true,
  },
  {
    id: "limeira-1",
    name: "Helena Nunes",
    lat: -22.5722,
    lng: -47.4071,
    status: BookingStatus.STARTED,
    client: "Vitor Martins",
    meta: "Operação no litoral paulista próximo a Limeira",
    engineStarted: true,
  },
  {
    id: "limeira-2",
    name: "Igor Tavares",
    lat: -22.5500,
    lng: -47.4106,
    status: BookingStatus.STARTED,
    client: "Sofia Pereira",
    meta: "Check-in em Limeira com geofence ativo",
    engineStarted: true,
  },
  {
    id: "limeira-3",
    name: "Joana Peçanha",
    lat: -22.5568,
    lng: -47.3879,
    status: BookingStatus.STARTED,
    client: "Otávio Ramos",
    meta: "Serviço com status \"Em andamento\"",
    engineStarted: true,
  },
  {
    id: "londrina-1",
    name: "Eduardo Andrade",
    lat: -23.3044,
    lng: -51.1693,
    status: BookingStatus.STARTED,
    client: "Rosana Campelo",
    meta: "Londrina ativo para o eixo Paraná",
    engineStarted: true,
  },
  {
    id: "londrina-2",
    name: "Adriana Reis",
    lat: -23.3058,
    lng: -51.1698,
    status: BookingStatus.STARTED,
    client: "Mauricio Campos",
    meta: "Monitorando rota urbana em Londrina",
    engineStarted: true,
  },
  {
    id: "londrina-3",
    name: "Paulo Cordeiro",
    lat: -23.3101,
    lng: -51.1730,
    status: BookingStatus.STARTED,
    client: "Juliana Alves",
    meta: "Agendamento em andamento perto da UNOPAR",
    engineStarted: true,
  },
  {
    id: "maringa-1",
    name: "Veronica Lima",
    lat: -23.4204,
    lng: -51.9333,
    status: BookingStatus.STARTED,
    client: "Gustavo Silva",
    meta: "Maringá, status confirmado e em execução",
    engineStarted: true,
  },
  {
    id: "maringa-2",
    name: "Ricardo Oliveira",
    lat: -23.4312,
    lng: -51.9427,
    status: BookingStatus.STARTED,
    client: "Amanda Rocha",
    meta: "Atividade no bairro Zona 7",
    engineStarted: true,
  },
  {
    id: "maringa-3",
    name: "Débora Martins",
    lat: -23.4227,
    lng: -51.9311,
    status: BookingStatus.STARTED,
    client: "Cleber Santos",
    meta: "Corrida de monitoramento passivo em Maringá",
    engineStarted: true,
  },
  {
    id: "curitiba-1",
    name: "Renata Oliveira",
    lat: -25.4284,
    lng: -49.2733,
    status: BookingStatus.STARTED,
    client: "Leandro Bittencourt",
    meta: "Curitiba ao sul do mapa oficial",
    engineStarted: true,
  },
  {
    id: "curitiba-2",
    name: "Paulo Lima",
    lat: -25.4270,
    lng: -49.2703,
    status: BookingStatus.STARTED,
    client: "Clara Barbosa",
    meta: "Arcadas ativas com alerta passivo",
    engineStarted: true,
  },
  {
    id: "curitiba-3",
    name: "Marina Batista",
    lat: -25.4315,
    lng: -49.2658,
    status: BookingStatus.STARTED,
    client: "Eduardo Teixeira",
    meta: "Zona norte de Curitiba com check-in ok",
    engineStarted: true,
  },
  {
    id: "itapetininga-6",
    name: "Vitor Albuquerque",
    lat: -23.5949,
    lng: -48.0461,
    status: BookingStatus.STARTED,
    client: "Carla Fagundes",
    meta: "Itapetininga - rota ampliada",
    engineStarted: true,
  },
  {
    id: "itapetininga-7",
    name: "Patrícia Montenegro",
    lat: -23.5874,
    lng: -48.0620,
    status: BookingStatus.STARTED,
    client: "Helena Monteiro",
    meta: "Monitoramento rodoviário em Itapetininga",
    engineStarted: true,
  },
  {
    id: "itapetininga-8",
    name: "Paulo Cunha",
    lat: -23.5952,
    lng: -48.0530,
    status: BookingStatus.STARTED,
    client: "Tatiana Ribeiro",
    meta: "Serviço rural em Itapetininga",
    engineStarted: true,
  },
  {
    id: "sorocaba-6",
    name: "Rebeca Prado",
    lat: -23.5019,
    lng: -47.4526,
    status: BookingStatus.STARTED,
    client: "Guilherme Martins",
    meta: "Sorocaba central com alerta passivo",
    engineStarted: true,
  },
  {
    id: "sorocaba-7",
    name: "Flávia Mendes",
    lat: -23.5079,
    lng: -47.4587,
    status: BookingStatus.STARTED,
    client: "Bianca Alves",
    meta: "Plantão no bairro Campolim",
    engineStarted: true,
  },
  {
    id: "sorocaba-8",
    name: "Felipe Ramos",
    lat: -23.4948,
    lng: -47.4491,
    status: BookingStatus.STARTED,
    client: "Heloisa Couto",
    meta: "Check-out pendente com segurança ativada",
    engineStarted: true,
  },
  {
    id: "sjdoscampos-1",
    name: "Paula Ferreira",
    lat: -23.1896,
    lng: -45.8847,
    status: BookingStatus.STARTED,
    client: "Marcelo Sampaio",
    meta: "São José dos Campos central",
    engineStarted: true,
  },
  {
    id: "sjdoscampos-2",
    name: "Thiago Nascimento",
    lat: -23.1954,
    lng: -45.8765,
    status: BookingStatus.STARTED,
    client: "Isadora Prado",
    meta: "Rota leste do Vale em monitoramento",
    engineStarted: true,
  },
  {
    id: "sjdoscampos-3",
    name: "Luana Mello",
    lat: -23.1837,
    lng: -45.8891,
    status: BookingStatus.STARTED,
    client: "Renato Aguiar",
    meta: "Checklist de segurança taquaral",
    engineStarted: true,
  },
  {
    id: "taubate-1",
    name: "Cláudio Silva",
    lat: -23.0104,
    lng: -45.5578,
    status: BookingStatus.STARTED,
    client: "Raquel Vieira",
    meta: "Taubaté com GPS alinhado",
    engineStarted: true,
  },
  {
    id: "taubate-2",
    name: "Adriana Rocha",
    lat: -23.0230,
    lng: -45.5541,
    status: BookingStatus.STARTED,
    client: "Gabriel Teles",
    meta: "Operação no vale do Paraíba",
    engineStarted: true,
  },
  {
    id: "taubate-3",
    name: "Marcos Lima",
    lat: -23.0176,
    lng: -45.5645,
    status: BookingStatus.STARTED,
    client: "Jéssica Peixoto",
    meta: "Serviço posicional em Taubaté",
    engineStarted: true,
  },
  {
    id: "caraguatatuba-4",
    name: "Nina Duarte",
    lat: -23.6099,
    lng: -45.3845,
    status: BookingStatus.STARTED,
    client: "Carla Bittencourt",
    meta: "Caraguá litoral com rota costeira",
    engineStarted: true,
  },
  {
    id: "caraguatatuba-5",
    name: "Pedro Costa",
    lat: -23.6366,
    lng: -45.4237,
    status: BookingStatus.STARTED,
    client: "Aline Freitas",
    meta: "Caminho até a Praia do Camaroeiro",
    engineStarted: true,
  },
  {
    id: "caraguatatuba-6",
    name: "Lívia Andrade",
    lat: -23.6053,
    lng: -45.3824,
    status: BookingStatus.STARTED,
    client: "Samuel Matos",
    meta: "Monitoramento com foco em segurança",
    engineStarted: true,
  },
  {
    id: "santos-2",
    name: "Marcos Pamplona",
    lat: -23.9540,
    lng: -46.3354,
    status: BookingStatus.STARTED,
    client: "Edu Rocha",
    meta: "Santos, área portuária",
    engineStarted: true,
  },
  {
    id: "santos-3",
    name: "Raissa Baptista",
    lat: -23.9646,
    lng: -46.3378,
    status: BookingStatus.STARTED,
    client: "Gustavo Zeidan",
    meta: "Serviço no Gonzaga",
    engineStarted: true,
  },
  {
    id: "resende-1",
    name: "Carolina Prado",
    lat: -22.4722,
    lng: -44.4580,
    status: BookingStatus.STARTED,
    client: "Thiago Gouveia",
    meta: "Divisa RJ/SP em Resende",
    engineStarted: true,
  },
  {
    id: "resende-2",
    name: "Marcio Moreira",
    lat: -22.4689,
    lng: -44.4711,
    status: BookingStatus.STARTED,
    client: "Juliana Neves",
    meta: "Rota rural de Resende",
    engineStarted: true,
  },
  {
    id: "resende-3",
    name: "Fernanda Soares",
    lat: -22.4756,
    lng: -44.4571,
    status: BookingStatus.STARTED,
    client: "Paulo Henrique",
    meta: "Monitoramento próximo à Dutra",
    engineStarted: true,
  },
  {
    id: "volta-redonda-1",
    name: "Cynthia Mello",
    lat: -22.5231,
    lng: -44.0998,
    status: BookingStatus.STARTED,
    client: "Leandro Nogueira",
    meta: "Volta Redonda, serviço com geofence ativo",
    engineStarted: true,
  },
  {
    id: "volta-redonda-2",
    name: "Bruno Assis",
    lat: -22.5261,
    lng: -44.0930,
    status: BookingStatus.STARTED,
    client: "Daniela Costa",
    meta: "Operação no bairro Aterrado",
    engineStarted: true,
  },
  {
    id: "volta-redonda-3",
    name: "Sabrina Dias",
    lat: -22.5180,
    lng: -44.1052,
    status: BookingStatus.STARTED,
    client: "Mateus Fagundes",
    meta: "Status conferido pelo suporte",
    engineStarted: true,
  },
  // Novas cidades (PR/SC)
  {
    id: "ponta-grossa-1",
    name: "Helena Azevedo",
    lat: -25.0913,
    lng: -50.1626,
    status: BookingStatus.STARTED,
    client: "Elena Prado",
    meta: "Ponta Grossa em monitoramento urbano",
    engineStarted: true,
  },
  {
    id: "ponta-grossa-2",
    name: "João Vitor",
    lat: -25.1011,
    lng: -50.1495,
    status: BookingStatus.STARTED,
    client: "Roberta Teles",
    meta: "Serviço com geofence ativo no centro",
    engineStarted: true,
  },
  {
    id: "ponta-grossa-3",
    name: "Fábio Moreira",
    lat: -25.1122,
    lng: -50.1638,
    status: BookingStatus.STARTED,
    client: "Andréa Lima",
    meta: "Rota segundo eixo da cidade",
    engineStarted: true,
  },
  {
    id: "guarapuava-1",
    name: "Tereza Gomes",
    lat: -25.3846,
    lng: -51.4609,
    status: BookingStatus.STARTED,
    client: "Marcos Rezende",
    meta: "Guarapuava - rota litoral",
    engineStarted: true,
  },
  {
    id: "guarapuava-2",
    name: "Lívia Barros",
    lat: -25.4076,
    lng: -51.5010,
    status: BookingStatus.STARTED,
    client: "Ricardo Rios",
    meta: "Check-in no interior sul",
    engineStarted: true,
  },
  {
    id: "guarapuava-3",
    name: "Luciano Dias",
    lat: -25.3992,
    lng: -51.4924,
    status: BookingStatus.STARTED,
    client: "Patrícia Campos",
    meta: "Serviço rural em Guarapuava",
    engineStarted: true,
  },
  {
    id: "cascavel-1",
    name: "Breno Silva",
    lat: -24.9571,
    lng: -53.4591,
    status: BookingStatus.STARTED,
    client: "Julia Prado",
    meta: "Cascavel em monitoramento paralelo",
    engineStarted: true,
  },
  {
    id: "cascavel-2",
    name: "Beatriz Nogueira",
    lat: -24.9520,
    lng: -53.4542,
    status: BookingStatus.STARTED,
    client: "Diego Mello",
    meta: "Operação técnica com alerta de proximidade",
    engineStarted: true,
  },
  {
    id: "cascavel-3",
    name: "Fernando Torres",
    lat: -24.9452,
    lng: -53.4525,
    status: BookingStatus.STARTED,
    client: "Patrícia Duarte",
    meta: "Serviço confirmado próximo ao aeroporto",
    engineStarted: true,
  },
  {
    id: "foz-1",
    name: "Guilherme Martins",
    lat: -25.5179,
    lng: -54.5851,
    status: BookingStatus.STARTED,
    client: "Lilian Pires",
    meta: "Foz do Iguaçu na fronteira",
    engineStarted: true,
  },
  {
    id: "foz-2",
    name: "Morgana Costa",
    lat: -25.5107,
    lng: -54.5858,
    status: BookingStatus.STARTED,
    client: "Rodrigo Paiva",
    meta: "Monitorando região da usina",
    engineStarted: true,
  },
  {
    id: "foz-3",
    name: "Jorge Carvalho",
    lat: -25.5136,
    lng: -54.5873,
    status: BookingStatus.STARTED,
    client: "Flávia Andrade",
    meta: "Serviço em andamento no centro histórico",
    engineStarted: true,
  },
  {
    id: "toledo-1",
    name: "Renato Parreira",
    lat: -24.7267,
    lng: -53.7424,
    status: BookingStatus.STARTED,
    client: "Carla Menezes",
    meta: "Toledo com aviso de chegada",
    engineStarted: true,
  },
  {
    id: "toledo-2",
    name: "Pablo Moretti",
    lat: -24.7361,
    lng: -53.7472,
    status: BookingStatus.STARTED,
    client: "Ana Ribeiro",
    meta: "Check-in notificado e confirmado",
    engineStarted: true,
  },
  {
    id: "toledo-3",
    name: "Cícero Oliveira",
    lat: -24.7246,
    lng: -53.7459,
    status: BookingStatus.STARTED,
    client: "Larissa França",
    meta: "Serviço em execução com auditoria",
    engineStarted: true,
  },
  {
    id: "joinville-1",
    name: "Ricardo Ferreira",
    lat: -26.3044,
    lng: -48.8462,
    status: BookingStatus.STARTED,
    client: "Kátia Silva",
    meta: "Joinville no eixo leste",
    engineStarted: true,
  },
  {
    id: "joinville-2",
    name: "Brenda Santos",
    lat: -26.3059,
    lng: -48.8480,
    status: BookingStatus.STARTED,
    client: "Pedro Lima",
    meta: "Serviço em andamento próximo ao centro",
    engineStarted: true,
  },
  {
    id: "joinville-3",
    name: "Eduardo Cabral",
    lat: -26.3021,
    lng: -48.8432,
    status: BookingStatus.STARTED,
    client: "Laís Moreno",
    meta: "Rastreamento em Joinville",
    engineStarted: true,
  },
  {
    id: "blumenau-1",
    name: "Helena Moura",
    lat: -26.9220,
    lng: -49.0660,
    status: BookingStatus.STARTED,
    client: "Patrícia Assis",
    meta: "Blumenau em monitoria com chuva",
    engineStarted: true,
  },
  {
    id: "blumenau-2",
    name: "Vitor Rodrigues",
    lat: -26.9087,
    lng: -49.0669,
    status: BookingStatus.STARTED,
    client: "Camila Couto",
    meta: "Status confirmado na região central",
    engineStarted: true,
  },
  {
    id: "blumenau-3",
    name: "Fernanda Berg",
    lat: -26.9105,
    lng: -49.0580,
    status: BookingStatus.STARTED,
    client: "Marcelo Duarte",
    meta: "Checklist final em Blumenau",
    engineStarted: true,
  },
  {
    id: "itajai-1",
    name: "Gabriel Lemos",
    lat: -26.9050,
    lng: -48.6669,
    status: BookingStatus.STARTED,
    client: "Elena Moraes",
    meta: "Itajaí portuário em acompanhamento",
    engineStarted: true,
  },
  {
    id: "itajai-2",
    name: "Marina Fernandes",
    lat: -26.9069,
    lng: -48.6660,
    status: BookingStatus.STARTED,
    client: "Fernando Costa",
    meta: "Atualizando coordenadas no pier",
    engineStarted: true,
  },
  {
    id: "itajai-3",
    name: "Tainá Menezes",
    lat: -26.9002,
    lng: -48.6765,
    status: BookingStatus.STARTED,
    client: "Patrícia Lima",
    meta: "Movimentação na rota do litoral",
    engineStarted: true,
  },
  {
    id: "florianopolis-1",
    name: "Bruno Guimarães",
    lat: -27.5949,
    lng: -48.5477,
    status: BookingStatus.STARTED,
    client: "Sofia Pacheco",
    meta: "Florianópolis central em rastreio",
    engineStarted: true,
  },
  {
    id: "florianopolis-2",
    name: "Alana Ribeiro",
    lat: -27.6000,
    lng: -48.5341,
    status: BookingStatus.STARTED,
    client: "Matheus Santos",
    meta: "Monitorando praia de Jurerê",
    engineStarted: true,
  },
  {
    id: "florianopolis-3",
    name: "Roberta Martins",
    lat: -27.6081,
    lng: -48.5274,
    status: BookingStatus.STARTED,
    client: "Paulo Mendes",
    meta: "Serviço com coordenadas no sul da ilha",
    engineStarted: true,
  },
  {
    id: "chapeco-1",
    name: "Flávio Rosa",
    lat: -27.1004,
    lng: -52.6199,
    status: BookingStatus.STARTED,
    client: "Ricardo Dalto",
    meta: "Chapecó em rastreamento de serviço urbano",
    engineStarted: true,
  },
  {
    id: "chapeco-2",
    name: "Paula Faria",
    lat: -27.1028,
    lng: -52.6132,
    status: BookingStatus.STARTED,
    client: "Tatiana Lopes",
    meta: "Monitoramento junto à rodoviária",
    engineStarted: true,
  },
  {
    id: "chapeco-3",
    name: "Hugo Pereira",
    lat: -27.0986,
    lng: -52.6150,
    status: BookingStatus.STARTED,
    client: "Luciana Pereira",
    meta: "Serviço em Chapecó com GPS ativo",
    engineStarted: true,
  },
  {
    id: "lages-1",
    name: "Jéssica Campos",
    lat: -27.8156,
    lng: -50.3269,
    status: BookingStatus.STARTED,
    client: "Bruno Silveira",
    meta: "Lages - interior serrano",
    engineStarted: true,
  },
  {
    id: "lages-2",
    name: "Marcos Amorim",
    lat: -27.8022,
    lng: -50.3335,
    status: BookingStatus.STARTED,
    client: "Jéssica Ramos",
    meta: "Rota no centro cultural",
    engineStarted: true,
  },
  {
    id: "lages-3",
    name: "Renata Freitas",
    lat: -27.8059,
    lng: -50.3448,
    status: BookingStatus.STARTED,
    client: "Mateus Freire",
    meta: "Checklist de segurança concluído",
    engineStarted: true,
  },
  {
    id: "criciuma-1",
    name: "Larissa Ferreira",
    lat: -28.6733,
    lng: -49.3738,
    status: BookingStatus.STARTED,
    client: "Leonardo Telles",
    meta: "Criciúma com operação próxima ao centro",
    engineStarted: true,
  },
  {
    id: "criciuma-2",
    name: "Felipe Reis",
    lat: -28.6764,
    lng: -49.3733,
    status: BookingStatus.STARTED,
    client: "Monica Dias",
    meta: "Serviço em andamento na zona leste",
    engineStarted: true,
  },
  {
    id: "criciuma-3",
    name: "Sidney Almeida",
    lat: -28.6705,
    lng: -49.3689,
    status: BookingStatus.STARTED,
    client: "Rafaela Costa",
    meta: "Monitoramento de área industrial",
    engineStarted: true,
  },
  ...CITY_EXPANSION_GROUPS.flatMap(expandCityEntries),
  ...mgExpansionCities.flatMap(expandMgCities),
];


const buildDemoProvider = (definition: DemoProviderDefinition): Provider => ({
  id: `demo-provider-${definition.id}`,
  name: definition.name,
  fullName: definition.name,
  email: `${definition.id}@demo.limpeja.app`,
  verificationStatus: VerificationStatus.APPROVED,
  fiveStarReviewCount: 0,
  monthlyBookingsCount: 0,
  totalEarnings: "0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  latitude: definition.lat.toString(),
  longitude: definition.lng.toString(),
});

const DEMO_ACTIVE_PROVIDERS: ActiveProviderEntry[] = DEMO_PROVIDER_DEFINITIONS.map(
  (definition) => ({
    provider: buildDemoProvider(definition),
    booking: {
      id: `demo-booking-${definition.id}`,
      clientId: `demo-client-${definition.id}`,
      providerId: `demo-provider-${definition.id}`,
      providerServiceId: "demo-service",
      scheduledDate: "2026-02-15",
      scheduledTime: "10:00",
      status: definition.status,
      totalPrice: 350,
      clientFullName: definition.client,
      notes: definition.meta,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    lat: definition.lat,
    lng: definition.lng,
    engineStarted: definition.engineStarted ?? false,
    isJoaquim: false,
  }),
);

export default function LiveTrackingPage() {
  const [demoMode, setDemoMode] = useState(() => {
    if (typeof window === "undefined") {
      return isDemoEnv;
    }
    const params = new URLSearchParams(window.location.search);
    return isDemoEnv || params.has("demo");
  });

  const {
    data: liveStatusData,
    isFetching,
  } = useQuery<LiveStatusPayload>({
    queryKey: ["live-tracking", "live-status"],
    queryFn: fetchLiveStatus,
    refetchInterval: 30000,
    staleTime: 30000,
  });

  const liveStatus = liveStatusData ?? EMPTY_LIVE_STATUS;
  const providers = liveStatus.providers;
  const confirmedBookings = liveStatus.confirmedBookings;
  const inProgressBookings = liveStatus.activeBookings;

  const activeBookings = useMemo(
    () => [...inProgressBookings, ...confirmedBookings],
    [confirmedBookings, inProgressBookings],
  );

  const activeBookingsByProvider = useMemo(() => {
    const map = new Map<string, Booking>();
    for (const booking of activeBookings) {
      if (!map.has(booking.providerId)) {
        map.set(booking.providerId, booking);
      }
    }
    return map;
  }, [activeBookings]);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  useEffect(() => {
    if (providers.length || activeBookings.length) {
      setLastUpdated(new Date());
    }
  }, [providers.length, activeBookings.length]);

  const activeProviders = useMemo((): ActiveProviderEntry[] => {
    if (!providers.length || !activeBookingsByProvider.size) {
      return [];
    }
    const entries = providers.reduce<ActiveProviderEntry[]>((acc, provider) => {
      const booking = activeBookingsByProvider.get(provider.id);
      if (!booking) return acc;
      const coords = resolveCoordinates(provider, booking);
      if (!coords) return acc;
      const engineStarted =
        booking.status === BookingStatus.STARTED || Boolean(booking.startedAt);
      const isJoaquim = /\bjoaquim\b/i.test(
        (provider.fullName ?? provider.name ?? "") as string,
      );
      acc.push({
        provider,
        booking,
        lat: coords.lat,
        lng: coords.lng,
        engineStarted,
        isJoaquim,
      });
      return acc;
    }, []);
    return entries.sort((a, b) => {
      if (a.engineStarted !== b.engineStarted) {
        return a.engineStarted ? -1 : 1;
      }
      if (a.isJoaquim !== b.isJoaquim) {
        return a.isJoaquim ? -1 : 1;
      }
      return (
        a.provider.fullName?.localeCompare(b.provider.fullName ?? "") ?? 0
      );
    });
  }, [providers, activeBookingsByProvider]);

  const throttledActiveProviders = useThrottle(activeProviders, 500);
  const displayedProviders = demoMode ? DEMO_ACTIVE_PROVIDERS : throttledActiveProviders;
  const activeCount = displayedProviders.length;
  const estimatedRevenue = activeCount * 420;
  const performancePercent = activeCount
    ? Math.round(
        (displayedProviders.filter((entry) => entry.engineStarted).length / activeCount) * 100,
      )
    : 0;

  const handleTrackProvider = useCallback(
    (entry: ActiveProviderEntry) => {
      setTrackingId(entry.provider.id);
      if (mapInstance) {
        mapInstance.flyTo([entry.lat, entry.lng], 14, { duration: 1.2 });
      }
    },
    [mapInstance]
  );

  const handleResetView = useCallback(() => {
    setTrackingId(null);
    if (mapInstance) {
      mapInstance.flyTo(DEFAULT_CENTER, 5, { duration: 1.2 });
    }
  }, [mapInstance]);

  useEffect(() => {
    if (!mapInstance || !trackingId) return;
    const entry = displayedProviders.find(
      (provider) => provider.provider.id === trackingId,
    );
    if (entry) {
      mapInstance.flyTo([entry.lat, entry.lng], 14, { duration: 1.2 });
    }
  }, [displayedProviders, mapInstance, trackingId]);

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />

      <div className="flex-1 ml-72 overflow-hidden">
        <Header
          title="Live Tracking"
          subtitle="Monitoramento ao vivo dos provedores com serviços ativos."
        />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div>
              <Card className="h-full">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>Mapa de Operações</CardTitle>
                      <p className="text-sm text-gray-500">
                        Apenas rastreamos prestadores com serviços aceitos ou em andamento.
                      </p>
                    </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={handleResetView}
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Recentrar
                    </Button>
                    {!demoMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-gray-500"
                        onClick={() => setDemoMode(true)}
                      >
                        Ativar Demo
                      </Button>
                    )}
                    <Badge variant="outline">
                      {displayedProviders.length} ativos
                    </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    {isFetching ? (
                      <>Atualizando dados...</>
                    ) : lastUpdated ? (
                      <>Atualizado às {lastUpdated.toLocaleTimeString("pt-BR")}</>
                    ) : (
                      <>Nenhum dado carregado ainda</>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative h-[70vh]">
                    <MapContainerComponent
                      center={DEFAULT_CENTER}
                      zoom={5}
                      scrollWheelZoom
                      className="h-full w-full"
                      whenCreated={setMapInstance}
                    >
                      <TileLayerComponent
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {displayedProviders.map((entry) => {
                        const icon = demoMode
                          ? demoMarkerIcon
                          : entry.engineStarted
                          ? engineMarkerIcon
                          : confirmedMarkerIcon;
                        return (
                          <MarkerComponent
                            key={`${entry.provider.id}-${entry.booking.id}`}
                            position={[entry.lat, entry.lng]}
                            icon={icon}
                          />
                        );
                      })}
                    </MapContainerComponent>
                    {isFetching && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-gray-600">
                        Atualizando coordenadas...
                      </div>
                    )}
                    {!displayedProviders.length && !isFetching && (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 bg-white/80">
                        Nenhum prestador ativo detectado no momento.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="space-y-4">
                <Card className="h-full">
                  <CardHeader className="flex flex-col gap-3">
                    <div>
                      <CardTitle>Lista de Prestadores</CardTitle>
                      <p className="text-sm text-gray-500">
                        Rastreie o prestador certo e acompanhe o serviço.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4">
                      <div className="flex-1 min-w-[160px] rounded-2xl border border-white/40 bg-white/20 px-4 py-3 shadow-lg backdrop-blur">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">
                          Serviços Ativos
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">{activeCount}</p>
                        <p className="text-[11px] text-gray-400">monitorados</p>
                      </div>
                      <div className="flex-1 min-w-[160px] rounded-2xl border border-white/40 bg-white/20 px-4 py-3 shadow-lg backdrop-blur">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">
                          Receita Estimada
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            minimumFractionDigits: 0,
                          }).format(estimatedRevenue)}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-semibold">+355% Lucro</p>
                      </div>
                      <div className="flex-1 min-w-[160px] rounded-2xl border border-white/40 bg-white/20 px-4 py-3 shadow-lg backdrop-blur">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">
                          Performance
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">{performancePercent}%</p>
                        <p className="text-[11px] text-gray-400">Serviços sem atraso</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {displayedProviders.map((entry) => {
                      const isTracking = trackingId === entry.provider.id;
                      return (
                        <div
                          key={`${entry.provider.id}-${entry.booking.id}`}
                          className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                            isTracking
                              ? "border-sky-500/60 bg-sky-50"
                              : "border-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <ProviderAvatar
                                name={entry.provider.fullName ?? entry.provider.name ?? "Provedor"}
                                id={entry.provider.id}
                              />
                              {entry.provider.fullName ?? entry.provider.name ?? "Provedor"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline">
                                {entry.engineStarted ? "Em serviço" : "Confirmado"}
                              </Badge>
                              {entry.isJoaquim && (
                                <Badge variant="secondary">Joaquim</Badge>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Cliente{" "}
                            {entry.booking.clientFullName ??
                              entry.booking.client?.fullName ??
                              entry.booking.client?.name ??
                              "Desconhecido"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {statusLabel(entry.booking.status)} •{" "}
                            {entry.booking.scheduledDate}{" "}
                            {entry.booking.scheduledTime}
                          </p>
                          {entry.booking.notes && (
                            <p className="text-[11px] text-slate-500">{entry.booking.notes}</p>
                          )}
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTrackProvider(entry)}
                              >
                                Rastrear
                              </Button>
                            </div>
                        </div>
                      );
                    })}
                    {!displayedProviders.length && !isFetching && (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-6 text-center text-sm text-gray-500">
                        Nenhum prestador com serviço aceito ou em andamento encontrado.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {demoMode && (
                  <Card>
                    <CardHeader className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>Conversão de Seguro</CardTitle>
                        <p className="text-sm text-gray-500">
                          KPIs forçam a conversa com o Insurance Tech.
                        </p>
                      </div>
                      <Badge variant="outline">DEMO</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-2xl font-semibold text-gray-900">
                        32 serviços segurados
                      </p>
                      <p className="text-sm text-gray-500">R$ 2.5k em coberturas ativas</p>
                      <p className="text-xs text-gray-500">
                        Seguro real com banco parceiro; responsabilidade civil familiar/profissional.
                      </p>
                      <p className="text-xs text-gray-500">
                        Pagamento liberado somente após confirmação mútua do fim do serviço.
                      </p>
                    </CardContent>
                  </Card>
                )}

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
