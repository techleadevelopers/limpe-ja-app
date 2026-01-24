import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, DollarSign, Users, CheckCircle, Plus, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Tipos (ajuste em @/lib/types se necessário)
interface SubscriptionPlan {
  id: string;
  name: string;
  features: string; // JSON ou string separada por vírgula
  price: number;
  validityMonths: number;
  status: 'active' | 'inactive' | 'paused';
  createdAt: string;
}

// Funções API (crie em @/lib/api se não existir, baseadas em subscriptionService.ts)
const fetchSubscriptions = async (): Promise<SubscriptionPlan[]> => {
  // Simule ou chame API real
  const response = await fetch('/api/subscriptions'); // Exemplo
  return response.json();
};
const createSubscription = async (data: Omit<SubscriptionPlan, 'id' | 'createdAt'>): Promise<SubscriptionPlan> => {
  const response = await fetch('/api/subscriptions', { method: 'POST', body: JSON.stringify(data) });
  return response.json();
};
const updateSubscription = async (id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
  const response = await fetch(`/api/subscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  return response.json();
};
const deleteSubscription = async (id: string): Promise<void> => {
  await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
};

// Badge para status
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'inactive': return 'bg-gray-100 text-gray-700';
    case 'paused': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-red-100 text-red-700';
  }
};

export default function SubscriptionManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'paused'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<Omit<SubscriptionPlan, 'id' | 'createdAt'>>({
    name: '',
    features: '',
    price: 0,
    validityMonths: 1,
    status: 'active',
  });

  // Query para buscar planos
  const { data: plans = [], isLoading, isError, error } = useQuery<SubscriptionPlan[], Error>({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptions,
  });

  // Mutation para criar plano
  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: "Sucesso!", description: `Plano "${newPlan.name}" criado com sucesso.` });
      setIsModalOpen(false);
      setFormData({ name: '', features: '', price: 0, validityMonths: 1, status: 'active' });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message || 'Falha ao criar plano', variant: "destructive" }),
  });

  // Mutation para atualizar plano
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<SubscriptionPlan> }) => updateSubscription(data.id, data.updates),
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: "Sucesso!", description: `Plano "${updatedPlan.name}" atualizado com sucesso.` });
      setIsModalOpen(false);
      setEditingPlan(null);
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message || 'Falha ao atualizar plano', variant: "destructive" }),
  });

  // Mutation para deletar plano
  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: "Sucesso!", description: "Plano deletado com sucesso." });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message || 'Falha ao deletar plano', variant: "destructive" }),
  });

  // Filtros
  const filteredPlans = plans.filter(plan => 
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || plan.status === statusFilter)
  );

  // Métricas
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.status === 'active').length;
  const totalRevenue = plans.reduce((sum, p) => sum + (p.price * 12), 0); // Estimativa anual

  const handleAddPlan = () => {
    setEditingPlan(null);
    setFormData({ name: '', features: '', price: 0, validityMonths: 1, status: 'active' });
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      features: plan.features,
      price: plan.price,
      validityMonths: plan.validityMonths,
      status: plan.status,
    });
    setIsModalOpen(true);
  };

  const handleDeletePlan = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, updates: formData });
    } else {
      createMutation.mutate(formData as any);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'validityMonths' ? parseFloat(value) || 0 : value }));
  };

  if (isError) {
    return <div className="p-8 text-red-600">Erro ao carregar planos: {error.message}</div>;
  }

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Gerenciamento de Assinaturas"
          subtitle="Gerencie planos de assinatura, features e preços."
        />
        <main className="flex-1 overflow-y-auto p-8">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Planos</p>
                      <p className="text-2xl font-bold text-gray-900">{totalPlans}</p>
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
                      <p className="text-sm font-medium text-gray-600">Planos Ativos</p>
                      <p className="text-2xl font-bold text-gray-900">{activePlans}</p>
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
                      <p className="text-sm font-medium text-gray-600">Receita Estimada (Anual)</p>
                      <p className="text-2xl font-bold text-gray-900">R$ {totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="text-purple-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filtros e Botão Adicionar */}
          <Card className="mb-6 shadow-floating border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Input
                      type="text"
                      placeholder="Buscar planos por nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddPlan} className="bg-medium-blue hover:bg-blue-700 text-white">
                  <Plus className="mr-2" size={16} /> Adicionar Plano
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Planos */}
          <Card className="shadow-floating border-0">
            <CardHeader>
              <CardTitle>Lista de Planos de Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum plano encontrado</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `Nenhum plano corresponde a "${searchTerm}"` : "Nenhum plano de assinatura disponível."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                            <Badge className={getStatusBadge(plan.status)}>{plan.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Features: {plan.features}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Preço: R$ {plan.price.toFixed(2)}</span>
                            <span>Validade: {plan.validityMonths} meses</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>
                            <Edit size={14} className="mr-1" /> Editar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeletePlan(plan.id)} className="text-red-600 border-red-600">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal para Adicionar/Editar Plano */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPlan ? "Editar Plano" : "Adicionar Novo Plano"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Features (separadas por vírgula)</Label>
                  <Textarea id="features" name="features" value={formData.features} onChange={handleChange} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validityMonths">Validade (meses)</Label>
                  <Input id="validityMonths" name="validityMonths" type="number" value={formData.validityMonths} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
