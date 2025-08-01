import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, User, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Provider } from "@/data/mockData";
import RejectionModal from "./rejection-modal";

interface VerificationModalProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

export default function VerificationModal({ provider, isOpen, onClose }: VerificationModalProps) {
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const { toast } = useToast();

  const handleApprove = () => {
    if (!provider) return;
    
    toast({
      title: "Provider Approved",
      description: `${provider.name} has been successfully approved.`,
    });
    
    onClose();
  };

  const handleReject = (reason: string) => {
    if (!provider) return;
    
    toast({
      title: "Provider Rejected",
      description: `${provider.name} has been rejected: ${reason}`,
    });
    
    setIsRejectionModalOpen(false);
    onClose();
  };

  const handleBlock = () => {
    if (!provider || !confirm("Are you sure you want to block this provider?")) return;
    
    toast({
      title: "Provider Blocked",
      description: `${provider.name} has been blocked.`,
    });
    
    onClose();
  };

  if (!provider) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Provider Verification</DialogTitle>
            <p className="text-gray-600">Review documents and verification status</p>
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
                    4.8 ({provider.fiveStarReviewCount} reviews)
                  </span>
                  <span className="text-sm text-gray-600 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {provider.jobsCompleted} jobs completed
                  </span>
                </div>
              </div>
              <Badge 
                className={`
                  ${provider.verificationStatus === "PENDING_MANUAL_REVIEW" 
                    ? "bg-orange-100 text-orange-700" 
                    : "bg-yellow-100 text-yellow-700"
                  } border-0 text-sm px-3 py-1
                `}
              >
                {provider.verificationStatus === "PENDING_MANUAL_REVIEW" ? "Manual Review" : "Pending Documents"}
              </Badge>
            </div>

            {/* Document Upload & OCR Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ID Document */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">ID Document</h4>
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
                      alt="ID Document"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* OCR Results */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">OCR Results</h5>
                    <div className="text-xs text-blue-800 space-y-1">
                      <p><strong>Name:</strong> {provider.name}</p>
                      <p><strong>Document Number:</strong> 123.456.789-00</p>
                      <p><strong>Birth Date:</strong> 15/03/1987</p>
                      <p><strong>Issue Date:</strong> 12/06/2019</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-0 mt-2 text-xs">
                      OCR Confidence: 98.5%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Selfie with ID */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Selfie with ID</h4>
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
                      alt="Selfie with ID"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Liveness Check Results */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-green-900 mb-2">Liveness Check</h5>
                    <div className="text-xs text-green-800 space-y-1">
                      <p><strong>Face Match:</strong> 94.2% confidence</p>
                      <p><strong>Liveness Score:</strong> 97.8%</p>
                      <p><strong>Quality Score:</strong> 91.5%</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-0 mt-2 text-xs">
                      Real Person Detected
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Details */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900">Provider Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm text-gray-900">{provider.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">City:</span>
                    <span className="text-sm text-gray-900">{provider.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Registration:</span>
                    <span className="text-sm text-gray-900">{formatRelativeTime(new Date(provider.createdAt || Date.now()))}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Services:</span>
                    <span className="text-sm text-gray-900">{provider.specialties?.join(", ") || "General Cleaning"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Experience:</span>
                    <span className="text-sm text-gray-900">3+ years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Background Check:</span>
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">Passed</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Button 
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow-floating"
                >
                  <CheckCircle className="mr-2" size={16} />
                  Approve
                </Button>
                <Button 
                  onClick={() => setIsRejectionModalOpen(true)}
                  variant="destructive"
                  className="shadow-floating"
                >
                  <X className="mr-2" size={16} />
                  Reject
                </Button>
                <Button 
                  onClick={handleBlock}
                  variant="outline"
                  className="border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white shadow-floating"
                >
                  Block
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50">
                  Request More Info
                </Button>
                <Button variant="outline" onClick={onClose} className="text-gray-600 border-gray-200 hover:bg-gray-50">
                  Cancel
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
      />
    </>
  );
}