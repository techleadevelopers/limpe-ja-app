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
import { Search, Users, CheckCircle, XCircle, Star, CalendarDays, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClients, fetchClientById, updateClientProfile } from "@/lib/api";
import { Client } from "@/lib/types"; // Removido ClientDashboardDto

// Helper function for status badge styling
const getStatusBadgeClass = (status: Client['status']) => {
  switch (status) {
    case 'active': return "bg-green-100 text-green-700";
    case 'inactive': return "bg-gray-100 text-gray-700";
    case 'blocked': return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

// Componente de Modal para Detalhes e Edição do Cliente
interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
}

const ClientDetailsModal = ({ isOpen, onClose, clientId }: ClientDetailsModalProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: client, isLoading, isError, error } = useQuery<Client, Error>({
    queryKey: ['/clients', clientId],
    queryFn: () => fetchClientById(clientId!),
    enabled: !!clientId && isOpen,
  });

  // For editing client profile
  const [formData, setFormData] = useState<Partial<Client>>({});

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name, // Alterado de 'fullName' para 'name'
        phone: client.phone || '',
        email: client.email,
        cpf: client.cpf || '',
        address: client.address || undefined,
        status: client.status,
        loyaltyTier: client.loyaltyTier,
      });
    }
  }, [client]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    // Aqui, o 'id' deve corresponder às chaves de 'Partial<Client>'
    // Se o input for para 'name', o id deve ser 'name'
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Client, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const updateClientMutation = useMutation({
    mutationFn: (data: { id: string, clientData: Partial<Client> }) => updateClientProfile(data.id, data.clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/clients', clientId] });
      toast({ title: "Sucesso!", description: "Perfil do cliente atualizado com sucesso." });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao atualizar perfil: ${error.message}`, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (clientId) {
      updateClientMutation.mutate({ id: clientId, clientData: formData });
    }
  };

  if (!clientId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Cliente: {client?.fullName || client?.name}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-center py-8">Carregando detalhes do cliente...</div>
        ) : isError ? (
          <div className="text-center py-8 text-red-600">Erro ao carregar cliente: {error?.message}</div>
        ) : client ? (
          <div className="space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Detalhes do Perfil</TabsTrigger>
                <TabsTrigger value="dashboard">Dashboard do Cliente</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label> {/* Alterado de 'fullName' para 'name' */}
                    <Input id="name" value={formData.name || ''} onChange={handleInputChange} /> {/* Alterado de 'fullName' para 'name' */}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={formData.email || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={formData.phone || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" value={formData.cpf || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: Client['status']) => handleSelectChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="blocked">Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loyaltyTier">Nível de Fidelidade</Label>
                    <Input id="loyaltyTier" value={formData.loyaltyTier || ''} disabled />
                  </div>
                  {client.address && (
                    <div className="col-span-2 space-y-2">
                      <Label>Endereço</Label>
                      <p className="text-sm text-gray-700">
                        {client.address.street}, {client.address.number} {client.address.complement && `- ${client.address.complement}`}<br/>
                        {client.address.neighborhood}, {client.address.city} - {client.address.state}, {client.address.cep}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={handleSubmit} disabled={updateClientMutation.isPending} className="bg-medium-blue hover:bg-blue-700 text-white">
                    Salvar Alterações
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="dashboard" className="pt-4">
                {/* Placeholder for Client Dashboard Data */}
                <p className="text-gray-500">Dados do dashboard do cliente (KPIs, agendamentos recentes, cupons, missões) seriam carregados aqui.</p>
                {/* You would fetch ClientDashboardDto here and display its contents */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Total de Agendamentos</p>
                    <p className="font-medium">{client.completedBookingsCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Agendamentos Cancelados</p>
                    <p className="font-medium">{client.cancellationCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">No-Shows</p>
                    <p className="font-medium">{client.noShowCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Membro Desde</p>
                    <p className="font-medium">{new Date(client.memberSince).toLocaleDateString()}</p>
                  </div>
                  {/* Additional dashboard KPIs from ClientDashboardDto would go here */}
                  {/* Example:
                  <div>
                    <p className="text-sm text-gray-500">Cupons Ativos</p>
                    <p className="font-medium">{clientDashboard?.kpis.activeCoupons || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pontos de Fidelidade</p>
                    <p className="font-medium">{clientDashboard?.kpis.loyaltyPoints || 0}</p>
                  </div>
                  */}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default function ClientManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Client['status'] | "all">("all");
  const [loyaltyFilter, setLoyaltyFilter] = useState<Client['loyaltyTier'] | "all">("all");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: clients, isLoading, isError, error } = useQuery<Client[], Error>({
    queryKey: ['/clients'],
    queryFn: () => fetchClients(),
  });

  const handleViewDetails = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsDetailsModalOpen(true);
  };

  const filteredClients = clients?.filter(client => {
    // Alterado de client.fullName para client.name
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (client.cpf?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesLoyalty = loyaltyFilter === "all" || client.loyaltyTier === loyaltyFilter;
    return matchesSearch && matchesStatus && matchesLoyalty;
  }) || [];

  // Calculate key metrics
  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter(c => c.status === 'active').length || 0;
  const clientsWithBookings = clients?.filter(c => c.completedBookingsCount > 0).length || 0;
  const goldClients = clients?.filter(c => c.loyaltyTier === 'gold').length || 0;


  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Gerenciamento de Clientes"
          subtitle="Visualize e gerencie os usuários clientes da plataforma LimpeJá."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                      <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
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
                      <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                      <p className="text-2xl font-bold text-gray-900">{activeClients}</p>
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
                      <p className="text-sm font-medium text-gray-600">Com Agendamentos</p>
                      <p className="text-2xl font-bold text-gray-900">{clientsWithBookings}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <CalendarDays className="text-purple-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Clientes Gold</p>
                      <p className="text-2xl font-bold text-gray-900">{goldClients}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Star className="text-yellow-600" size={20} />
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
                      placeholder="Buscar clientes por nome, e-mail ou CPF..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={(value: Client['status'] | "all") => setStatusFilter(value)}>
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

                  <Select value={loyaltyFilter} onValueChange={(value: Client['loyaltyTier'] | "all") => setLoyaltyFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por fidelidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Níveis</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Prata</SelectItem>
                      <SelectItem value="gold">Ouro</SelectItem>
                      <SelectItem value="platinum">Platina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client List */}
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
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `Nenhum cliente corresponde a "${searchTerm}"` : "Nenhum cliente registrado ainda."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClients.map((client, index) => {
                    const statusClass = getStatusBadgeClass(client.status);
                    
                    return (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusClass}`}>
                                <Users size={20} />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-gray-900">{client.name}</h3> {/* Alterado de client.fullName para client.name */}
                                <Badge className={`text-xs px-2 py-1 border-0 ${statusClass}`}>
                                  {client.status.replace(/_/g, ' ')}
                                </Badge>
                                {client.loyaltyTier && (
                                  <Badge variant="outline" className="text-xs px-2 py-1 border-gray-300 text-gray-600">
                                    {client.loyaltyTier.charAt(0).toUpperCase() + client.loyaltyTier.slice(1)}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Email: {client.email}</span>
                                <span>Telefone: {client.phone || 'N/A'}</span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span>Membro desde: {new Date(client.memberSince).toLocaleDateString()}</span>
                                <span>Agendamentos Concluídos: {client.completedBookingsCount}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
                              onClick={() => handleViewDetails(client.id)}
                            >
                              <Edit size={14} className="mr-1" />
                              Ver/Editar
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

      <ClientDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedClientId(null);
        }}
        clientId={selectedClientId}
      />
    </div>
  );
}
