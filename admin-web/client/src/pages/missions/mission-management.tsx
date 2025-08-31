import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Filter, Award, Calendar, CheckCircle, XCircle, Users, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMissions, createMission, updateMission, deleteMission } from "@/lib/api";
import { Mission, MissionStatus, MissionTargetAudience } from "@/lib/types";

// Componente de Modal para Adicionar/Editar Missão
interface MissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission?: Mission; // Se for para edição, passa a missão existente
}

const MissionFormModal = ({ isOpen, onClose, mission }: MissionFormModalProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Mission>>(() => mission || {
    title: '',
    description: '',
    rewardAmount: 0,
    rewardType: 'POINTS', // Default para pontos
    status: MissionStatus.ACTIVE,
    targetAudience: MissionTargetAudience.ALL,
    targetId: null,
    startDate: new Date().toISOString().split('T')[0], // Data atual
    endDate: '',
    maxCompletions: 0,
  });

  useEffect(() => {
    setFormData(mission || {
      title: '',
      description: '',
      rewardAmount: 0,
      rewardType: 'POINTS',
      status: MissionStatus.ACTIVE,
      targetAudience: MissionTargetAudience.ALL,
      targetId: null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      maxCompletions: 0,
    });
  }, [isOpen, mission]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Mission, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleNumberChange = (id: keyof Mission, value: string) => {
    setFormData(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
  };

  const addMissionMutation = useMutation({
    mutationFn: createMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/missions'] });
      toast({ title: "Sucesso!", description: "Missão criada com sucesso." });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao criar missão: ${error.message}`, variant: "destructive" });
    },
  });

  const updateMissionMutation = useMutation({
    mutationFn: (data: { id: string, missionData: Partial<Mission> }) => updateMission(data.id, data.missionData),
    onSuccess: (updatedMission) => {
      queryClient.invalidateQueries({ queryKey: ['/missions'] });
      toast({ title: "Sucesso!", description: `Missão "${updatedMission.title}" atualizada com sucesso.` });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao atualizar missão: ${error.message}`, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (mission) {
      updateMissionMutation.mutate({ id: mission.id, missionData: formData });
    } else {
      const { id, timesCompleted, createdAt, updatedAt, ...missionDataToCreate } = formData;
      addMissionMutation.mutate(missionDataToCreate as Omit<Mission, 'id' | 'timesCompleted' | 'createdAt' | 'updatedAt'>);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mission ? "Editar Missão" : "Criar Nova Missão"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Missão</Label>
              <Input id="title" value={formData.title || ''} onChange={handleInputChange} placeholder="Ex: Primeira Limpeza Completa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rewardAmount">Valor da Recompensa</Label>
              <Input id="rewardAmount" type="number" value={formData.rewardAmount || 0} onChange={(e) => handleNumberChange('rewardAmount', e.target.value)} placeholder="Ex: 50 (R$ ou pontos)" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={formData.description || ''} onChange={handleInputChange} placeholder="Descreva os requisitos da missão..." className="h-24" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rewardType">Tipo de Recompensa</Label>
              <Select value={formData.rewardType} onValueChange={(value: 'FIXED_AMOUNT' | 'POINTS') => handleSelectChange('rewardType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED_AMOUNT">Valor Fixo (R$)</SelectItem>
                  <SelectItem value="POINTS">Pontos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status da Missão</Label>
              <Select value={formData.status} onValueChange={(value: MissionStatus) => handleSelectChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MissionStatus.ACTIVE}>Ativa</SelectItem>
                  <SelectItem value={MissionStatus.INACTIVE}>Inativa</SelectItem>
                  <SelectItem value={MissionStatus.COMPLETED}>Concluída (Manualmente)</SelectItem>
                  <SelectItem value={MissionStatus.EXPIRED}>Expirada (Manualmente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input id="startDate" type="date" value={formData.startDate?.split('T')[0] || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término</Label>
              <Input id="endDate" type="date" value={formData.endDate?.split('T')[0] || ''} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Público Alvo</Label>
              <Select value={formData.targetAudience} onValueChange={(value: MissionTargetAudience) => handleSelectChange('targetAudience', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o público" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MissionTargetAudience.ALL}>Todos</SelectItem>
                  <SelectItem value={MissionTargetAudience.NEW_CLIENTS}>Novos Clientes</SelectItem>
                  <SelectItem value={MissionTargetAudience.SPECIFIC_PROVIDER}>Provedor Específico</SelectItem>
                  <SelectItem value={MissionTargetAudience.SPECIFIC_CLIENT}>Cliente Específico</SelectItem>
                  <SelectItem value={MissionTargetAudience.SPECIFIC_SERVICE}>Serviço Específico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.targetAudience !== MissionTargetAudience.ALL && (
              <div className="space-y-2">
                <Label htmlFor="targetId">ID do Alvo</Label>
                <Input id="targetId" value={formData.targetId || ''} onChange={handleInputChange} placeholder="ID do cliente/provedor/serviço" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxCompletions">Máximo de Conclusões (0 para ilimitado)</Label>
            <Input id="maxCompletions" type="number" value={formData.maxCompletions || 0} onChange={(e) => handleNumberChange('maxCompletions', e.target.value)} placeholder="Ex: 1" />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={addMissionMutation.isPending || updateMissionMutation.isPending} className="bg-medium-blue hover:bg-blue-700 text-white">
              {mission ? "Salvar Alterações" : "Criar Missão"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function MissionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<MissionStatus | "all">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: missions, isLoading, isError, error } = useQuery<Mission[], Error>({
    queryKey: ['/missions'],
    queryFn: () => fetchMissions(),
  });

  const deleteMissionMutation = useMutation({
    mutationFn: deleteMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/missions'] });
      toast({ title: "Sucesso!", description: "Missão excluída com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao excluir missão: ${error.message}`, variant: "destructive" });
    },
  });

  const handleDeleteMission = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta missão?")) {
      deleteMissionMutation.mutate(id);
    }
  };

  const handleEditMission = (mission: Mission) => {
    setSelectedMission(mission);
    setIsEditModalOpen(true);
  };

  const filteredMissions = missions?.filter(mission => {
    const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || mission.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadgeClass = (status: MissionStatus) => {
    switch (status) {
      case MissionStatus.ACTIVE: return "bg-green-100 text-green-700";
      case MissionStatus.INACTIVE: return "bg-blue-100 text-blue-700";
      case MissionStatus.COMPLETED: return "bg-purple-100 text-purple-700";
      case MissionStatus.EXPIRED: return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const activeMissions = missions?.filter(m => m.status === MissionStatus.ACTIVE).length || 0;
  const completedMissions = missions?.filter(m => m.status === MissionStatus.COMPLETED).length || 0;
  const totalRewardsIssued = missions?.reduce((sum, m) => sum + (m.timesCompleted * m.rewardAmount), 0) || 0;


  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Gerenciamento de Missões"
          subtitle="Crie e gerencie missões gamificadas para engajar usuários."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Missões</p>
                      <p className="text-2xl font-bold text-gray-900">{missions?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Award className="text-blue-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Missões Ativas</p>
                      <p className="text-2xl font-bold text-gray-900">{activeMissions}</p>
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
                      <p className="text-sm font-medium text-gray-600">Missões Concluídas</p>
                      <p className="text-2xl font-bold text-gray-900">{completedMissions}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users className="text-purple-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Recompensas Emitidas</p>
                      <p className="text-2xl font-bold text-gray-900">R$ {totalRewardsIssued.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="text-orange-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filters and Add Mission Button */}
          <Card className="mb-6 shadow-floating border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Input
                      type="text"
                      placeholder="Buscar missões por título ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={(value: MissionStatus | "all") => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value={MissionStatus.ACTIVE}>Ativa</SelectItem>
                      <SelectItem value={MissionStatus.INACTIVE}>Inativa</SelectItem>
                      <SelectItem value={MissionStatus.COMPLETED}>Concluída</SelectItem>
                      <SelectItem value={MissionStatus.EXPIRED}>Expirada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-medium-blue hover:bg-blue-700 text-white">
                  <Plus className="mr-2" size={16} />
                  Criar Missão
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mission List */}
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
                  <p>Erro ao carregar missões: {error?.message}</p>
                </div>
              ) : filteredMissions.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma missão encontrada</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `Nenhuma missão corresponde a "${searchTerm}"` : "Nenhuma missão registrada ainda."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMissions.map((mission, index) => {
                    const statusClass = getStatusBadgeClass(mission.status);
                    
                    return (
                      <motion.div
                        key={mission.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                mission.rewardType === 'FIXED_AMOUNT' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                                {mission.rewardType === 'FIXED_AMOUNT' ? <DollarSign size={20} /> : <Award size={20} />}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-gray-900">{mission.title}</h3>
                                <Badge className={`text-xs px-2 py-1 border-0 ${statusClass}`}>
                                  {mission.status.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">{mission.description}</p>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span>Recompensa: {mission.rewardType === 'FIXED_AMOUNT' ? `R$ ${mission.rewardAmount.toFixed(2)}` : `${mission.rewardAmount} Pontos`}</span>
                                <span>Concluções: {mission.timesCompleted} / {mission.maxCompletions === 0 ? '∞' : mission.maxCompletions}</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                <span>Alvo: {mission.targetAudience.replace(/_/g, ' ')} {mission.targetId ? `(${mission.targetId})` : ''}</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                <span>Período: {new Date(mission.startDate).toLocaleDateString()} - {new Date(mission.endDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
                              onClick={() => handleEditMission(mission)}
                            >
                              <Edit size={14} className="mr-1" />
                              Editar
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                              onClick={() => handleDeleteMission(mission.id)}
                              disabled={deleteMissionMutation.isPending}
                            >
                              <Trash2 size={14} />
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

      <MissionFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <MissionFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMission(null);
        }}
        mission={selectedMission || undefined}
      />
    </div>
  );
}