import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchProviders } from "@/lib/api";
import type { Provider } from "@/lib/types";
import { VerificationStatus } from "@/lib/types";

export default function ProvidersSummary() {
  const { data: providers = [], isLoading, isError } = useQuery<Provider[], Error>({
    queryKey: ["/providers"],
    queryFn: fetchProviders,
  });

  const { total, approved, pending, coverageAreas } = useMemo(() => {
    const total = providers.length;
    const approved = providers.filter(p => p.verificationStatus === VerificationStatus.APPROVED).length;
    const pending = providers.filter(p => p.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW || p.verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD || p.verificationStatus === VerificationStatus.PENDING_INITIAL_REVIEW || p.verificationStatus === VerificationStatus.PENDING_BACKGROUND_CHECK).length;
    const coverageAreas = new Set(providers.map(p => (p.city || "").trim()).filter(Boolean)).size;
    return { total, approved, pending, coverageAreas };
  }, [providers]);

  return (
    <Card className="shadow-floating border-0">
      <CardHeader>
        <CardTitle className="text-lg">Resumo de Provedores</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-sm text-red-600">Erro ao carregar resumo de provedores.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <Users className="w-4 h-4 text-gray-500" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{total}</div>
            </div>
            <div className="p-4 rounded-xl bg-white border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aprovados</span>
                <UserCheck className="w-4 h-4 text-green-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-green-700">{approved}</div>
              <Badge className="mt-2 bg-green-100 text-green-700 border-0">{((approved / (total || 1)) * 100).toFixed(0)}%</Badge>
            </div>
            <div className="p-4 rounded-xl bg-white border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pendentes</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-amber-700">{pending}</div>
            </div>
            <div className="p-4 rounded-xl bg-white border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Áreas de Cobertura</span>
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-blue-700">{coverageAreas}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

