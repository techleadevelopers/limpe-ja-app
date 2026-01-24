import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Calendar, CheckCircle, XCircle, Clock, DollarSign, MoreHorizontal, MessageSquare, LifeBuoy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  fetchBookingDetails,
  fetchBookingsPage,
  updateBookingStatus,
  cancelBookingWithRefund,
  forceConfirmPixPayment,
} from "@/lib/api";
import { Booking, BookingPage, BookingStatus } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";

// Helper function for status badge styling
const getStatusBadgeClass = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.PENDING: return "bg-yellow-100 text-yellow-700";
    case BookingStatus.CONFIRMED: return "bg-blue-100 text-blue-700";
    case BookingStatus.FINISHED: return "bg-green-100 text-green-700";
    case BookingStatus.CANCELED: return "bg-red-100 text-red-700";
    case BookingStatus.PENDING_DISPUTE: return "bg-orange-100 text-orange-700";
    case BookingStatus.RESCHEDULED: return "bg-purple-100 text-purple-700";
    case BookingStatus.STARTED: return "bg-indigo-100 text-indigo-700";
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
  const [adminNotes, setAdminNotes] = useState("");

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

  const forceRefundMutation = useMutation({
    mutationFn: (data: { id: string; reason?: string }) => cancelBookingWithRefund(data.id, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/bookings', bookingId] });
      toast({ title: "Ação executada", description: "Estorno forçado concluído com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Não foi possível forçar o cancelamento: ${error.message}`, variant: "destructive" });
    },
  });

  const handleForceRefund = () => {
    if (!bookingId) return;
    if (!window.confirm("Tem certeza que deseja forçar o cancelamento e estorno deste agendamento? Esta ação notificará o backend imediatamente.")) {
      return;
    }
    forceRefundMutation.mutate({ id: bookingId, reason: adminNotes || undefined });
  };

  const forceConfirmMutation = useMutation({
    mutationFn: (referenceId: string) => forceConfirmPixPayment(referenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/bookings', bookingId] });
      toast({ title: "Pagamento confirmado", description: "Confirmação manual do PIX concluída." });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Não foi possível confirmar o PIX manualmente: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleForceConfirmPayment = () => {
    if (!booking?.id) return;
    if (!window.confirm("Confirma manualmente o pagamento PIX para este agendamento?")) {
      return;
    }
    const referenceId = `booking_${booking.id}`;
    forceConfirmMutation.mutate(referenceId);
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
                <p className="font-medium">{booking.client?.fullName || booking.client?.name || 'N/A'} (ID: {booking.clientId.substring(0, 8)}...)</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Provedor</p>
                <p className="font-medium">{booking.provider?.fullName || booking.provider?.name || 'N/A'} (ID: {booking.providerId.substring(0, 8)}...)</p>
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

            {/* Ação de Suporte */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LifeBuoy size={20} />
                  Ação de Suporte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="adminNotes">Notas Internas do Admin</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Registre observações, incidentes ou instruções que só o time administrativo verá."
                    className="min-h-[120px]"
                  />
                </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      className="border-medium-blue text-medium-blue hover:bg-medium-blue/10"
                      onClick={() => {
                      const rawNumber = (booking?.provider?.phone || booking?.client?.phone || "+5519993223932").replace(/\D/g, "");
                      const message = encodeURIComponent(`LimpeJá Admin Chat — agendamento ${booking?.id}`);
                      window.open(`https://wa.me/${rawNumber}?text=${message}`, "_blank");
                    }}
                  >
                    <MessageSquare size={16} className="mr-2" />
                    Chat de Emergência
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 md:flex-auto border-medium-blue text-medium-blue hover:bg-medium-blue/10"
                      onClick={handleForceConfirmPayment}
                      disabled={forceConfirmMutation.isPending}
                    >
                      Confirmar Manualmente
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 md:flex-auto"
                      onClick={handleForceRefund}
                      disabled={forceRefundMutation.isPending}
                    >
                    Forçar Estorno/Cancelamento
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

export default function BookingManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const {
    data,
    isInitialLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery<BookingPage, Error>({
    queryKey: ['admin-bookings', statusFilter, debouncedSearchTerm],
    queryFn: ({ pageParam }) =>
      fetchBookingsPage({
        cursor: pageParam ?? undefined,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearchTerm || undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    keepPreviousData: false,
  });

  const bookings = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const totalCount = data?.pages[0]?.totalCount ?? 0;
  const statusCounts = data?.pages[0]?.statusCounts;
  const resolvedStatusCounts = {
    pending: statusCounts?.pending ?? 0,
    confirmed: statusCounts?.confirmed ?? 0,
    completed: statusCounts?.completed ?? 0,
    canceled: statusCounts?.canceled ?? 0,
  };

  const handleViewDetails = useCallback((bookingId: string) => {
    setSelectedBookingId(bookingId);
    setIsDetailsModalOpen(true);
  }, []);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: bookings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 4,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [bookings.length, rowVirtualizer]);

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();


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
            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Agendamentos</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="text-blue-600" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-gray-900">{resolvedStatusCounts.pending}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Clock className="text-yellow-600" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Confirmados</p>
                    <p className="text-2xl font-bold text-gray-900">{resolvedStatusCounts.confirmed}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="text-indigo-600" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Concluídos</p>
                    <p className="text-2xl font-bold text-gray-900">{resolvedStatusCounts.completed}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="text-green-600" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cancelados/Rejeitados</p>
                    <p className="text-2xl font-bold text-gray-900">{resolvedStatusCounts.canceled}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <XCircle className="text-red-600" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
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
              {isInitialLoading ? (
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
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento encontrado</h3>
                  <p className="text-gray-500">
                    {debouncedSearchTerm
                      ? `Nenhum agendamento corresponde a "${debouncedSearchTerm}"`
                      : "Nenhum agendamento registrado ainda."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative max-h-[70vh] overflow-y-auto" ref={parentRef}>
                    <div
                      style={{
                        height: `${totalHeight}px`,
                        position: "relative",
                      }}
                    >
                      {virtualItems.map((virtualRow) => {
                        const booking = bookings[virtualRow.index];
                        if (!booking) {
                          return null;
                        }
                        const statusClass = getStatusBadgeClass(booking.status);
                        return (
                          <div
                            key={booking.id}
                            className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusClass}`}>
                                  <Calendar size={20} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-semibold text-gray-900">Agendamento #{booking.id.substring(0, 8)}</h3>
                                    <Badge className={`text-xs px-2 py-1 border-0 ${statusClass}`}>
                                      {booking.status.replace(/_/g, " ")}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>
                                      Cliente: {booking.client?.fullName || `ID: ${booking.clientId.substring(0, 8)}...`}
                                    </span>
                                    <span>
                                      Provedor: {booking.provider?.fullName || `ID: ${booking.providerId.substring(0, 8)}...`}
                                    </span>
                                    <span>
                                      Serviço: {booking.service?.name || `ID: ${booking.providerServiceId.substring(0, 8)}...`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span>
                                      Data: {new Date(booking.scheduledDate).toLocaleDateString()} às {booking.scheduledTime ?? "—"}
                                    </span>
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {hasNextPage && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        disabled={!hasNextPage || isFetchingNextPage}
                      >
                        {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          {isFetching && !isInitialLoading && (
            <div className="mt-4 text-xs text-gray-500">Atualizando dados...</div>
          )}
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
