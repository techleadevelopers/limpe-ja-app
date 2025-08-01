import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MoreHorizontal, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import VerificationModal from "@/components/verification/verification-modal";
// Removendo mockProviders e funções utilitárias mockadas
// import { mockProviders, type Provider } from "@/data/mockData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProviders, updateProviderStatus as apiUpdateProviderStatus } from "@/lib/api";
import { Provider, VerificationStatus } from "@/lib/types"; // Importa Provider e VerificationStatus dos tipos reais
import { useToast } from "@/hooks/use-toast";


function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case VerificationStatus.APPROVED:
      return "bg-green-100 text-green-700 border-green-200";
    case VerificationStatus.PENDING_DOCUMENTS_UPLOAD:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case VerificationStatus.PENDING_MANUAL_REVIEW:
      return "bg-orange-100 text-orange-700 border-orange-200";
    case VerificationStatus.REJECTED:
      return "bg-red-100 text-red-700 border-red-200";
    case VerificationStatus.BLOCKED:
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

export default function Providers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Busca os provedores usando react-query
  const { data: providers, isLoading, isError, error } = useQuery<Provider[], Error>({
    queryKey: ['/providers'],
    queryFn: () => fetchProviders(), // fetchProviders já está configurado em api.ts
  });

  // Mutação para atualizar o status do provedor
  const updateProviderStatusMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: VerificationStatus; rejectionReason?: string }) =>
      apiUpdateProviderStatus(id, status, rejectionReason),
    onSuccess: (updatedProvider) => {
      queryClient.invalidateQueries({ queryKey: ['/providers'] }); // Invalida a cache para refetch
      queryClient.invalidateQueries({ queryKey: ['/verification-queue'] }); // Também invalida a fila
      toast({
        title: "Status do Provedor Atualizado",
        description: `${updatedProvider.name} agora está ${updatedProvider.verificationStatus}.`,
      });
      setIsModalOpen(false); // Fecha o modal após a atualização
      setSelectedProvider(null);
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao Atualizar Status",
        description: err.message || "Ocorreu um erro ao atualizar o status do provedor.",
        variant: "destructive",
      });
    },
  });

  const filteredProviders = providers?.filter((provider: Provider) =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  // Função para passar para o VerificationModal para aprovação
  const handleApproveProvider = (providerId: string) => {
    updateProviderStatusMutation.mutate({ id: providerId, status: VerificationStatus.APPROVED });
  };

  // Função para passar para o VerificationModal para rejeição
  const handleRejectProvider = (providerId: string, reason: string) => {
    updateProviderStatusMutation.mutate({ id: providerId, status: VerificationStatus.REJECTED, rejectionReason: reason });
  };

  // Função para passar para o VerificationModal para bloqueio
  const handleBlockProvider = (providerId: string) => {
    if (confirm("Tem certeza que deseja bloquear este provedor?")) {
      updateProviderStatusMutation.mutate({ id: providerId, status: VerificationStatus.BLOCKED });
    }
  };


  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Provider Management"
          subtitle="Manage and verify service providers on the platform."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Search and Filters */}
          <Card className="mb-6 shadow-floating border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Input
                    type="text"
                    placeholder="Search providers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50">
                    <Filter className="mr-2" size={16} />
                    Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Providers Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="shadow-floating border-0 animate-pulse">
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-red-600">
              <p>Erro ao carregar provedores: {error?.message}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider: Provider, index: number) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    className="shadow-floating hover:shadow-floating-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0"
                    onClick={() => handleProviderClick(provider)}
                  >
                    <CardContent className="pt-6">
                      {/* Provider Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <img 
                            src={`https://images.unsplash.com/photo-150720939${Math.floor(Math.random() * 10)}?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100`}
                            alt={`${provider.name} profile`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="ml-3">
                            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                            <p className="text-sm text-gray-500">{provider.email}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal size={16} />
                        </Button>
                      </div>

                      {/* Status Badge */}
                      <div className="mb-4">
                        <Badge className={`border ${getStatusBadge(provider.verificationStatus || "")}`}>
                          {(provider.verificationStatus || "").replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      {/* Provider Stats */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            Reviews
                          </span>
                          <span className="font-medium">{provider.fiveStarReviewCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Monthly Bookings</span>
                          <span className="font-medium">{provider.monthlyBookingsCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total Earnings</span>
                          <span className="font-medium text-green-600">R$ {parseFloat(provider.totalEarnings || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Location */}
                      {provider.latitude && provider.longitude && (
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{provider.city || "Localização Desconhecida"}</span>
                        </div>
                      )}

                      {/* Joined Date */}
                      <div className="text-xs text-gray-500">
                        Joined {formatRelativeTime(new Date(provider.createdAt || Date.now()))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredProviders.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? `No providers match "${searchTerm}"` : "No providers have been registered yet."}
              </p>
            </div>
          )}
        </main>
      </div>

      <VerificationModal
        provider={selectedProvider}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProvider(null);
        }}
        onApprove={handleApproveProvider}
        onReject={handleRejectProvider}
        onBlock={handleBlockProvider}
      />
    </div>
  );
}