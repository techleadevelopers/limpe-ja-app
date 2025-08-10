// admin-web/src/components/modals/verification-modal.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, User, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Importa a função de API corrigida
import { updateProviderStatus } from "@/lib/api";
// CORREÇÃO: Importa Provider e VerificationStatus
import { Provider, VerificationStatus } from "@/lib/types";
import RejectionModal from "./rejection-modal";

interface VerificationModalProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
  // As props de callback foram removidas pois o componente agora lida com a lógica de API internamente
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

export default function VerificationModal({ provider, isOpen, onClose }: VerificationModalProps) {
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!provider) return null;

  // Mutação para aprovar o provedor
  const approveMutation = useMutation({
    mutationFn: (providerId: string) => updateProviderStatus(providerId, VerificationStatus.APPROVED),
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Provedor aprovado com sucesso.", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ['verificationQueue'] });
      onClose();
    },
    onError: (error) => {
      toast({ title: "Erro na Aprovação", description: error.message, variant: "destructive" });
    },
  });

  // Mutação para rejeitar o provedor
  const rejectMutation = useMutation({
    mutationFn: ({ providerId, reason }: { providerId: string; reason: string }) => 
      updateProviderStatus(providerId, VerificationStatus.REJECTED, reason),
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Provedor rejeitado com sucesso.", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ['verificationQueue'] });
      onClose();
      setIsRejectionModalOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro na Rejeição", description: error.message, variant: "destructive" });
    },
  });

  const handleApprove = () => {
    approveMutation.mutate(provider.id);
  };

  const handleReject = (reason: string) => {
    rejectMutation.mutate({ providerId: provider.id, reason });
  };

  const handleBlock = () => {
    // A lógica de bloqueio ainda precisa ser implementada
    // Se houver um endpoint para isso, você criaria uma nova mutation aqui
    toast({ title: "Funcionalidade em desenvolvimento", description: "A lógica de bloqueio ainda não foi implementada.", variant: "warning" });
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
            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <img 
                src={`https://images.unsplash.com/photo-150720939${Math.floor(Math.random() * 10)}?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100`}
                alt={`${provider.name} profile`}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                <p className="text-gray-600">{provider.email}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    4.8 ({provider.fiveStarReviewCount} avaliações)
                  </span>
                  <span className="text-sm text-gray-600 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {provider.jobsCompleted || 0} trabalhos concluídos
                  </span>
                </div>
              </div>
              <Badge 
                className={`
                  ${provider.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW 
                    ? "bg-orange-100 text-orange-700" 
                    : "bg-yellow-100 text-yellow-700"
                  } border-0 text-sm px-3 py-1
                `}
              >
                {provider.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW ? "Revisão Manual" : "Documentos Pendentes"}
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
                        <p><strong>Nome:</strong> {provider.ocrResult.fullName || provider.name}</p>
                        <p><strong>Número do Documento:</strong> {provider.ocrResult.documentNumber || "N/A"}</p>
                        <p><strong>Data de Nascimento:</strong> {provider.ocrResult.birthDate || "N/A"}</p>
                        <p><strong>Tipo de Documento:</strong> {provider.ocrResult.documentType || "N/A"}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-blue-800">Nenhum resultado de OCR disponível.</p>
                    )}
                    <Badge className="bg-green-100 text-green-700 border-0 mt-2 text-xs">
                      OCR Confiança: {provider.ocrResult?.confidence ? `${(provider.ocrResult.confidence * 100).toFixed(1)}%` : "N/A"}
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
                        <p><strong>Correspondência Facial:</strong> {provider.livenessResult.faceMatch ? `${(provider.livenessResult.faceMatch * 100).toFixed(1)}%` : "N/A"}</p>
                        <p><strong>Pontuação de Vivacidade:</strong> {provider.livenessResult.livenessScore ? `${(provider.livenessResult.livenessScore * 100).toFixed(1)}%` : "N/A"}</p>
                        <p><strong>Pontuação de Qualidade:</strong> {provider.livenessResult.qualityScore ? `${(provider.livenessResult.qualityScore * 100).toFixed(1)}%` : "N/A"}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-green-800">Nenhum resultado de verificação de vivacidade disponível.</p>
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
                    <span className="text-sm text-gray-900">{provider.phone || "N/A"}</span>
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

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Button 
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow-floating"
                >
                  <CheckCircle className="mr-2" size={16} />
                  {approveMutation.isPending ? 'Aprovando...' : 'Aprovar'}
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
    </>
  );
}