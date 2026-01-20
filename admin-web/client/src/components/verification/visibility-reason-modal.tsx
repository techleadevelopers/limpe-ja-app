import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const VISIBILITY_REASON_OPTIONS = [
  "Selfie muito próxima",
  "Filtro/Instagram",
  "Foto cortada",
  "Foto inadequada",
  "Sem contexto de trabalho",
];

interface VisibilityReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

export default function VisibilityReasonModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: VisibilityReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState(VISIBILITY_REASON_OPTIONS[0]);
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(VISIBILITY_REASON_OPTIONS[0]);
      setCustomReason("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const normalized = (customReason.trim() || selectedReason.trim()).trim();
    if (!normalized) return;
    onConfirm(normalized);
  };

  const handleClose = () => {
    setCustomReason("");
    setSelectedReason(VISIBILITY_REASON_OPTIONS[0]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Invalidar vitrine</DialogTitle>
        </DialogHeader>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Motivo sugerido</p>
            <Select value={selectedReason} onValueChange={(value) => setSelectedReason(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_REASON_OPTIONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Complementar com detalhes (opcional)"
            value={customReason}
            onChange={(event) => setCustomReason(event.target.value)}
            className="h-28 resize-none border-gray-200 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose} className="text-gray-600 border-gray-200 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={!(customReason.trim() || selectedReason.trim()) || isPending}
            >
              {isPending ? "Enviando..." : "Confirmar invalidamento"}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
