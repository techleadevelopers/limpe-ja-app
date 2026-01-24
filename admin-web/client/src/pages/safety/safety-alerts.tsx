import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, AlertTriangle, ShieldAlert, Clock, MessageSquare, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchPanicAlerts,
    fetchIncidents,
    updatePanicAlertStatus,
    updateIncidentStatus,
} from "@/lib/api";
import { PanicAlert, Incident, IncidentStatus } from "@/lib/types";

// Definindo os status possíveis para PanicAlerts com base no README.md
// Embora o tipo em types.ts seja 'string', o README.md detalha os valores esperados.
type PanicAlertStatusType = 'RECEIVED' | 'ACKED' | 'DISPATCHED' | 'CLOSED';

// Componente de Modal para Atualizar Status de Alerta de Pânico
interface PanicAlertUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    panicAlert: PanicAlert;
}

const PanicAlertUpdateModal: React.FC<PanicAlertUpdateModalProps> = ({ isOpen, onClose, panicAlert }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [newStatus, setNewStatus] = useState<PanicAlertStatusType | string>(panicAlert.status);

    useEffect(() => {
        setNewStatus(panicAlert.status);
    }, [panicAlert.status]);

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; status: string }) =>
            updatePanicAlertStatus(data.id, data.status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['panicAlerts'] });
            toast({ title: "Sucesso!", description: "Status do alerta de pânico atualizado." });
            onClose();
        },
        onError: (error: any) => {
            toast({ title: "Erro", description: `Falha ao atualizar status: ${error.message}`, variant: "destructive" });
        },
    });

    const handleSubmit = () => {
        updateMutation.mutate({ id: panicAlert.id, status: newStatus });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Atualizar Status do Alerta de Pânico</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p>Alerta: <span className="font-semibold">{panicAlert.id}</span></p>
                    <p>Status Atual: <Badge className={getStatusBadgeClass(panicAlert.status)}>{panicAlert.status}</Badge></p>
                    <div className="space-y-2">
                        <Label htmlFor="newStatus">Novo Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger id="newStatus">
                                <SelectValue placeholder="Selecione o novo status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RECEIVED">Recebido</SelectItem>
                                <SelectItem value="ACKED">Reconhecido</SelectItem>
                                <SelectItem value="DISPATCHED">Despachado</SelectItem>
                                <SelectItem value="CLOSED">Fechado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
                            Salvar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Componente de Modal para Atualizar Status de Incidente
interface IncidentUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    incident: Incident;
}

