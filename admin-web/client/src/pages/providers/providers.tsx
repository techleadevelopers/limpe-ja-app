import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MoreHorizontal, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import VerificationModal from "@/components/verification/verification-modal"; // Este componente agora gerencia suas próprias chamadas de API
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProviders, updateProviderStatus as apiUpdateProviderStatus, deleteProvider } from "@/lib/api";
import { Provider, VerificationStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";


// CORREÇÃO: Função para formatar o tempo relativo em português
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Agora mesmo";
  if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} horas atrás`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} dias atrás`;
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
  // NOVO: Estado para o filtro de status
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "all">("all");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: providers, isLoading, isError, error } = useQuery<Provider[], Error>({
    queryKey: ['/providers'],
    queryFn: () => fetchProviders(),
  });

  // A mutation para updateProviderStatus não é mais usada diretamente aqui para o modal,
  // mas pode ser útil para outras operações na página de provedores.
  // Mantenho-a caso haja outras funcionalidades que a utilizem.
  const updateProviderStatusMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: VerificationStatus; rejectionReason?: string }) =>
      apiUpdateProviderStatus(id, status, rejectionReason),
    onSuccess: (updatedProvider) => {
      queryClient.invalidateQueries({ queryKey: ['/providers'] });
      queryClient.invalidateQueries({ queryKey: ['/verification/pending-queue'] });
      toast({
        title: "Status do Provedor Atualizado",
        description: `${updatedProvider.name} agora está ${updatedProvider.verificationStatus.replace(/_/g, ' ').toLowerCase()}.`,
      });
      // O modal é fechado pelo próprio VerificationModal após a ação
      // setIsModalOpen(false);
      // setSelectedProvider(null);
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao Atualizar Status",
        description: err.message || "Ocorreu um erro ao atualizar o status do provedor.",
        variant: "destructive",
      });
    },
  });

  // CORREÇÃO: Lógica de filtro aprimorada para incluir o status
  const filteredProviders = providers?.filter((provider: Provider) => {
    const matchesSearch = (provider.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (provider.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || provider.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const deleteProviderMutation = useMutation({
    mutationFn: (id: string) => deleteProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/providers'] });
      toast({ title: "Conta removida", description: "Provedor excluído com sucesso.", variant: "success" });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao excluir",
        description: err?.message || "Não foi possível excluir o provedor.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProvider = (e: React.MouseEvent, providerId: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este provedor?')) {
      deleteProviderMutation.mutate(providerId);
    }
  };

  // As funções handleApproveProvider, handleRejectProvider, handleBlockProvider
  // foram movidas para dentro do VerificationModal, pois ele agora gerencia a API.
  // Elas não são mais necessárias aqui para serem passadas como props.

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Gerenciamento de Provedores"
          subtitle="Gerencie e verifique os provedores de serviço na plataforma."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          <Card className="mb-6 shadow-floating border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Input
                    type="text"
                    placeholder="Buscar provedores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* NOVO: Filtro de Status */}
                  <Select value={statusFilter} onValueChange={(value: VerificationStatus | "all") => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value={VerificationStatus.APPROVED}>Aprovado</SelectItem>
                      <SelectItem value={VerificationStatus.PENDING_MANUAL_REVIEW}>Revisão Manual Pendente</SelectItem>
                      <SelectItem value={VerificationStatus.PENDING_DOCUMENTS_UPLOAD}>Documentos Pendentes</SelectItem>
                      <SelectItem value={VerificationStatus.REJECTED}>Rejeitado</SelectItem>
                      <SelectItem value={VerificationStatus.BLOCKED}>Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50">
                    <Filter className="mr-2" size={16} />
                    Mais Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          {/* Imagem de perfil mockada, idealmente viria do provider.avatarUrl */}
                          <img 
                            src={provider.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${provider.name}`}
                            alt={`${provider.name} profile`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="ml-3">
                            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                            <p className="text-sm text-gray-500">{provider.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => handleDeleteProvider(e, provider.id)}
                            disabled={deleteProviderMutation.isPending}
                          >
                            Excluir
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal size={16} />
                          </Button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <Badge className={`border ${getStatusBadge(provider.verificationStatus || "")}`}>
                          {(provider.verificationStatus || "").replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            Avaliações
                          </span>
                          <span className="font-medium">{provider.fiveStarReviewCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Agendamentos Mensais</span>
                          <span className="font-medium">{provider.monthlyBookingsCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Ganhos Totais</span>
                          <span className="font-medium text-green-600">R$ {parseFloat(provider.totalEarnings || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {provider.city && ( // Usar city diretamente se disponível
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{provider.city}</span>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Entrou {formatRelativeTime(new Date(provider.createdAt || Date.now()))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {!isLoading && filteredProviders.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum provedor encontrado</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? `Nenhum provedor corresponde a "${searchTerm}"` : "Nenhum provedor registrado ainda."}
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
        // As props onApprove, onReject, onBlock foram removidas daqui
        // pois o VerificationModal agora lida com a lógica de API internamente.
      />
    </div>
  );
}
