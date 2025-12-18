import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Eye, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import VerificationModal from "@/components/verification/verification-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVerificationQueue, updateProviderStatus as apiUpdateProviderStatus } from "@/lib/api";
import { Provider, VerificationStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return "Just now";
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

function getStatusInfo(status: string) {
  switch (status) {
    case VerificationStatus.PENDING_DOCUMENTS_UPLOAD:
      return {
        badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: FileText,
        iconBg: "bg-yellow-100 text-yellow-600",
        text: "Documentos enviados",
        priority: "Média",
      };
    case VerificationStatus.PENDING_MANUAL_REVIEW:
      return {
        badge: "bg-orange-100 text-orange-700 border-orange-200",
        icon: Eye,
        iconBg: "bg-orange-100 text-orange-600",
        text: "Revisão manual necessária",
        priority: "Alta",
      };
    default:
      return {
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        icon: AlertCircle,
        iconBg: "bg-blue-100 text-blue-600",
        text: "Verificação pendente",
        priority: "Baixa",
      };
  }
}

const getDisplayName = (provider?: Provider | null) =>
  provider?.fullName || provider?.name || "Sem nome";

export default function VerificationQueue() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: queue, isLoading, isError, error } = useQuery<Provider[], Error>({
    queryKey: ['/verification/pending-queue'],
    queryFn: () => fetchVerificationQueue(),
  });

  const updateProviderStatusMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: VerificationStatus; rejectionReason?: string }) =>
      apiUpdateProviderStatus(id, status, rejectionReason),
    onSuccess: (updatedProvider) => {
      queryClient.invalidateQueries({ queryKey: ['/verification/pending-queue'] });
      queryClient.invalidateQueries({ queryKey: ['/providers'] });
      toast({
        title: "Status do Provedor Atualizado",
        description: `${getDisplayName(updatedProvider)} agora está ${updatedProvider.verificationStatus}.`,
      });
      setIsModalOpen(false);
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

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    if (window.innerWidth < 768) {
      setIsModalOpen(true);
    }
  };

  const handleApproveProvider = (providerId: string) => {
    updateProviderStatusMutation.mutate({ id: providerId, status: VerificationStatus.APPROVED });
  };

  const handleRejectProvider = (providerId: string, reason: string) => {
    updateProviderStatusMutation.mutate({ id: providerId, status: VerificationStatus.REJECTED, rejectionReason: reason });
  };

  const handleBlockProvider = (providerId: string) => {
    if (confirm("Tem certeza que deseja bloquear este provedor?")) {
      updateProviderStatusMutation.mutate({ id: providerId, status: VerificationStatus.BLOCKED });
    }
  };

  // Atalhos de teclado quando há um provedor selecionado (somente desktop)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedProvider || isModalOpen) return;
      const k = e.key.toLowerCase();
      if (k === 'a') {
        e.preventDefault();
        handleApproveProvider(selectedProvider.id);
      } else if (k === 'r') {
        e.preventDefault();
        const reason = prompt('Motivo da rejeição?') || '';
        handleRejectProvider(selectedProvider.id, reason);
      } else if (k === 'b') {
        e.preventDefault();
        handleBlockProvider(selectedProvider.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedProvider, isModalOpen]);

  const pendingDocuments = queue?.filter((p: Provider) => p.verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD) || [];
  const pendingReview = queue?.filter((p: Provider) => p.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW) || [];

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Fila de Verificação"
          subtitle={`${queue?.length || 0} provedores aguardando revisão de verificação.`}
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="text-orange-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Pendente</p>
                    <p className="text-2xl font-bold text-gray-900">{queue?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <FileText className="text-yellow-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upload de Documentos</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingDocuments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Eye className="text-red-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revisão Manual</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingReview.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:flex md:space-x-6">
            <Card className="glass-card shadow-floating border-0 md:w-1/2">
              <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center p-4 bg-gray-50 rounded-xl animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="text-right">
                        <div className="w-20 h-6 bg-gray-200 rounded-full mb-2"></div>
                        <div className="w-16 h-3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="text-center py-12 text-red-600">
                  <p>Erro ao carregar a fila de verificação: {error?.message}</p>
                </div>
              ) : queue?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma verificação pendente</h3>
                  <p className="text-gray-500">Todos os provedores foram verificados. Ótimo trabalho!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {queue?.map((provider: Provider, index: number) => {
                    const displayName = getDisplayName(provider);
                    const statusInfo = getStatusInfo(provider.verificationStatus || "");
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <motion.div
                        key={provider.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`flex items-center p-4 rounded-xl transition-all duration-200 cursor-pointer ${selectedProvider?.id === provider.id ? "bg-light-blue/20 ring-1 ring-light-blue/40" : "bg-gray-50 hover:bg-gray-100 hover:shadow-md"}`}
                        onClick={() => handleProviderClick(provider)}
                      >
                        <div className={`w-12 h-12 ${statusInfo.iconBg} rounded-xl flex items-center justify-center`}>
                          <StatusIcon size={20} />
                        </div>
                        
                        <div className="ml-4 flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">{displayName}</h3>
                            <Badge className={`text-xs px-2 py-1 border ${statusInfo.badge}`}>
                              {statusInfo.priority} Prioridade
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{provider.email}</p>
                          <p className="text-xs text-gray-500 mt-1">{statusInfo.text}</p>
                        </div>
                        
                        <div className="text-right">
                          <Badge className={`border ${statusInfo.badge} mb-2`}>
                            {provider.verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD ? "Documentos" : "Revisão"}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(new Date(provider.createdAt))}
                          </p>
                          <div className="mt-2">
                            <Button size="sm" className="bg-medium-blue hover:bg-blue-700 text-white">
                              Revisar
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              </CardContent>
            </Card>

            {selectedProvider && (
              <Card className="glass-card shadow-floating border-0 mt-6 md:mt-0 md:w-1/2">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-light-blue/30 flex items-center justify-center mr-3">
                      <Eye className="text-medium-blue" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{getDisplayName(selectedProvider)}</h3>
                      <p className="text-sm text-gray-600">{selectedProvider.email || selectedProvider.phone || "Contato não informado"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Status atual</p>
                      <p className="text-sm font-medium">{selectedProvider.verificationStatus}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tempo na fila</p>
                      <p className="text-sm font-medium">{formatRelativeTime(new Date(selectedProvider.createdAt || Date.now()))}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => handleApproveProvider(selectedProvider.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white">Aprovar (A)</Button>
                    <Button variant="outline" onClick={() => {
                      const reason = prompt("Motivo da rejeição?") || "";
                      handleRejectProvider(selectedProvider.id, reason);
                    }}>Rejeitar (R)</Button>
                    <Button variant="destructive" onClick={() => handleBlockProvider(selectedProvider.id)}>Bloquear (B)</Button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">Atalhos: A aprovar, R rejeitar, B bloquear</p>
                </CardContent>
              </Card>
            )}
          </div>
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
