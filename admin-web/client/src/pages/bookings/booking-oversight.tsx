import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarClock, Clock, FileText, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fetchAllBookings } from "@/lib/api";
import { Booking, BookingStatus } from "@/lib/types";

const DATE_FILTERS = [
  { id: "today", label: "Hoje" },
  { id: "tomorrow", label: "Amanhã" },
  { id: "week", label: "Esta Semana" },
];

const STATUS_TRACKED: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.STARTED,
  BookingStatus.RESCHEDULED,
];

const toDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const startOfDayLocal = (value: Date) => {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const formatDateTime = (value?: string | null) => {
  const date = toDate(value);
  if (!date) return "—";
  return format(date, "dd/MM/yyyy 'às' HH:mm");
};

const isTomorrowAtNine = (value: Date, reference: Date) => {
  const tomorrow = startOfDayLocal(reference);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  return (
    value >= tomorrow &&
    value < dayAfter &&
    value.getHours() === 9 &&
    value.getMinutes() === 0
  );
};

const getDateRange = (filter: string) => {
  const now = new Date();
  const midnight = (date: Date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  switch (filter) {
    case "today": {
      const start = midnight(now);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    case "tomorrow": {
      const start = midnight(now);
      start.setDate(start.getDate() + 1);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    case "week": {
      const start = midnight(now);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    default:
      return undefined;
  }
};

const BookingLogDialog = ({
  booking,
  open,
  onOpenChange,
}: {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!booking) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log de tempo · {booking.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Criado em</span>
            <span>{formatDateTime(booking.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Aceito em</span>
            <span>{formatDateTime(booking.acceptedAt)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Iniciado em</span>
            <span>{formatDateTime(booking.startedAt)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Status</span>
            <Badge className="uppercase text-[10px] tracking-wide">
              {booking.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const formatStatusBadge = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return "bg-indigo-50 text-indigo-700";
    case BookingStatus.STARTED:
      return "bg-emerald-50 text-emerald-700";
    case BookingStatus.ARRIVED:
    case BookingStatus.ON_THE_WAY:
      return "bg-sky-50 text-sky-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function BookingOversight() {
  const [dateFilter, setDateFilter] = useState("tomorrow");
  const [selectedStatuses, setSelectedStatuses] = useState<BookingStatus[]>([
    BookingStatus.CONFIRMED,
    BookingStatus.STARTED,
  ]);
  const [now, setNow] = useState(new Date());
  const [logBookingId, setLogBookingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["bookings", "oversight"],
    queryFn: () => fetchAllBookings(),
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 45 * 1000);
    return () => clearInterval(interval);
  }, []);

  const range = useMemo(() => getDateRange(dateFilter), [dateFilter]);

  const selectedBooking = data?.find((booking) => booking.id === logBookingId) ?? null;

  const filteredBookings = useMemo(() => {
    if (!data) return [];
    return data.filter((booking) => {
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(booking.status)) {
        return false;
      }
      if (!range) return true;
      const scheduled = toDate(booking.scheduledStart ?? booking.scheduledTime ?? `${booking.scheduledDate}T00:00:00Z`);
      if (!scheduled) return false;
      return scheduled >= range.start && scheduled < range.end;
    });
  }, [data, range, selectedStatuses]);

  const highlightBooking = filteredBookings.find((booking) => {
    const scheduled = toDate(booking.scheduledStart ?? booking.scheduledTime);
    if (!scheduled) return false;
    if (!isTomorrowAtNine(scheduled, now)) return false;
    const clientName = (booking.clientFullName ?? booking.client?.fullName ?? booking.client?.name ?? "").toLowerCase();
    return clientName.includes("joaquim");
  });

  const isDelayed = (booking: Booking) => {
    if (booking.status !== BookingStatus.CONFIRMED) return false;
    const scheduled = toDate(booking.scheduledStart ?? booking.scheduledTime);
    if (!scheduled) return false;
    return now.getTime() > scheduled.getTime() + 10 * 60 * 1000;
  };

  const handleOpenLog = (bookingId: string) => {
    setLogBookingId(bookingId);
    setDialogOpen(true);
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      <div className="flex-1 ml-72 overflow-hidden">
        <Header
          title="Gestão de Agendamentos"
          subtitle="Monitoramento em tempo real dos agendamentos confirmados e em andamento."
        />
        <main className="p-8 overflow-y-auto space-y-6">
          <Card className="border-0 shadow-floating">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock size={18} />
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase text-gray-500">Agendamentos monitorados</p>
                  <p className="text-2xl font-semibold text-gray-900">{filteredBookings.length}</p>
                    <p className="text-xs text-gray-400">Somente CONFIRMED + STARTED por padrão</p>
                </div>
                <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase text-gray-500">Destaque do Joaquim</p>
                    <Badge className="bg-amber-100 text-amber-700">Monitorado</Badge>
                  </div>
                  <p className="text-sm text-gray-800">
                    {highlightBooking
                      ? `Amanhã às 09:00 — ${highlightBooking.clientFullName ?? "Joaquim"}`
                      : "Atenção: nenhum destaque ativo"}
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase text-gray-500">Status de atraso</p>
                  <p className="text-base text-gray-800">
                    {filteredBookings.filter(isDelayed).length} serviços com +10min de atraso
                  </p>
                  <p className="text-xs text-gray-400">Baseado nos horários de início registrados.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-floating">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <Clock size={16} />
                  Filtrar por data:
                </div>
                <Tabs value={dateFilter} onValueChange={setDateFilter} className="flex-1 md:flex-none">
                  <TabsList className="bg-white p-1 rounded-2xl shadow-sm flex gap-1">
                    {DATE_FILTERS.map((filter) => (
                      <TabsTrigger
                        key={filter.id}
                        value={filter.id}
                        className="px-4 py-1 rounded-xl text-xs font-semibold"
                      >
                        {filter.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex items-center gap-2">
                <Target size={16} />
                <span className="text-sm font-semibold text-gray-600">Status</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {STATUS_TRACKED.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedStatuses.includes(status) ? "default" : "outline"}
                      onClick={() => {
                        if (selectedStatuses.includes(status)) {
                          if (selectedStatuses.length === 1) return;
                          setSelectedStatuses((prev) => prev.filter((item) => item !== status));
                        } else {
                          setSelectedStatuses((prev) => [...prev, status]);
                        }
                      }}
                    >
                      {status.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {isLoading ? (
                <div className="py-16 text-center text-sm text-gray-400">Carregando agendamentos...</div>
              ) : isError ? (
                <div className="py-16 text-center text-sm text-red-500">
                  Falha ao carregar: {(error as Error)?.message ?? "Erro desconhecido"}
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Agendamento</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Prestador</TableCell>
                      <TableCell>Data & horário</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell className="text-right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBookings.map((booking) => {
                      const late = isDelayed(booking);
                      const scheduled = toDate(booking.scheduledStart ?? booking.scheduledTime);
                      const clientLookup = booking.client?.fullName ?? booking.client?.name ?? "";
                      const isJoaquim =
                        booking.clientFullName?.toLowerCase().includes("joaquim") ||
                        clientLookup.toLowerCase().includes("joaquim");
                      const rowClass = cn(
                        "transition-shadow duration-150",
                        late && "bg-red-50 shadow-none",
                        isJoaquim && "bg-amber-50 border border-amber-200 shadow-md",
                      );

                      return (
                        <TableRow key={booking.id} className={rowClass}>
                          <TableCell>
                            <div className="text-sm font-semibold text-gray-900">{booking.id.slice(0, 8)}</div>
                            <div className="text-xs text-gray-500">{formatDateTime(booking.createdAt)}</div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-800">
                            {booking.clientFullName ?? booking.client?.fullName ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-800">
                            {booking.providerFullName ?? booking.provider?.fullName ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-800">
                            {scheduled
                              ? format(scheduled, "dd/MM/yyyy 'às' HH:mm")
                              : "—"}{" "}
                            <span className="text-xs text-gray-500 block">
                              {booking.scheduledDate} · {booking.scheduledTime}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("px-2 py-1 text-[10px] uppercase", formatStatusBadge(booking.status))}>
                              {booking.status.replace(/_/g, " ")}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              Aceito: {formatDateTime(booking.acceptedAt)}
                            </div>
                          </TableCell>
                          <TableCell className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenLog(booking.id)}
                            >
                              <FileText className="mr-2" size={14} />
                              Ver Detalhes
                            </Button>
                            {late && (
                              <Badge className="bg-red-100 text-red-700">Atrasado</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      <BookingLogDialog
        booking={selectedBooking}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
