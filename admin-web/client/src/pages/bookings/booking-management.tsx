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
import { Search, Calendar, CheckCircle, XCircle, Clock, DollarSign, MoreHorizontal, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllBookings, fetchBookingDetails, updateBookingStatus } from "@/lib/api";
import { Booking, BookingStatus } from "@/lib/types";

// Helper function for status badge styling
const getStatusBadgeClass = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.PENDING: return "bg-yellow-100 text-yellow-700";
    case BookingStatus.CONFIRMED: return "bg-blue-100 text-blue-700";
    case BookingStatus.COMPLETED: return "bg-green-100 text-green-700";
    case BookingStatus.CANCELED: return "bg-red-100 text-red-700";
    case BookingStatus.PENDING_DISPUTE: return "bg-orange-100 text-orange-700";
    case BookingStatus.RESCHEDULED: return "bg-purple-100 text-purple-700";
    case BookingStatus.IN_PROGRESS: return "bg-indigo-100 text-indigo-700";
    case BookingStatus.PENDING_PROVIDER_CONFIRMATION: return "bg-gray-100 text-gray-700";
    case BookingStatus.REJECTED: return "bg-red-200 text-red-800";
    case BookingStatus.NO_SHOW: return "bg-red-300 text-red-900";
    default: return "bg-gray-100 text-gray-700";
  }
};

// Componente de Modal para Detalhes e Ações do Agendamento
interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
}

const BookingDetailsModal = ({ isOpen, onClose, bookingId }: BookingDetailsModalProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "">("");
  const [notes, setNotes] = useState("");

  const { data: booking, isLoading, isError, error } = useQuery<Booking, Error>({
    queryKey: ['/bookings', bookingId],
    queryFn: () => fetchBookingDetails(bookingId!),
    enabled: !!bookingId && isOpen,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string, status: BookingStatus, notes?: string }) =>
      updateBookingStatus(data.id, data.status, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/bookings', bookingId] });
      toast({ title: "Sucesso!", description: "Status do agendamento atualizado." });
      setSelectedStatus("");
      setNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao atualizar status: ${error.message}`, variant: "destructive" });
    },
  });

  const handleUpdateStatus = () => {
    if (bookingId && selectedStatus) {
      updateStatusMutation.mutate({ id: bookingId, status: selectedStatus, notes });
    }
  };

  if (!bookingId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento: {booking?.id.substring(0, 8)}...</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-center py-8">Carregando detalhes do agendamento...</div>
        ) : isError ? (
          <div className="text-center py-8 text-red-600">Erro ao carregar agendamento: {error?.message}</div>
        ) : booking ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID do Agendamento</p>
                <p className="font-medium">{booking.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={getStatusBadgeClass(booking.status)}>
                  {booking.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium">{booking.client?.name || 'N/A'} (ID: {booking.clientId.substring(0, 8)}...)</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Provedor</p>
                <p className="font-medium">{booking.provider?.name || 'N/A'} (ID: {booking.providerId.substring(0, 8)}...)</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Serviço</p>
                <p className="font-medium">{booking.service?.name || 'N/A'} (ID: {booking.providerServiceId.substring(0, 8)}...)</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data Agendada</p>
                <p className="font-medium">{new Date(booking.scheduledDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hora Agendada</p>
                <p className="font-medium">{booking.scheduledTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Preço Total</p>
                <p className="font-medium">R$ {booking.totalPrice.toFixed(2)}</p>
              </div>
              {booking.address && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Endereço</p>
                  <p className="font-medium">
                    {booking.address.street}, {booking.address.number} - {booking.address.neighborhood}, {booking.address.city} - {booking.address.state}
                  </p>
                </div>
              )}
              {booking.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Notas do Cliente</p>
                  <p className="font-medium">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Seção de Atualização de Status */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Atualizar Status do Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Novo Status</Label>
                    <Select value={selectedStatus} onValueChange={(value: BookingStatus) => setSelectedStatus(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o novo status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BookingStatus).map(status => (
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

            {/* Placeholder para outras ações */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Outras Ações</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100" disabled>
                  Reembolsar (Em Breve)
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100" disabled>
                  Reagendar (Em Breve)
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100" disabled>
                  Abrir Disputa (Em Breve)
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default function BookingManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: bookings, isLoading, isError, error } = useQuery<Booking[], Error>({
    queryKey: ['/bookings', statusFilter],
    queryFn: () => fetchAllBookings(statusFilter !== 'all' ? statusFilter : undefined),
  });

  const handleViewDetails = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setIsDetailsModalOpen(true);
  };

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.provider?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.service?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate key metrics
  const totalBookings = bookings?.length || 0;
  const pendingBookings = bookings?.filter(b => b.status === BookingStatus.PENDING || b.status === BookingStatus.PENDING_PROVIDER_CONFIRMATION).length || 0;
  const confirmedBookings = bookings?.filter(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.IN_PROGRESS).length || 0;
  const completedBookings = bookings?.filter(b => b.status === BookingStatus.COMPLETED).length || 0;
  const canceledBookings = bookings?.filter(b => b.status === BookingStatus.CANCELED || b.status === BookingStatus.REJECTED || b.status === BookingStatus.NO_SHOW).length || 0;


  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Gerenciamento de Agendamentos"
          subtitle="Monitore e gerencie todos os agendamentos de serviços na plataforma LimpeJá."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Agendamentos</p>
                      <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Calendar className="text-blue-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Pendentes</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingBookings}</p>
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
                      <p className="text-sm font-medium text-gray-600">Confirmados</p>
                      <p className="text-2xl font-bold text-gray-900">{confirmedBookings}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="text-indigo-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Concluídos</p>
                      <p className="text-2xl font-bold text-gray-900">{completedBookings}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="text-green-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cancelados/Rejeitados</p>
                      <p className="text-2xl font-bold text-gray-900">{canceledBookings}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <XCircle className="text-red-600" size={20} />
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
                      placeholder="Buscar agendamentos por ID, cliente ou provedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={(value: BookingStatus | "all") => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      {Object.values(BookingStatus).map(status => (
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

          {/* Booking List */}
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
                  <p>Erro ao carregar agendamentos: {error?.message}</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento encontrado</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `Nenhum agendamento corresponde a "${searchTerm}"` : "Nenhum agendamento registrado ainda."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking, index) => {
                    const statusClass = getStatusBadgeClass(booking.status);
                    
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusClass}`}>
                                <Calendar size={20} />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-gray-900">Agendamento #{booking.id.substring(0, 8)}</h3>
                                <Badge className={`text-xs px-2 py-1 border-0 ${statusClass}`}>
                                  {booking.status.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Cliente: {booking.client?.name || `ID: ${booking.clientId.substring(0, 8)}...`}</span>
                                <span>Provedor: {booking.provider?.name || `ID: ${booking.providerId.substring(0, 8)}...`}</span>
                                <span>Serviço: {booking.service?.name || `ID: ${booking.providerServiceId.substring(0, 8)}...`}</span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span>Data: {new Date(booking.scheduledDate).toLocaleDateString()} às {booking.scheduledTime}</span>
                                <span>Total: R$ {booking.totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
                              onClick={() => handleViewDetails(booking.id)}
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

      <BookingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedBookingId(null);
        }}
        bookingId={selectedBookingId}
      />
    </div>
  );
}