const IncidentUpdateModal: React.FC<IncidentUpdateModalProps> = ({ isOpen, onClose, incident }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [newStatus, setNewStatus] = useState<IncidentStatus>(incident.status);
    const [resolutionNotes, setResolutionNotes] = useState<string>(incident.resolution || '');

    useEffect(() => {
        setNewStatus(incident.status);
        setResolutionNotes(incident.resolution || '');
    }, [incident.status, incident.resolution]);

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; status: IncidentStatus; resolution?: string }) =>
            updateIncidentStatus(data.id, data.status, data.resolution),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            toast({ title: "Sucesso!", description: "Status do incidente atualizado." });
            onClose();
        },
        onError: (error: any) => {
            toast({ title: "Erro", description: `Falha ao atualizar status: ${error.message}`, variant: "destructive" });
        },
    });

    const handleSubmit = () => {
        updateMutation.mutate({ id: incident.id, status: newStatus, resolution: resolutionNotes });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Atualizar Status do Incidente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p>Incidente: <span className="font-semibold">{incident.id}</span></p>
                    <p>Status Atual: <Badge className={getStatusBadgeClass(incident.status)}>{incident.status}</Badge></p>
                    <div className="space-y-2">
                        <Label htmlFor="newStatus">Novo Status</Label>
                        <Select value={newStatus} onValueChange={(value: IncidentStatus) => setNewStatus(value)}>
                            <SelectTrigger id="newStatus">
                                <SelectValue placeholder="Selecione o novo status" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(IncidentStatus).map((status) => (
                                    <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {(newStatus === IncidentStatus.RESOLVED || newStatus === IncidentStatus.REJECTED) && (
                        <div className="space-y-2">
                            <Label htmlFor="resolutionNotes">Notas de Resolução</Label>
                            <Input
                                id="resolutionNotes"
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                placeholder="Descreva a resolução ou motivo da rejeição"
                            />
                        </div>
                    )}
                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
                            Salvar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'RECEIVED':
        case 'PENDING_REVIEW':
            return "bg-yellow-100 text-yellow-700";
        case 'ACKED':
        case 'INVESTIGATING':
            return "bg-blue-100 text-blue-700";
        case 'DISPATCHED':
            return "bg-orange-100 text-orange-700";
        case 'CLOSED':
        case 'RESOLVED':
            return "bg-green-100 text-green-700";
        case 'REJECTED':
            return "bg-red-100 text-red-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
};

export default function SafetyAlertsPage() {
    const [activeTab, setActiveTab] = useState("panic-alerts");
    const [searchTerm, setSearchTerm] = useState("");
    const [panicStatusFilter, setPanicStatusFilter] = useState<PanicAlertStatusType | "all">("all");
    const [incidentStatusFilter, setIncidentStatusFilter] = useState<IncidentStatus | "all">("all");

    const [isPanicUpdateModalOpen, setIsPanicUpdateModalOpen] = useState(false);
    const [selectedPanicAlert, setSelectedPanicAlert] = useState<PanicAlert | null>(null);

    const [isIncidentUpdateModalOpen, setIsIncidentUpdateModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

    const { data: panicAlerts, isLoading: isLoadingPanic, isError: isErrorPanic, error: errorPanic } = useQuery<PanicAlert[], Error>({
        queryKey: ['panicAlerts', panicStatusFilter],
        queryFn: () => fetchPanicAlerts(panicStatusFilter === "all" ? undefined : panicStatusFilter),
    });

    const { data: incidents, isLoading: isLoadingIncidents, isError: isErrorIncidents, error: errorIncidents } = useQuery<Incident[], Error>({
        queryKey: ['incidents', incidentStatusFilter],
        queryFn: () => fetchIncidents(incidentStatusFilter === "all" ? undefined : incidentStatusFilter),
    });

    const filteredPanicAlerts = panicAlerts?.filter(alert => {
        const matchesSearch = searchTerm === "" ||
                              alert.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              alert.bookingId?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    }) || [];

    const filteredIncidents = incidents?.filter(incident => {
        const matchesSearch = searchTerm === "" ||
                              incident.reporterId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              incident.bookingId?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    }) || [];

    // Key Metrics calculation
    const totalPanicAlerts = panicAlerts?.length || 0;
    const pendingPanicAlerts = panicAlerts?.filter(alert => alert.status === 'RECEIVED' || alert.status === 'ACKED' || alert.status === 'DISPATCHED').length || 0;
    const totalIncidents = incidents?.length || 0;
    const pendingIncidents = incidents?.filter(incident => incident.status === IncidentStatus.PENDING_REVIEW || incident.status === IncidentStatus.INVESTIGATING).length || 0;

    const handleUpdatePanicClick = (alert: PanicAlert) => {
        setSelectedPanicAlert(alert);
        setIsPanicUpdateModalOpen(true);
    };

    const handleUpdateIncidentClick = (incident: Incident) => {
        setSelectedIncident(incident);
        setIsIncidentUpdateModalOpen(true);
    };

    return (
        <div className="flex h-screen bg-admin-bg">
            <Sidebar />

            <div className="flex-1 ml-72 overflow-hidden">
                <Header
                    title="Gestão de Segurança e Incidentes"
                    subtitle="Monitore e gerencie alertas de pânico e incidentes reportados."
                />

                <main className="flex-1 overflow-y-auto p-8">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <Card className="shadow-floating border-0">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total de Alertas de Pânico</p>
                                            <p className="text-2xl font-bold text-gray-900">{totalPanicAlerts}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                            <AlertTriangle className="text-red-600" size={20} />
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
                                            <p className="text-sm font-medium text-gray-600">Alertas de Pânico Pendentes</p>
                                            <p className="text-2xl font-bold text-gray-900">{pendingPanicAlerts}</p>
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
                                            <p className="text-sm font-medium text-gray-600">Total de Incidentes</p>
                                            <p className="text-2xl font-bold text-gray-900">{totalIncidents}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <ShieldAlert className="text-purple-600" size={20} />
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
                                            <p className="text-sm font-medium text-gray-600">Incidentes Pendentes</p>
                                            <p className="text-2xl font-bold text-gray-900">{pendingIncidents}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                            <MessageSquare className="text-orange-600" size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="panic-alerts">Alertas de Pânico</TabsTrigger>
                            <TabsTrigger value="incidents">Incidentes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="panic-alerts">
                            <Card className="shadow-floating border-0">
                                <CardHeader>
                                    <CardTitle>Lista de Alertas de Pânico</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between gap-4 mb-6">
                                        <div className="relative flex-1 max-w-md">
                                            <Input
                                                type="text"
                                                placeholder="Buscar por ID do usuário ou mensagem..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                                            />
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                        </div>
                                        <Select value={panicStatusFilter} onValueChange={(value: PanicAlertStatusType | "all") => setPanicStatusFilter(value)}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Filtrar por status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos os Status</SelectItem>
                                                <SelectItem value="RECEIVED">Recebido</SelectItem>
                                                <SelectItem value="ACKED">Reconhecido</SelectItem>
                                                <SelectItem value="DISPATCHED">Despachado</SelectItem>
                                                <SelectItem value="CLOSED">Fechado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {isLoadingPanic ? (
                                        <div className="space-y-4">
                                            {[...Array(3)].map((_, i) => (
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
                                    ) : isErrorPanic ? (
                                        <div className="text-center py-12 text-red-600">
                                            <p>Erro ao carregar alertas de pânico: {errorPanic?.message}</p>
                                        </div>
                                    ) : filteredPanicAlerts.length === 0 ? (
                                        <div className="text-center py-12">
                                            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum alerta de pânico encontrado</h3>
                                            <p className="text-gray-500">
                                                {searchTerm ? `Nenhum alerta corresponde a &quot;${searchTerm}&quot;` : "Nenhum alerta de pânico registrado ainda."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredPanicAlerts.map((alert, index) => (
                                                <motion.div
                                                    key={alert.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h3 className="font-semibold text-gray-900">Alerta #{alert.id.substring(0, 8)}</h3>
                                                                <Badge className={getStatusBadgeClass(alert.status)}>{alert.status}</Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-600">Usuário: {alert.userId} ({alert.role})</p>
                                                            {alert.message && <p className="text-sm text-gray-600">Mensagem: "{alert.message}"</p>}
                                                            {alert.bookingId && <p className="text-sm text-gray-600">Booking ID: {alert.bookingId}</p>}
                                                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                                                {alert.locationLat && alert.locationLon && (
                                                                    <span className="flex items-center"><MapPin size={14} className="mr-1" /> {alert.locationLat}, {alert.locationLon}</span>
                                                                )}
                                                                <span className="flex items-center"><Clock size={14} className="mr-1" /> {new Date(alert.createdAt).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
                                                            onClick={() => handleUpdatePanicClick(alert)}
                                                        >
                                                            Atualizar Status
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="incidents">
                            <Card className="shadow-floating border-0">
                                <CardHeader>
                                    <CardTitle>Lista de Incidentes</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between gap-4 mb-6">
                                        <div className="relative flex-1 max-w-md">
                                            <Input
                                                type="text"
                                                placeholder="Buscar por ID do reportador ou descrição..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                                            />
                                            <Search className="absolute left-3 top-1/2 transform -translate-y/1/2 text-gray-400" size={16} />
                                        </div>
                                        <Select value={incidentStatusFilter} onValueChange={(value: IncidentStatus | "all") => setIncidentStatusFilter(value)}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Filtrar por status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos os Status</SelectItem>
                                                {Object.values(IncidentStatus).map((status) => (
                                                    <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {isLoadingIncidents ? (
                                        <div className="space-y-4">
                                            {[...Array(3)].map((_, i) => (
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
                                    ) : isErrorIncidents ? (
                                        <div className="text-center py-12 text-red-600">
                                            <p>Erro ao carregar incidentes: {errorIncidents?.message}</p>
                                        </div>
                                    ) : filteredIncidents.length === 0 ? (
                                        <div className="text-center py-12">
                                            <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum incidente encontrado</h3>
                                            <p className="text-gray-500">
                                                {searchTerm ? `Nenhum incidente corresponde a &quot;${searchTerm}&quot;` : "Nenhum incidente registrado ainda."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredIncidents.map((incident, index) => (
                                                <motion.div
                                                    key={incident.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h3 className="font-semibold text-gray-900">Incidente #{incident.id.substring(0, 8)}</h3>
                                                                <Badge className={getStatusBadgeClass(incident.status)}>{incident.status.replace(/_/g, ' ')}</Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-600">Reportador: {incident.reporterId}</p>
                                                            <p className="text-sm text-gray-600">Tipo: {incident.type.replace(/_/g, ' ')}</p>
                                                            <p className="text-sm text-gray-600">Descrição: "{incident.description}"</p>
                                                            {incident.bookingId && <p className="text-sm text-gray-600">Booking ID: {incident.bookingId}</p>}
                                                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                                                <span className="flex items-center"><Clock size={14} className="mr-1" /> {new Date(incident.createdAt).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
                                                            onClick={() => handleUpdateIncidentClick(incident)}
                                                        >
                                                            Atualizar Status
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            {selectedPanicAlert && (
                <PanicAlertUpdateModal
                    isOpen={isPanicUpdateModalOpen}
                    onClose={() => {
                        setIsPanicUpdateModalOpen(false);
                        setSelectedPanicAlert(null);
                    }}
                    panicAlert={selectedPanicAlert}
                />
            )}

            {selectedIncident && (
                <IncidentUpdateModal
                    isOpen={isIncidentUpdateModalOpen}
                    onClose={() => {
                        setIsIncidentUpdateModalOpen(false);
                        setSelectedIncident(null);
                    }}
                    incident={selectedIncident}
                />
            )}
        </div>
    );
}
