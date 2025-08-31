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
import { Search, Users, Gift, TrendingUp, CheckCircle, MoreHorizontal } from "lucide-react"; // Importando ícones relevantes
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Assumindo que você terá funções de API para indicações
import { fetchAllReferrals, fetchReferralDetails, updateReferralStatus, issueReferralReward } from "@/lib/api";
// Assumindo que você terá um tipo Referral e um enum ReferralStatus
import { Referral, ReferralStatus } from "@/lib/types";

// Helper function for status badge styling (similar to BookingStatus or ClientStatus)
const getStatusBadgeClass = (status: ReferralStatus) => {
  switch (status) {
    case ReferralStatus.PENDING: return "bg-yellow-100 text-yellow-700";
    case ReferralStatus.CONVERTED: return "bg-green-100 text-green-700";
    case ReferralStatus.REWARDED: return "bg-blue-100 text-blue-700";
    case ReferralStatus.CANCELED: return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

// Componente de Modal para Detalhes e Ações da Indicação
interface ReferralDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralId: string | null;
}

const ReferralDetailsModal = ({ isOpen, onClose, referralId }: ReferralDetailsModalProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<ReferralStatus | "">("");
  const [notes, setNotes] = useState("");

  const { data: referral, isLoading, isError, error } = useQuery<Referral, Error>({
    queryKey: ['/referrals', referralId],
    queryFn: () => fetchReferralDetails(referralId!),
    enabled: !!referralId && isOpen,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string, status: ReferralStatus, notes?: string }) =>
      updateReferralStatus(data.id, data.status, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/referrals'] });
      queryClient.invalidateQueries({ queryKey: ['/referrals', referralId] });
      toast({ title: "Sucesso!", description: "Status da indicação atualizado." });
      setSelectedStatus("");
      setNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao atualizar status: ${error.message}`, variant: "destructive" });
    },
  });

  const issueRewardMutation = useMutation({
    mutationFn: (id: string) => issueReferralReward(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/referrals'] });
      queryClient.invalidateQueries({ queryKey: ['/referrals', referralId] });
      toast({ title: "Sucesso!", description: "Recompensa emitida com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao emitir recompensa: ${error.message}`, variant: "destructive" });
    },
  });

  const handleUpdateStatus = () => {
    if (referralId && selectedStatus) {
      updateStatusMutation.mutate({ id: referralId, status: selectedStatus, notes });
    }
  };

  const handleIssueReward = () => {
    if (referralId) {
      issueRewardMutation.mutate(referralId);
    }
  };

  if (!referralId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Indicação: {referral?.referralCode || referral?.id?.substring(0, 8)}...</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-center py-8">Carregando detalhes da indicação...</div>
        ) : isError ? (
          <div className="text-center py-8 text-red-600">Erro ao carregar indicação: {error?.message}</div>
        ) : referral ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID da Indicação</p>
                <p className="font-medium">{referral.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={getStatusBadgeClass(referral.status)}>
                  {referral.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Indicador</p>
                <p className="font-medium">{referral.referrerUser?.fullName || 'N/A'} (ID: {referral.referrerUserId?.substring(0, 8)}...)</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Indicado</p>
                <p className="font-medium">{referral.referredUser?.fullName || 'N/A'} (ID: {referral.referredUserId?.substring(0, 8)}...)</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Código de Indicação</p>
                <p className="font-medium">{referral.referralCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data da Indicação</p>
                <p className="font-medium">{new Date(referral.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Conversão</p>
                <p className="font-medium">{referral.convertedAt ? new Date(referral.convertedAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Recompensa Emitida?</p>
                <p className="font-medium">{referral.rewardIssued ? 'Sim' : 'Não'}</p>
              </div>
              {referral.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Notas</p>
                  <p className="font-medium">{referral.notes}</p>
                </div>
              )}
            </div>

            {/* Seção de Atualização de Status */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Atualizar Status da Indicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Novo Status</Label>
                    <Select value={selectedStatus} onValueChange={(value: ReferralStatus) => setSelectedStatus(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o novo status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ReferralStatus).map(status => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (Opcional)</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Adicione notas sobre a atualização"
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

            {/* Seção de Ações Específicas */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Ações de Recompensa</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button
                  onClick={handleIssueReward}
                  disabled={issueRewardMutation.isPending || referral.rewardIssued || referral.status !== ReferralStatus.CONVERTED}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Gift size={14} className="mr-1" />
                  Emitir Recompensa
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100" disabled>
                  Ver Perfil do Indicador
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100" disabled>
                  Ver Perfil do Indicado
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default function ReferralManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | "all">("all");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: referrals, isLoading, isError, error } = useQuery<Referral[], Error>({
    queryKey: ['/referrals', statusFilter],
    queryFn: () => fetchAllReferrals(statusFilter !== 'all' ? statusFilter : undefined),
  });

  const handleViewDetails = (referralId: string) => {
    setSelectedReferralId(referralId);
    setIsDetailsModalOpen(true);
  };

  const filteredReferrals = referrals?.filter(referral => {
    const matchesSearch = (referral.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           referral.referrerUser?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           referral.referredUser?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           referral.referralCode?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate key metrics
  const totalReferrals = referrals?.length || 0;
  const convertedReferrals = referrals?.filter(r => r.status === ReferralStatus.CONVERTED).length || 0;
  const rewardedReferrals = referrals?.filter(r => r.rewardIssued).length || 0;
  const conversionRate = totalReferrals > 0 ? ((convertedReferrals / totalReferrals) * 100).toFixed(2) : "0.00";

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Gerenciamento de Indicações"
          subtitle="Monitore e gerencie o programa de indicações e recompensas da plataforma LimpeJá."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Indicações</p>
                      <p className="text-2xl font-bold text-gray-900">{totalReferrals}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="text-blue-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Indicações Convertidas</p>
                      <p className="text-2xl font-bold text-gray-900">{convertedReferrals}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Recompensas Emitidas</p>
                      <p className="text-2xl font-bold text-gray-900">{rewardedReferrals}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Gift className="text-purple-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                      <p className="text-2xl font-bold text-gray-900">{conversionRate}%</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-orange-600" size={20} />
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
                      placeholder="Buscar indicações por nome, ID ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={(value: ReferralStatus | "all") => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      {Object.values(ReferralStatus).map(status => (
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

          {/* Referral List */}
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
                  <p>Erro ao carregar indicações: {error?.message}</p>
                </div>
              ) : filteredReferrals.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma indicação encontrada</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `Nenhuma indicação corresponde a "${searchTerm}"` : "Nenhuma indicação registrada ainda."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReferrals.map((referral, index) => {
                    const statusClass = getStatusBadgeClass(referral.status);
                    
                    return (
                      <motion.div
                        key={referral.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusClass}`}>
                                <Users size={20} /> {/* Pode ser um ícone mais específico para indicações */}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-gray-900">Indicação #{referral.id.substring(0, 8)}</h3>
                                <Badge className={`text-xs px-2 py-1 border-0 ${statusClass}`}>
                                  {referral.status.replace(/_/g, ' ')}
                                </Badge>
                                {referral.referralCode && (
                                  <Badge variant="outline" className="text-xs px-2 py-1 border-gray-300 text-gray-600">
                                    Código: {referral.referralCode}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Indicador: {referral.referrerUser?.fullName || `ID: ${referral.referrerUserId?.substring(0, 8)}...`}</span>
                                <span>Indicado: {referral.referredUser?.fullName || `ID: ${referral.referredUserId?.substring(0, 8)}...`}</span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span>Data: {new Date(referral.createdAt).toLocaleDateString()}</span>
                                <span>Convertida: {referral.convertedAt ? new Date(referral.convertedAt).toLocaleDateString() : 'Não'}</span>
                                <span>Recompensado: {referral.rewardIssued ? 'Sim' : 'Não'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
                              onClick={() => handleViewDetails(referral.id)}
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

      <ReferralDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedReferralId(null);
        }}
        referralId={selectedReferralId}
      />
    </div>
  );
}

// **Exemplo de como seriam os tipos e funções de API (em lib/types.ts e lib/api.ts):**

// lib/types.ts
/*
export enum ReferralStatus {
  PENDING = "PENDING",
  CONVERTED = "CONVERTED", // Indicado realizou a primeira ação (ex: primeira reserva)
  REWARDED = "REWARDED",   // Recompensa emitida
  CANCELED = "CANCELED",   // Indicação cancelada
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referrerUser?: { fullName: string }; // Populated via join
  referredUserId: string;
  referredUser?: { fullName: string }; // Populated via join
  referralCode: string;
  status: ReferralStatus;
  createdAt: string;
  convertedAt?: string;
  rewardIssued: boolean;
  notes?: string;
}
*/

// lib/api.ts
/*
import axios from 'axios'; // Ou sua instância de api configurada

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const fetchAllReferrals = async (status?: ReferralStatus): Promise<Referral[]> => {
  const response = await axios.get(`${API_BASE_URL}/referrals`, {
    params: { status }
  });
  return response.data;
};

export const fetchReferralDetails = async (id: string): Promise<Referral> => {
  const response = await axios.get(`${API_BASE_URL}/referrals/${id}`);
  return response.data;
};

export const updateReferralStatus = async (id: string, status: ReferralStatus, notes?: string): Promise<Referral> => {
  const response = await axios.patch(`${API_BASE_URL}/referrals/${id}/status`, { status, notes });
  return response.data;
};

export const issueReferralReward = async (id: string): Promise<Referral> => {
  const response = await axios.post(`${API_BASE_URL}/referrals/${id}/issue-reward`);
  return response.data;
};
*/