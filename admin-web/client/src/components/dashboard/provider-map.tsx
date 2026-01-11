"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  MapPin,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Provider } from "@/lib/types";
import { VerificationStatus } from "@/lib/types";
import { fetchProviders } from "@/lib/api";
import L, { type LatLngExpression, type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

type ProviderMapProps = {
  height?: number;
};

const DEFAULT_CENTER: LatLngExpression = [-15.7801, -47.9292];
const DEFAULT_ZOOM_LEVEL = 5;

const toNumber = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveProviderCoordinates = (
  provider: Provider
): { lat: number; lng: number } | null => {
  const instanceWithLast = provider as Provider & {
    lastLat?: number | string;
    lastLng?: number | string;
  };
  const latCandidate =
    instanceWithLast.lastLat ??
    provider.latitude ??
    provider.address?.latitude;
  const lngCandidate =
    instanceWithLast.lastLng ??
    provider.longitude ??
    provider.address?.longitude;

  const lat = toNumber(latCandidate);
  const lng = toNumber(lngCandidate);
  if (lat === null || lng === null) {
    return null;
  }

  return { lat, lng };
};

const createMarkerIcon = (color: string, pulsing = false): L.DivIcon => {
  const pulseRing = pulsing
    ? `<span style="position:absolute; inset:-6px; border-radius:999px; border:2px solid ${color}; animation: providerPulse 1.8s ease-out infinite;"></span>`
    : "";
  const animationStyle = pulsing
    ? `<style>
        @keyframes providerPulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          70% { transform: scale(1.2); opacity: 0; }
          100% { opacity: 0; }
        }
      </style>`
    : "";

  const html = `
    <span style="position:relative; display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px;">
      ${pulseRing}
      <span style="width:14px; height:14px; border-radius:999px; background:${color}; box-shadow:0 0 10px ${color}80;"></span>
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

const onlineMarkerIcon = createMarkerIcon("#2563eb", true);
const offlineMarkerIcon = createMarkerIcon("#94a3b8", false);

const MapContainerComponent = MapContainer as unknown as React.ComponentType<any>;
const TileLayerComponent = TileLayer as unknown as React.ComponentType<any>;
const MarkerComponent = Marker as unknown as React.ComponentType<any>;
const PopupComponent = Popup as unknown as React.ComponentType<any>;

const resolveProviderFullName = (provider: Provider) =>
  provider.fullName || provider.name || "Sem nome";

export default function ProviderMap({ height = 460 }: ProviderMapProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

  const { data: providers = [], isLoading, isError } = useQuery<
    Provider[],
    Error
  >({
    queryKey: ["/providers"],
    queryFn: fetchProviders,
  });

  const filteredProviders = (providers || []).filter((provider) => {
    const name = resolveProviderFullName(provider).toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || provider.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const providerPoints = useMemo(() => {
    return filteredProviders
      .map((provider) => {
        const coords = resolveProviderCoordinates(provider);
        if (!coords) return null;
        const icon =
          provider.verificationStatus === VerificationStatus.APPROVED
            ? onlineMarkerIcon
            : offlineMarkerIcon;
        return { provider, coords, icon };
      })
      .filter(Boolean) as {
      provider: Provider;
      coords: { lat: number; lng: number };
      icon: L.DivIcon;
    }[];
  }, [filteredProviders]);

  useEffect(() => {
    if (!mapInstance) return;
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    const normalized = trimmed.toLowerCase();
    const match = providerPoints.find(({ provider }) =>
      resolveProviderFullName(provider).toLowerCase().includes(normalized)
    );

    if (match) {
      const { lat, lng } = match.coords;
      mapInstance.flyTo([lat, lng], 13, { duration: 1.2 });
    }
  }, [searchTerm, providerPoints, mapInstance]);

  return (
    <Card className="shadow-floating border-0">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Mapa de Provedores</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Drawer open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" /> Filtros
                </Button>
              </DrawerTrigger>
              <DrawerContent className="sm:max-w-md sm:left-auto sm:right-4 sm:rounded-xl">
                <DrawerHeader className="text-left">
                  <DrawerTitle>Filtros do Mapa</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 pt-0 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700">
                      Status de Verificação
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value={VerificationStatus.APPROVED}>
                          Aprovados
                        </SelectItem>
                        <SelectItem
                          value={VerificationStatus.PENDING_MANUAL_REVIEW}
                        >
                          Pendente (Revisão Manual)
                        </SelectItem>
                        <SelectItem
                          value={VerificationStatus.PENDING_DOCUMENTS_UPLOAD}
                        >
                          Pendente (Documentos)
                        </SelectItem>
                        <SelectItem value={VerificationStatus.REJECTED}>
                          Reprovados
                        </SelectItem>
                        <SelectItem value={VerificationStatus.BLOCKED}>
                          Bloqueados
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar provedores por nome"
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="relative w-full rounded-xl border bg-gradient-to-br from-gray-50 to-gray-100"
          style={{ height }}
        >
          <MapContainerComponent
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM_LEVEL}
            scrollWheelZoom
            className="h-full w-full"
            whenCreated={setMapInstance}
          >
            <TileLayerComponent
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {providerPoints.map(({ provider, coords, icon }) => {
              const providerFullName = resolveProviderFullName(provider);
              const city = provider.city ?? provider.address?.city;
              const isJoaquimExecutor = /\bjoaquim\b/i.test(providerFullName);

              return (
                <MarkerComponent
                  key={provider.id}
                  position={[coords.lat, coords.lng]}
                  icon={icon}
                >
                  <PopupComponent className="max-w-xs">
                    <div className="space-y-3 text-xs">
                      {provider.avatarUrl && (
                        <img
                          src={provider.avatarUrl}
                          alt={providerFullName}
                          className="h-16 w-16 rounded-full border object-cover"
                        />
                      )}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {providerFullName}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Verificação:{" "}
                          {provider.verificationStatus.replace(/_/g, " ")}
                        </p>
                        {city && (
                          <Badge variant="outline" className="text-[10px]">
                            <MapPin className="w-3 h-3 mr-1" /> {city}
                          </Badge>
                        )}
                      </div>
                      {isJoaquimExecutor && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-[10px]"
                        >
                          Ver Agendamento do Joaquim
                        </Button>
                      )}
                    </div>
                  </PopupComponent>
                </MarkerComponent>
              );
            })}
          </MapContainerComponent>

          <div className="absolute left-4 bottom-4 bg-white/90 backdrop-blur rounded-lg shadow px-3 py-2 text-xs text-gray-700 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Aprovados
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Pendentes
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Reprovados
            </div>
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-gray-600 pointer-events-none">
              Carregando provedores...
            </div>
          )}
          {isError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-red-600 pointer-events-none">
              Erro ao carregar provedores.
            </div>
          )}
          {!isLoading && !isError && providerPoints.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-600 pointer-events-none">
              Nenhum provedor encontrado para os filtros atuais.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
