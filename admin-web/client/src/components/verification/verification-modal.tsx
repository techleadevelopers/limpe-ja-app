// admin-web/src/components/modals/verification-modal.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, CheckCircle, User, X, MapPin, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Importa a função de API corrigida
import { updateProviderProfile, updateProviderStatus, updateProviderVisibility } from "@/lib/api";
// CORREÇÃO: Importa Provider e VerificationStatus
import { Provider, ProviderVisibilityStatus, VerificationStatus } from "@/lib/types";
import RejectionModal from "./rejection-modal";
import VisibilityReasonModal from "./visibility-reason-modal";

interface VerificationModalProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
  // Callbacks opcionais para compatibilidade com chamadas existentes
  onApprove?: (providerId: string) => void;
  onReject?: (providerId: string, reason: string) => void;
  onBlock?: (providerId: string) => void;
  onProviderUpdated?: (provider: Provider) => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Agora mesmo";
  if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} horas atrás`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} dias atrás`;
}
const VISIBILITY_BADGE_CLASSES: Record<ProviderVisibilityStatus, string> = {
  [ProviderVisibilityStatus.VISIBLE]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [ProviderVisibilityStatus.PENDING_VITRINE_REVIEW]: "bg-amber-100 text-amber-700 border-amber-200",
  [ProviderVisibilityStatus.VITRINE_IRREGULAR]: "bg-red-100 text-red-700 border-red-200",
};


