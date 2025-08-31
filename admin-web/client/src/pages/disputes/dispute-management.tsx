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
import { Search, Filter, MessageSquare, CheckCircle, XCircle, Clock, MoreHorizontal, FileText, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllDisputes, fetchDisputeDetails, updateDisputeStatus, sendDisputeMessage } from "@/lib/api";
import { Dispute, DisputeStatus, DisputeReason, DisputeMessage } from "@/lib/types";

// Componente de Modal para Detalhes e Ações da Disputa
interface DisputeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeId: string | null;
}

const DisputeDetailsModal = ({ isOpen, onClose, disputeId }: DisputeDetailsModalProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newMessageContent, setNewMessageContent] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<DisputeStatus | "">("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: dispute, isLoading, isError, error } = useQuery<Dispute, Error>({
    queryKey: ['/disputes', disputeId],
    queryFn: () => fetchDisputeDetails(disputeId!),
    enabled: !!disputeId && isOpen, // Só executa a query se disputeId existir e o modal estiver aberto
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string, status: DisputeStatus, resolutionNotes?: string }) =>
      updateDisputeStatus(data.id, data.status, data.resolutionNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/disputes'] });
      queryClient.invalidateQueries({ queryKey: ['/disputes', disputeId] });
      toast({ title: "Sucesso!", description: "Status da disputa atualizado." });
      // Clear local state after successful update
      setSelectedStatus("");
      setResolutionNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao atualizar status: ${error.message}`, variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { disputeId: string, content: string }) =>
      sendDisputeMessage(data.disputeId, data.content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/disputes', disputeId] });
      toast({ title: "Sucesso!", description: "Mensagem enviada com sucesso." });
      setNewMessageContent("");
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao enviar mensagem: ${error.message}`, variant: "destructive" });
    },
  });

  const handleUpdateStatus = () => {
    if (disputeId && selectedStatus) {
      updateStatusMutation.mutate({ id: disputeId, status: selectedStatus, resolutionNotes });
    }
  };

  const handleSendMessage = () => {
    if (disputeId && newMessageContent.trim()) {
      sendMessageMutation.mutate({ disputeId, content: newMessageContent.trim() });
    }
  };

  if (!disputeId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Disputa: {dispute?.id.substring(0, 8)}...</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-center py-8">Carregando detalhes da disputa...</div>
        ) : isError ? (
          <div className="text-center py-8 text-red-600">Erro ao carregar disputa: {error?.message}</div>
        ) : dispute ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID do Agendamento</p>
                <p className="font-medium">{dispute.bookingId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Motivo</p>
                <p className="font-medium">{dispute.reason.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={getStatusBadgeClass(dispute.status)}>
                  {dispute.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Abertura</p>
                <p className="font-medium">{new Date(dispute.createdAt).toLocaleString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Descrição</p>
                <p className="font-medium">{dispute.description}</p>
              </div>
              {dispute.resolutionNotes && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Notas de Resolução</p>
                  <p className="font-medium">{dispute.resolutionNotes}</p>
                </div>
              )}
            </div>

            {/* Seção de Atualização de Status */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Atualizar Status da Disputa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Novo Status</Label>
                    <Select value={selectedStatus} onValueChange={(value: DisputeStatus) => setSelectedStatus(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o novo status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(DisputeStatus).map(status => (
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

            {/* Seção de Mensagens da Disputa */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Linha do Tempo de Mensagens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                  {dispute.messages && dispute.messages.length > 0 ? (
                    dispute.messages.map((message, index) => (
                      <div key={message.id || index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                          <span className="font-semibold">{message.sender?.name || `Usuário ${message.senderUserId?.substring(0, 8)}`}</span>
                          <span>{new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-800">{message.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center">Nenhuma mensagem nesta disputa ainda.</p>
                  )}
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <Input
                    placeholder="Digite uma nova mensagem..."
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending || !newMessageContent.trim()}>
                    <Send size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Placeholder para outras ações (Propor Acordo, Resolver) */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Outras Ações</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100" disabled>
                  Propor Acordo (Em Breve)
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100" disabled>
                  Resolver Disputa (Em Breve)
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default function DisputeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: disputes, isLoading, isError, error } = useQuery<Dispute[], Error>({
    queryKey: ['/disputes', statusFilter],
    queryFn: () => fetchAllDisputes(statusFilter !== 'all' ? statusFilter : undefined),
  });

  const handleViewDetails = (disputeId: string) => {
    setSelectedDisputeId(disputeId);
    setIsDetailsModalOpen(true);
  };

  const filteredDisputes = disputes?.filter(dispute => {
    const matchesSearch = dispute.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dispute.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dispute.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadgeClass = (status: DisputeStatus) => {
    switch (status) {
      case DisputeStatus.PENDING: return "bg-yellow-100 text-yellow-700";
      case DisputeStatus.IN_REVIEW: return "bg-blue-100 text-blue-700";
      case DisputeStatus.RESOLVED: return "bg-green-100 text-green-700";
      case DisputeStatus.REJECTED: return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Calculate key metrics
  const totalDisputes = disputes?.length || 0;
  const pendingDisputes = disputes?.filter(d => d.status === DisputeStatus.PENDING).length || 0;
  const inReviewDisputes = disputes?.filter(d => d.status === DisputeStatus.IN_REVIEW).length || 0;
  const resolvedDisputes = disputes?.filter(d => d.status === DisputeStatus.RESOLVED).length || 0;

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Gerenciamento de Disputas"
          subtitle="Monitore e resolva conflitos entre clientes e provedores."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Disputas</p>
                      <p className="text-2xl font-bold text-gray-900">{totalDisputes}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <MessageSquare className="text-blue-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Disputas Pendentes</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingDisputes}</p>
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
                      <p className="text-2xl font-bold text-gray-900">{inReviewDisputes}</p>
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
                      <p className="text-sm font-medium text-gray-600">Disputas Resolvidas</p>
                      <p className="text-2xl font-bold text-gray-900">{resolvedDisputes}</p>
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
                      placeholder="Buscar disputas por ID, motivo ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={(value: DisputeStatus | "all") => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      {Object.values(DisputeStatus).map(status => (
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

          {/* Dispute List */}
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
                  <p>Erro ao carregar disputas: {error?.message}</p>
                </div>
              ) : filteredDisputes.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma disputa encontrada</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `Nenhuma disputa corresponde a "${searchTerm}"` : "Nenhuma disputa registrada ainda."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDisputes.map((dispute, index) => {
                    const statusClass = getStatusBadgeClass(dispute.status);
                    
                    return (
                      <motion.div
                        key={dispute.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                dispute.status === DisputeStatus.RESOLVED ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                                <MessageSquare size={20} />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-gray-900">Disputa #{dispute.id.substring(0, 8)}</h3>
                                <Badge className={`text-xs px-2 py-1 border-0 ${statusClass}`}>
                                  {dispute.status.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Booking ID: {dispute.bookingId.substring(0, 8)}...</span>
                                <span>Motivo: {dispute.reason.replace(/_/g, ' ')}</span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span>Aberto em: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                                {dispute.resolvedAt && <span>Resolvido em: {new Date(dispute.resolvedAt).toLocaleDateString()}</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
                              onClick={() => handleViewDetails(dispute.id)}
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

      <DisputeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedDisputeId(null);
        }}
        disputeId={selectedDisputeId}
      />
    </div>
  );
}