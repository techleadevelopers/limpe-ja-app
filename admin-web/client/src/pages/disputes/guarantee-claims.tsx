import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, ShieldCheck, Clock, FileText, CheckCircle, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllGuaranteeClaims, fetchGuaranteeClaimDetails, updateGuaranteeClaimStatus } from "@/lib/api";
import { GuaranteeClaim, ClaimStatus } from "@/lib/types";

// Helper function for status badge styling
const getStatusBadgeClass = (status: ClaimStatus) => {
  switch (status) {
    case ClaimStatus.PENDING: return "bg-yellow-100 text-yellow-700";
    case ClaimStatus.UNDER_REVIEW: return "bg-blue-100 text-blue-700";
    case ClaimStatus.APPROVED: return "bg-green-100 text-green-700";
    case ClaimStatus.REJECTED: return "bg-red-100 text-red-700";
    case ClaimStatus.SETTLED: return "bg-purple-100 text-purple-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

// Componente de Modal para Detalhes e Ações da Reclamação de Garantia
interface GuaranteeClaimDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string | null;
}

const GuaranteeClaimDetailsModal = ({ isOpen, onClose, claimId }: GuaranteeClaimDetailsModalProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus | "">("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: claim, isLoading, isError, error } = useQuery<GuaranteeClaim, Error>({
    queryKey: ['/guarantee/claims', claimId],
    queryFn: () => fetchGuaranteeClaimDetails(claimId!),
    enabled: !!claimId && isOpen, // Only fetch if claimId exists and modal is open
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string, status: ClaimStatus, resolutionNotes?: string }) =>
      updateGuaranteeClaimStatus(data.id, data.status, data.resolutionNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/guarantee/claims'] });
      queryClient.invalidateQueries({ queryKey: ['/guarantee/claims', claimId] });
      toast({ title: "Sucesso!", description: "Status da reclamação de garantia atualizado." });
      // Clear local state after successful update
      setSelectedStatus("");
      setResolutionNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao atualizar status: ${error.message}`, variant: "destructive" });
    },
  });

  const handleUpdateStatus = () => {
    if (claimId && selectedStatus) {
      updateStatusMutation.mutate({ id: claimId, status: selectedStatus, resolutionNotes });
    }
  };

  if (!claimId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Reclamação de Garantia: {claim?.id.substring(0, 8)}...</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-center py-8">Carregando detalhes da reclamação...</div>
        ) : isError ? (
          <div className="text-center py-8 text-red-600">Erro ao carregar reclamação: {error?.message}</div>
        ) : claim ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID da Reclamação</p>
                <p className="font-medium">{claim.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID do Agendamento</p>
                <p className="font-medium">{claim.bookingId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID do Cliente</p>
                <p className="font-medium">{claim.clientId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID do Provedor</p>
                <p className="font-medium">{claim.providerId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={getStatusBadgeClass(claim.status)}>
                  {claim.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Estimado</p>
                <p className="font-medium">{claim.estimatedValue ? `R$ ${claim.estimatedValue.toFixed(2)}` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Resolvido</p>
                <p className="font-medium">{claim.resolvedValue ? `R$ ${claim.resolvedValue.toFixed(2)}` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Abertura</p>
                <p className="font-medium">{new Date(claim.createdAt).toLocaleString()}</p>
              </div>
              {claim.resolvedAt && (
                <div>
                  <p className="text-sm text-gray-500">Data de Resolução</p>
                  <p className="font-medium">{new Date(claim.resolvedAt).toLocaleString()}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Descrição</p>
                <p className="font-medium">{claim.description}</p>
              </div>
              {claim.resolutionNotes && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Notas de Resolução</p>
                  <p className="font-medium">{claim.resolutionNotes}</p>
                </div>
              )}
              {claim.attachments && claim.attachments.length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-2">Anexos</p>
                  <div className="flex flex-wrap gap-2">
                    {claim.attachments.map((url, index) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Anexo {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section to Update Claim Status */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Atualizar Status da Reclamação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Novo Status</Label>
                    <Select value={selectedStatus} onValueChange={(value: ClaimStatus) => setSelectedStatus(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o novo status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ClaimStatus).map(status => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resolutionNotes">Notas de Resolução (Opcional)</Label>
                    <Input
                      id="resolutionNotes"
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Adicione notas sobre a resolução"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={updateStatusMutation.isPending || !selectedStatus}
                    className="bg-medium-blue hover:bg-blue-700 text-white"
                  >
                    Atualizar Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default function GuaranteeClaimsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "all">("all");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: claims, isLoading, isError, error } = useQuery<GuaranteeClaim[], Error>({
    queryKey: ['/guarantee/claims', statusFilter],
    queryFn: () => fetchAllGuaranteeClaims(statusFilter !== 'all' ? statusFilter : undefined),
  });

  const handleViewDetails = (claimId: string) => {
    setSelectedClaimId(claimId);
    setIsDetailsModalOpen(true);
  };

  const filteredClaims = claims?.filter(claim => {
    const matchesSearch = claim.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          claim.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          claim.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          claim.providerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate key metrics
  const totalClaims = claims?.length || 0;
  const pendingClaims = claims?.filter(c => c.status === ClaimStatus.PENDING).length || 0;
  const underReviewClaims = claims?.filter(c => c.status === ClaimStatus.UNDER_REVIEW).length || 0;
  const resolvedClaims = claims?.filter(c => c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.REJECTED || c.status === ClaimStatus.SETTLED).length || 0;

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Gerenciamento de Reclamações de Garantia"
          subtitle="Monitore e resolva solicitações de garantia de serviço."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Reclamações</p>
                      <p className="text-2xl font-bold text-gray-900">{totalClaims}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="text-blue-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reclamações Pendentes</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingClaims}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Clock className="text-yellow-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Em Revisão</p>
                      <p className="text-2xl font-bold text-gray-900">{underReviewClaims}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <FileText className="text-purple-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reclamações Resolvidas</p>
                      <p className="text-2xl font-bold text-gray-900">{resolvedClaims}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6 shadow-floating border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Input
                      type="text"
                      placeholder="Buscar reclamações por ID do agendamento, cliente, provedor ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={(value: ClaimStatus | "all") => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      {Object.values(ClaimStatus).map(status => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claims List */}
          <Card className="shadow-floating border-0">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center p-4 bg-gray-50 rounded-xl animate-pulse">
                      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="w-24 h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="text-center py-12 text-red-600">
                  <p>Erro ao carregar reclamações: {error?.message}</p>
                </div>
              ) : filteredClaims.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma reclamação encontrada</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `Nenhuma reclamação corresponde a "${searchTerm}"` : "Nenhuma reclamação registrada ainda."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClaims.map((claim, index) => {
                    const statusClass = getStatusBadgeClass(claim.status);
                    
                    return (
                      <motion.div
                        key={claim.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusClass}`}>
                                <ShieldCheck size={20} />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-gray-900">Reclamação #{claim.id.substring(0, 8)}</h3>
                                <Badge className={`text-xs px-2 py-1 border-0 ${statusClass}`}>
                                  {claim.status.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Booking ID: {claim.bookingId.substring(0, 8)}...</span>
                                <span>Cliente: {claim.clientId.substring(0, 8)}...</span>
                                <span>Provedor: {claim.providerId.substring(0, 8)}...</span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span>Aberto em: {new Date(claim.createdAt).toLocaleDateString()}</span>
                                {claim.resolvedAt && <span>Resolvido em: {new Date(claim.resolvedAt).toLocaleDateString()}</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
                              onClick={() => handleViewDetails(claim.id)}
                            >
                              <MoreHorizontal size={14} className="mr-1" />
                              Ver Detalhes
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
        </main>
      </div>

      <GuaranteeClaimDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedClaimId(null);
        }}
        claimId={selectedClaimId}
      />
    </div>
  );
}