export default function VerificationModal({ provider, isOpen, onClose }: VerificationModalProps) {
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [latitudeInput, setLatitudeInput] = useState("");
  const [longitudeInput, setLongitudeInput] = useState("");
  const [isVisibilityReasonModalOpen, setIsVisibilityReasonModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (provider) {
      const lat = provider.address?.latitude ?? provider.latitude;
      const lon = provider.address?.longitude ?? provider.longitude;
      setLatitudeInput(lat !== null && lat !== undefined ? String(lat) : "");
      setLongitudeInput(lon !== null && lon !== undefined ? String(lon) : "");
    } else {
      setLatitudeInput("");
      setLongitudeInput("");
    }
  }, [provider]);

  // Mova as declarações de useMutation para o topo do componente
  const approveMutation = useMutation({
    mutationFn: (providerId: string) => updateProviderStatus(providerId, VerificationStatus.APPROVED),
    onSuccess: (updatedProvider) => {
      toast({ title: "Sucesso!", description: "Provedor aprovado com sucesso.", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["/verification/pending-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/providers"] });
      onProviderUpdated?.(updatedProvider);
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro na Aprovação", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ providerId, reason }: { providerId: string; reason: string }) =>
      updateProviderStatus(providerId, VerificationStatus.REJECTED, reason),
    onSuccess: (updatedProvider) => {
      toast({ title: "Sucesso!", description: "Provedor rejeitado com sucesso.", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["/verification/pending-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/providers"] });
      onProviderUpdated?.(updatedProvider);
      onClose();
      setIsRejectionModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro na Rejeição", description: error.message, variant: "destructive" });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      if (!provider?.address) {
        throw new Error("Endereço não disponível para edição.");
      }
      const addr = provider.address;
      const payload = {
        cep: addr.cep,
        street: addr.street,
        number: addr.number,
        complement: addr.complement ?? undefined,
        neighborhood: addr.neighborhood,
        city: addr.city,
        state: addr.state,
        latitude,
        longitude,
      };
      return updateProviderProfile(provider.id, { address: payload });
    },
    onSuccess: () => {
      toast({
        title: "Localização atualizada",
        description: "Latitude e longitude salvas no cadastro do provedor.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/verification/pending-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/providers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar localização",
        description: error?.message || "Não foi possível atualizar as coordenadas.",
        variant: "destructive",
      });
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: ({ status, reason }: { status: ProviderVisibilityStatus; reason?: string | null }) => {
      if (!provider) {
        return Promise.reject(new Error("Provedor indisponível"));
      }
      return updateProviderVisibility(provider.id, status, reason);
    },
    onSuccess: (updatedProvider) => {
      toast({
        title: "Visibilidade atualizada",
        description: "O status da vitrine foi atualizado com sucesso.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/verification/pending-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/providers"] });
      setIsVisibilityReasonModalOpen(false);
      onProviderUpdated?.(updatedProvider);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar vitrine",
        description: error?.message || "Não foi possível alterar o status da vitrine.",
        variant: "destructive",
      });
    },
  });

  if (!provider) return null;

  const resolvedName = provider.fullName || provider.name || "Sem nome";
  const providerVisibilityStatus = provider.visibilityStatus ?? ProviderVisibilityStatus.VISIBLE;
  const visibilityReasonText = provider.visibilityReason?.trim() || "Nenhum motivo registrado";
  const visibilityUpdatedText = provider.visibilityUpdatedAt
    ? formatRelativeTime(new Date(provider.visibilityUpdatedAt))
    : "Sem atualizações recentes";
  const visibilityBadgeClass = VISIBILITY_BADGE_CLASSES[providerVisibilityStatus];

  const handleSetVisibilityStatus = (status: ProviderVisibilityStatus, reason?: string | null) => {
    updateVisibilityMutation.mutate({ status, reason });
  };
  const handleVisibilityApprove = () => handleSetVisibilityStatus(ProviderVisibilityStatus.VISIBLE, null);
  const handleVisibilityPending = () =>
    handleSetVisibilityStatus(ProviderVisibilityStatus.PENDING_VITRINE_REVIEW);
  const handleConfirmVisibilityReason = (reason: string) =>
    handleSetVisibilityStatus(ProviderVisibilityStatus.VITRINE_IRREGULAR, reason);
  const handleOpenVisibilityModal = () => setIsVisibilityReasonModalOpen(true);

  const handleApprove = () => {
    approveMutation.mutate(provider.id);
  };

  const handleReject = (reason: string) => {
    rejectMutation.mutate({ providerId: provider.id, reason });
  };

  const handleBlock = () => {
    // A lógica de bloqueio ainda precisa ser implementada
    // Se houver um endpoint para isso, você criaria uma nova mutation aqui
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A lógica de bloqueio ainda não foi implementada.",
      variant: "warning",
    });
  };

  const handleUpdateLocation = () => {
    if (!provider?.address) {
      toast({
        title: "Endereço indisponível",
        description: "Não há endereço cadastrado para ajustar a localização.",
        variant: "destructive",
      });
      return;
    }
    const lat = parseFloat(latitudeInput.replace(",", "."));
    const lon = parseFloat(longitudeInput.replace(",", "."));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      toast({
        title: "Coordenadas inválidas",
        description: "Digite valores numéricos para latitude e longitude.",
        variant: "destructive",
      });
      return;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast({
        title: "Fora do intervalo",
        description: "Latitude deve estar entre -90 e 90, e longitude entre -180 e 180.",
        variant: "destructive",
      });
      return;
    }
    updateLocationMutation.mutate({ latitude: lat, longitude: lon });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Verificação de Provedor</DialogTitle>
            <p className="text-gray-600">Revise documentos e status de verificação</p>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Provider Info */}
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 ring-1 ring-gray-200 shadow-sm">
                  {provider.avatarUrl ? (
                    <AvatarImage
                      src={provider.avatarUrl}
                      alt={resolvedName}
                    />
                  ) : (
                    <AvatarFallback>
                      <User className="w-5 h-5 text-gray-500" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{resolvedName}</h3>
                    <p className="text-sm text-gray-600">{provider.email}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-sm text-gray-600 flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        4.8 ({provider.fiveStarReviewCount} avaliacoes)
                      </span>
                      <span className="text-sm text-gray-600 flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {provider.jobsCompleted || 0} trabalhos concluidos
                      </span>
                    </div>
                  </div>
                </div>
              <Badge className="border-0 text-sm px-3 py-1">
                {provider.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW
                  ? "Revisao Manual"
                  : "Documentos Pendentes"}
              </Badge>
            </div>


            {/* Document Upload & OCR Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ID Document */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Documento de Identidade</h4>
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    {provider.documentPhotoFrontUrl ? (
                      <img
                        src={provider.documentPhotoFrontUrl}
                        alt="ID Document"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-400">Nenhuma imagem disponível</span>
                    )}
                  </div>

                  {/* OCR Results */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">Resultados OCR</h5>
                    {provider.ocrResult ? (
                      <div className="text-xs text-blue-800 space-y-1">
                        <p>
                          <strong>Nome:</strong> {provider.ocrResult.fullName || resolvedName}
                        </p>
                        <p>
                          <strong>Número do Documento:</strong> {provider.ocrResult.documentNumber || "N/A"}
                        </p>
                        <p>
                          <strong>Data de Nascimento:</strong> {provider.ocrResult.birthDate || "N/A"}
                        </p>
                        <p>
                          <strong>Tipo de Documento:</strong> {provider.ocrResult.documentType || "N/A"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-blue-800">Nenhum resultado de OCR disponível.</p>
                    )}
                    <Badge className="bg-green-100 text-green-700 border-0 mt-2 text-xs">
                      OCR Confiança:{" "}
                      {provider.ocrResult?.confidence
                        ? `${(provider.ocrResult.confidence * 100).toFixed(1)}%`
                        : "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Selfie with ID */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Selfie com Documento</h4>
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    {provider.selfieWithDocumentUrl ? (
                      <img
                        src={provider.selfieWithDocumentUrl}
                        alt="Selfie with ID"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-400">Nenhuma imagem disponível</span>
                    )}
                  </div>

                  {/* Liveness Check Results */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-green-900 mb-2">Verificação de Vivacidade</h5>
                    {provider.livenessResult ? (
                      <div className="text-xs text-green-800 space-y-1">
                        <p>
                          <strong>Correspondência Facial:</strong>{" "}
                          {provider.livenessResult.faceMatch
                            ? `${(provider.livenessResult.faceMatch * 100).toFixed(1)}%`
                            : "N/A"}
                        </p>
                        <p>
                          <strong>Pontuação de Vivacidade:</strong>{" "}
                          {provider.livenessResult.livenessScore
                            ? `${(provider.livenessResult.livenessScore * 100).toFixed(1)}%`
                            : "N/A"}
                        </p>
                        <p>
                          <strong>Pontuação de Qualidade:</strong>{" "}
                          {provider.livenessResult.qualityScore
                            ? `${(provider.livenessResult.qualityScore * 100).toFixed(1)}%`
                            : "N/A"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-green-800">
                        Nenhum resultado de verificação de vivacidade disponível.
                      </p>
                    )}
                    <Badge className="bg-green-100 text-green-700 border-0 mt-2 text-xs">
                      {provider.livenessResult?.isLive ? "Pessoa Real Detectada" : "Não Detectada"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Details */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900">Informações do Provedor</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Telefone:</span>
                    <span className="text-sm text-gray-900">{provider.phone || provider.userPhone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cidade:</span>
                    <span className="text-sm text-gray-900">{provider.city || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Registro:</span>
                    <span className="text-sm text-gray-900">{formatRelativeTime(new Date(provider.createdAt))}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Serviços:</span>
                    <span className="text-sm text-gray-900">{provider.specialties?.join(", ") || "Limpeza Geral"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Experiência:</span>
                    <span className="text-sm text-gray-900">3+ anos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Verificação de Antecedentes:</span>
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">Aprovado</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 border border-dashed border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-semibold text-gray-900">Status de Visibilidade</h4>
                  <Badge className={`border ${visibilityBadgeClass}`}>
                    {providerVisibilityStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="text-right text-xs text-gray-500 space-y-1">
                  <p>{visibilityUpdatedText}</p>
                  <p>{visibilityReasonText}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleOpenVisibilityModal}
                  className="text-red-600 border-red-200"
                  disabled={updateVisibilityMutation.isPending}
                >
                  Invalidar Vitrine
                </Button>
                <Button
                  variant="outline"
                  onClick={handleVisibilityPending}
                  className="text-amber-600 border-amber-200"
                  disabled={updateVisibilityMutation.isPending}
                >
                  {updateVisibilityMutation.isPending ? "Atualizando..." : "Pendente Vitrine"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleVisibilityApprove}
                  className="text-emerald-600 border-emerald-200"
                  disabled={updateVisibilityMutation.isPending}
                >
                  {updateVisibilityMutation.isPending ? "Atualizando..." : "Aprovar Foto"}
                </Button>
              </div>
            </div>

            {/* Manual Location Fix */}
            <div className="space-y-3 border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-medium-blue" />
                    Ajustar Localização
                  </h4>
                  <p className="text-xs text-gray-600">Edite latitude/longitude se o endereço estiver incorreto.</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleUpdateLocation}
                  disabled={updateLocationMutation.isPending}
                  className="bg-medium-blue text-white"
                >
                  {updateLocationMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4 mr-2" />
                  )}
                  Salvar localização
                </Button>
              </div>
              {provider.address ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-600">Latitude</span>
                    <Input
                      value={latitudeInput}
                      onChange={(e) => setLatitudeInput(e.target.value)}
                      placeholder="-22.90"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-600">Longitude</span>
                    <Input
                      value={longitudeInput}
                      onChange={(e) => setLongitudeInput(e.target.value)}
                      placeholder="-43.20"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Sem endereço cadastrado para este provedor.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow-floating"
                >
                  <CheckCircle className="mr-2" size={16} />
                  {approveMutation.isPending ? "Aprovando..." : "Aprovar"}
                </Button>
                <Button
                  onClick={() => setIsRejectionModalOpen(true)}
                  variant="destructive"
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="shadow-floating"
                >
                  <X className="mr-2" size={16} />
                  Rejeitar
                </Button>
                <Button
                  onClick={handleBlock}
                  variant="outline"
                  className="border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white shadow-floating"
                >
                  Bloquear
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50">
                  Solicitar Mais Info
                </Button>
                <Button variant="outline" onClick={onClose} className="text-gray-600 border-gray-200 hover:bg-gray-50">
                  Cancelar
                </Button>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={handleReject}
        isPending={rejectMutation.isPending}
      />
      <VisibilityReasonModal
        isOpen={isVisibilityReasonModalOpen}
        onClose={() => setIsVisibilityReasonModalOpen(false)}
        onConfirm={handleConfirmVisibilityReason}
        isPending={updateVisibilityMutation.isPending}
      />
    </>
  );
}
