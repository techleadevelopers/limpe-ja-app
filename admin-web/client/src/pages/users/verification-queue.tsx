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

const getProviderFullName = (provider?: Provider | null) =>
  provider?.fullName || provider?.name || "Sem nome";

export default function VerificationQueue() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: queue, isLoading, isError, error } = useQuery<Provider[], Error>({
    queryKey: ['/verification/pending-queue'],
    queryFn: () => fetchVerificationQueue(),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  const updateProviderStatusMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: VerificationStatus; rejectionReason?: string }) =>
      apiUpdateProviderStatus(id, status, rejectionReason),
    onSuccess: (updatedProvider) => {
      queryClient.invalidateQueries({ queryKey: ['/verification/pending-queue'] });
      queryClient.invalidateQueries({ queryKey: ['/providers'] });
      toast({
        title: "Status do Provedor Atualizado",
        description: `${getProviderFullName(updatedProvider)} agora está ${updatedProvider.verificationStatus}.`,
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
  const selectedProviderStatusInfo = selectedProvider ? getStatusInfo(selectedProvider.verificationStatus || "") : null;

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Fila de Verificação"
          subtitle={`${queue?.length || 0} provedores aguardando revisão de verificação.`}
        />
        
        <main className="flex-1 overflow-y-auto p-8 scrollbar-premium">
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

          <section className="md:flex md:gap-6">
            <div className="flex-1">
              <div className="rounded-[32px] border border-white/70 bg-white shadow-floating shadow-slate-200/70">
                <div className="px-6 py-6">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-5 border-b border-gray-100 pb-4">
                    <div>
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-gray-400">Fila de Verificacao</p>
                      <h2 className="text-2xl font-semibold text-gray-900">Provedores aguardando</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-yellow-500/80" />
                        Documentos
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-orange-500/80" />
                        Revisão
                      </div>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-5 animate-pulse">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                            <div className="space-y-2">
                              <div className="h-4 w-28 rounded bg-gray-200" />
                              <div className="h-3 w-20 rounded bg-gray-200" />
                            </div>
                          </div>
                          <div className="space-y-2 text-right">
                            <div className="h-6 w-24 rounded-full bg-gray-200" />
                            <div className="h-3 w-16 rounded bg-gray-200" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isError ? (
                    <div className="text-center py-12 text-red-600 text-sm">
                      <p>Erro ao carregar a fila de verificacao: {error?.message}</p>
                    </div>
                  ) : queue?.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma verificacao pendente</h3>
                      <p className="text-gray-500">Todos os provedores foram verificados. Otimo trabalho</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {queue?.map((provider: Provider, index: number) => {
                        const providerFullName = getProviderFullName(provider);
                        const statusInfo = getStatusInfo(provider.verificationStatus || "");
                        const StatusIcon = statusInfo.icon;
                        const isActive = selectedProvider?.id === provider.id;
                        return (
                          <motion.div
                            key={provider.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={`flex w-full items-center gap-4 rounded-[26px] border px-4 py-5 transition-all duration-200 cursor-pointer ${isActive ? "border-light-blue/60 bg-light-blue/10 shadow-lg" : "border-transparent bg-slate-50/70 hover:border-gray-200 hover:bg-white hover:shadow-lg"}`}
                            onClick={() => handleProviderClick(provider)}
                          >
                            <div className={`w-12 h-12 ${statusInfo.iconBg} rounded-2xl flex items-center justify-center`}>
                              <StatusIcon size={20} />
                            </div>

                            <div className="flex-1 min-w-0 flex items-center gap-3">
                              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-white bg-gray-200 shadow-sm">
                                <img
                                  src={provider.avatarUrl || "https://static.limpeja.com/default-avatar.png"}
                                  alt={`Avatar de ${providerFullName}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="truncate text-lg font-semibold text-gray-900">{providerFullName}</h3>
                                  <Badge className={`text-xs px-2 py-1 border ${statusInfo.badge}`}>
                                    {statusInfo.priority} Prioridade
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{provider.email}</p>
                                <p className="text-xs text-gray-500 mt-1">{statusInfo.text}</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 text-right">
                              <Badge className={`border ${statusInfo.badge} bg-white/80 text-xs font-semibold`}>
                                {provider.verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD ? "Documentos" : "Revisão"}
                              </Badge>
                              <p className="text-xs text-gray-500">
                                {formatRelativeTime(new Date(provider.createdAt))}
                              </p>
                              <Button size="sm" className="bg-medium-blue hover:bg-blue-700 text-white">
                                Revisar
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedProvider && (
              <div className="mt-6 md:mt-0 md:w-1/2">
                <div className="rounded-[32px] border border-white/70 bg-white shadow-floating shadow-slate-200/70 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-light-blue/30 flex items-center justify-center">
                      <Eye className="text-medium-blue" size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Selecionado</p>
                      <h3 className="text-lg font-semibold text-gray-900">{getProviderFullName(selectedProvider)}</h3>
                      <p className="text-sm text-gray-600">{selectedProvider.email || selectedProvider.phone || "Contato nao informado"}</p>
                    </div>
                  </div>

                  {selectedProviderStatusInfo && (
                    <p className="text-sm text-gray-500 mb-4">{selectedProviderStatusInfo.text}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-5 text-xs uppercase tracking-wide text-gray-500">
                    <div>
                      <p className="text-[0.65rem]">Status atual</p>
                      <p className="text-base font-semibold text-gray-900">{selectedProvider.verificationStatus}</p>
                    </div>
                    <div>
                      <p className="text-[0.65rem]">Tempo na fila</p>
                      <p className="text-base font-semibold text-gray-900">{formatRelativeTime(new Date(selectedProvider.createdAt || Date.now()))}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      onClick={() => handleApproveProvider(selectedProvider.id)}
                      className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white sm:w-auto"
                    >
                      Aprovar (A)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const reason = prompt("Motivo da rejeicao?") || "";
                        handleRejectProvider(selectedProvider.id, reason);
                      }}
                      className="w-full rounded-2xl sm:w-auto"
                    >
                      Rejeitar (R)
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleBlockProvider(selectedProvider.id)}
                      className="w-full rounded-2xl sm:w-auto"
                    >
                      Bloquear (B)
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">Atalhos: A aprovar, R rejeitar, B bloquear</p>
                </div>
              </div>
            )}
          </section>
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
