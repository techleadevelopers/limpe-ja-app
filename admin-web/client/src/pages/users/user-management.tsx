import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Search, Filter, MoreHorizontal, Calendar, Mail, Phone, MapPin, Shield, Ban, UserPlus, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { fetchClients, updateClientProfile, fetchClientById } from "@/lib/api"; // Importar novas funções
import { Client, Address } from "@/lib/types"; // Importar o tipo Client e Address

// Componente para o modal de edição de cliente
interface ClientEditModalProps {
  clientId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ClientEditModal = ({ clientId, isOpen, onClose }: ClientEditModalProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: client, isLoading, isError, error } = useQuery<Client, Error>({
    queryKey: ['/clients', clientId],
    queryFn: () => fetchClientById(clientId!),
    enabled: !!clientId && isOpen, // Apenas busca se o modal estiver aberto e houver um ID
  });

  const updateClientMutation = useMutation({
    mutationFn: (data: Partial<Client>) => updateClientProfile(clientId!, data),
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/clients', updatedClient.id] });
      toast({
        title: "Perfil do Cliente Atualizado",
        description: `O perfil de ${updatedClient.name} foi atualizado com sucesso.`,
      });
      onClose();
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao Atualizar Perfil",
        description: err.message || "Ocorreu um erro ao atualizar o perfil do cliente.",
        variant: "destructive",
      });
    },
  });

  const [formData, setFormData] = useState<Partial<Client>>({});
  const [addressData, setAddressData] = useState<Partial<Address>>({});

  // Atualiza o formulário quando os dados do cliente são carregados
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        cpf: client.cpf,
        dateOfBirth: client.dateOfBirth,
        // Outros campos que você queira editar
      });
      if (client.address) {
        setAddressData(client.address);
      } else {
        setAddressData({});
      }
    }
  }, [client]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setAddressData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    const dataToUpdate = { ...formData, address: addressData }; // Inclui dados do endereço
    updateClientMutation.mutate(dataToUpdate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Perfil do Cliente</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-center py-8">Carregando dados do cliente...</div>
        ) : isError ? (
          <div className="text-center text-red-600 py-8">Erro: {error?.message}</div>
        ) : client ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" value={formData.name || ''} onChange={handleFormChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email || ''} onChange={handleFormChange} disabled /> {/* Email geralmente não é editável */}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone || ''} onChange={handleFormChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" value={formData.cpf || ''} onChange={handleFormChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
              <Input id="dateOfBirth" type="date" value={formData.dateOfBirth || ''} onChange={handleFormChange} />
            </div>

            <h4 className="text-md font-semibold text-gray-900 mt-6">Endereço</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" value={addressData.cep || ''} onChange={handleAddressChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input id="street" value={addressData.street || ''} onChange={handleAddressChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input id="number" value={addressData.number || ''} onChange={handleAddressChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" value={addressData.complement || ''} onChange={handleAddressChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" value={addressData.neighborhood || ''} onChange={handleAddressChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" value={addressData.city || ''} onChange={handleAddressChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input id="state" value={addressData.state || ''} onChange={handleAddressChange} />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={updateClientMutation.isPending}>
                {updateClientMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};


function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Agora mesmo";
  if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} horas atrás`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} dias atrás`;
}

function getLoyaltyBadge(tier: string) {
  switch (tier) {
    case "platinum":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "gold":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "silver":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-orange-100 text-orange-700 border-orange-200";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "inactive":
      return "bg-yellow-100 text-yellow-700";
    case "blocked":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use a API real para buscar clientes
  const { data: clients, isLoading, isError, error } = useQuery<Client[], Error>({
    queryKey: ['/clients'],
    queryFn: () => fetchClients(),
  });

  const filteredClients = clients?.filter(client => {
    const matchesSearch = (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = {
    total: clients?.length || 0,
    active: clients?.filter(c => c.status === "active").length || 0,
    inactive: clients?.filter(c => c.status === "inactive").length || 0,
    blocked: clients?.filter(c => c.status === "blocked").length || 0,
  };

  const handleOpenEditModal = (clientId: string) => {
    setSelectedClientForEdit(clientId);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedClientForEdit(null);
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Gestão de Usuários"
          subtitle="Gerencie contas de clientes, perfis e programas de fidelidade."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Shield className="text-green-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ativos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Calendar className="text-yellow-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Inativos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Ban className="text-red-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Bloqueados</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.blocked}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6 shadow-floating border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Input
                      type="text"
                      placeholder="Buscar clientes..."
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
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-medium-blue hover:bg-blue-700 text-white">
                      <UserPlus className="mr-2" size={16} />
                      Adicionar Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" placeholder="Digite o nome completo" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="Digite o endereço de email" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" placeholder="Digite o número de telefone" />
                      </div>
                      <Button className="w-full bg-medium-blue hover:bg-blue-700 text-white">
                        Criar Cliente
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
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
                  <p>Erro ao carregar clientes: {error?.message}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClients.map((client, index) => (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={`https://images.unsplash.com/photo-150720939${index % 10}?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=fit&w=100&h=100`}
                            alt={client.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900">{client.name}</h3>
                              <Badge className={`text-xs px-2 py-1 border-0 ${getStatusBadge(client.status)}`}>
                                {client.status}
                              </Badge>
                              <Badge className={`text-xs px-2 py-1 border ${getLoyaltyBadge(client.loyaltyTier)}`}>
                                {client.loyaltyTier}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Mail size={14} />
                                {client.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {client.completedBookingsCount} agendamentos
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span>Total Gasto: R$ {client.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <span>Última atividade: {formatRelativeTime(client.lastActivity)}</span>
                            </div>
                            {/* NOVAS MÉTRICAS DE COMPORTAMENTO */}
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="text-orange-600">No-Show: {client.noShowCount}</span>
                              <span className="text-red-600">Cancelamentos: {client.cancellationCount}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
                            onClick={() => handleOpenEditModal(client.id)}
                          >
                            <Edit size={14} className="mr-1" />
                            Editar Perfil
                          </Button>
                          
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal size={16} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {!isLoading && filteredClients.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `Nenhum cliente corresponde a "${searchTerm}"` : "Nenhum cliente registrado ainda."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <ClientEditModal
        clientId={selectedClientForEdit}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
      />
    </div>
  );
}
