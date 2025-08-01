import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useState } from "react";

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function RejectionModal({ isOpen, onClose, onConfirm }: RejectionModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");

  const handleConfirm = () => {
    if (rejectionReason.trim()) {
      onConfirm(rejectionReason);
      setRejectionReason("");
      onClose();
    }
  };

  const handleClose = () => {
    setRejectionReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Rejection Reason</DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Textarea
            placeholder="Please provide a detailed reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="h-32 resize-none border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" onClick={handleClose} className="text-gray-600 border-gray-200 hover:bg-gray-50">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!rejectionReason.trim()}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm Rejection
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
