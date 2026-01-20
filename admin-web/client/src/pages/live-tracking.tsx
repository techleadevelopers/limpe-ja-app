import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLiveStatus } from "@/lib/api";
import { Booking, BookingStatus, LiveStatusPayload, Provider } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L, { type LatLngExpression, type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Activity, MapPin, RefreshCcw } from "lucide-react";
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

const EMPTY_LIVE_STATUS: LiveStatusPayload = {
  providers: [],
  confirmedBookings: [],
  activeBookings: [],
};

export default function LiveTrackingPage() {
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
    const entry = throttledActiveProviders.find(
      (provider) => provider.provider.id === trackingId,
    );
    if (entry) {
      mapInstance.flyTo([entry.lat, entry.lng], 14, { duration: 1.2 });
    }
  }, [throttledActiveProviders, mapInstance, trackingId]);

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
                      <Badge variant="outline">
                        {activeProviders.length} ativos
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
                      {throttledActiveProviders.map((entry) => {
                        const icon = entry.engineStarted
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
                    {!activeProviders.length && !isFetching && (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 bg-white/80">
                        Nenhum prestador ativo detectado no momento.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="h-full">
                <CardHeader className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Lista de Prestadores</CardTitle>
                    <p className="text-sm text-gray-500">
                      Rastreie o prestador certo e acompanhe o serviço.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {activeProviders.length} monitorados
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {activeProviders.map((entry) => {
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
                            <MapPin className="w-4 h-4 text-sky-500" />
                            {entry.provider.fullName ?? entry.provider.name ?? "Provedor"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline">
                              {entry.engineStarted ? "Engine started" : "Confirmado"}
                            </Badge>
                            {entry.isJoaquim && (
                              <Badge variant="secondary">Joaquim</Badge>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Booking {entry.booking.id} • Cliente{" "}
                          {entry.booking.clientFullName ??
                            entry.booking.client?.fullName ??
                            entry.booking.client?.name ??
                            "Desconhecido"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {entry.booking.status} • {entry.booking.scheduledDate}{" "}
                          {entry.booking.scheduledTime}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTrackProvider(entry)}
                          >
                            Rastrear
                          </Button>
                          <span className="text-[11px] text-gray-500">
                            {entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {!activeProviders.length && !isFetching && (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-6 text-center text-sm text-gray-500">
                      Nenhum prestador com serviço aceito ou em andamento encontrado.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
