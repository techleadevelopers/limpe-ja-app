import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { MapPin, Search, Filter, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchProviders } from "@/lib/api";
import type { Provider } from "@/lib/types";
import { VerificationStatus } from "@/lib/types";

type ProviderMapProps = {
  height?: number;
};

export default function ProviderMap({ height = 460 }: ProviderMapProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { data: providers = [], isLoading, isError } = useQuery<Provider[], Error>({
    queryKey: ["/providers"],
    queryFn: fetchProviders,
  });

  const filteredProviders = (providers || []).filter((provider) => {
    const name = (provider.name || "").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || provider.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card className="shadow-floating border-0">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Mapa de Provedores</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden md:inline-flex"><ZoomOut className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" className="hidden md:inline-flex"><ZoomIn className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" className="hidden md:inline-flex"><RotateCcw className="w-4 h-4" /></Button>
            <Drawer open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2"><Filter className="w-4 h-4" /> Filtros</Button>
              </DrawerTrigger>
              <DrawerContent className="sm:max-w-md sm:left-auto sm:right-4 sm:rounded-xl">
                <DrawerHeader className="text-left">
                  <DrawerTitle>Filtros do Mapa</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 pt-0 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700">Status de Verificação</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value={VerificationStatus.APPROVED}>Aprovados</SelectItem>
                        <SelectItem value={VerificationStatus.PENDING_MANUAL_REVIEW}>Pendente (Revisão Manual)</SelectItem>
                        <SelectItem value={VerificationStatus.PENDING_DOCUMENTS_UPLOAD}>Pendente (Documentos)</SelectItem>
                        <SelectItem value={VerificationStatus.REJECTED}>Reprovados</SelectItem>
                        <SelectItem value={VerificationStatus.BLOCKED}>Bloqueados</SelectItem>
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
          {/* Legend overlay */}
          <div className="absolute left-4 bottom-4 bg-white/90 backdrop-blur rounded-lg shadow px-3 py-2 text-xs text-gray-700">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Aprovados</div>
            <div className="flex items-center gap-2 mt-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Pendentes</div>
            <div className="flex items-center gap-2 mt-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Reprovados</div>
          </div>

          {/* Simple markers list (placeholder) */}
          <div className="absolute inset-0 p-4 overflow-auto pointer-events-none">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {isLoading ? (
                [...Array(12)].map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-white/70 animate-pulse" />
                ))
              ) : isError ? (
                <div className="text-sm text-red-600">Erro ao carregar provedores.</div>
              ) : filteredProviders.length === 0 ? (
                <div className="text-sm text-gray-600">Nenhum provedor encontrado para os filtros atuais.</div>
              ) : (
                filteredProviders.slice(0, 24).map((p) => (
                  <div key={p.id} className="pointer-events-auto flex items-center gap-2 bg-white/90 rounded-lg px-3 py-2 shadow">
                    <span className={`w-2 h-2 rounded-full ${
                      p.verificationStatus === VerificationStatus.APPROVED
                        ? "bg-green-500"
                        : p.verificationStatus === VerificationStatus.REJECTED
                        ? "bg-red-500"
                        : "bg-amber-500"
                    }`} />
                    <span className="text-xs text-gray-800 truncate" title={p.name}>{p.name}</span>
                    {p.city && (
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        <MapPin className="w-3 h-3 mr-1" /> {p.city}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

