import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Eye, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import VerificationModal from "@/components/verification/verification-modal";
import { getPendingProviders, updateProviderStatus, type Provider } from "@/data/mockData";

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

function getStatusInfo(status: string) {
  switch (status) {
    case "PENDING_DOCUMENTS_UPLOAD":
      return {
        badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: FileText,
        iconBg: "bg-yellow-100 text-yellow-600",
        text: "Documents uploaded",
        priority: "Medium",
      };
    case "PENDING_MANUAL_REVIEW":
      return {
        badge: "bg-orange-100 text-orange-700 border-orange-200",
        icon: Eye,
        iconBg: "bg-orange-100 text-orange-600",
        text: "Manual review required",
        priority: "High",
      };
    default:
      return {
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        icon: AlertCircle,
        iconBg: "bg-blue-100 text-blue-600",
        text: "Pending verification",
        priority: "Low",
      };
  }
}

export default function VerificationQueue() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [queue, setQueue] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const pendingProviders = getPendingProviders();
    setQueue(pendingProviders);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const pendingDocuments = queue.filter((p: Provider) => p.verificationStatus === "PENDING_DOCUMENTS_UPLOAD");
  const pendingReview = queue.filter((p: Provider) => p.verificationStatus === "PENDING_MANUAL_REVIEW");

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Verification Queue"
          subtitle={`${queue.length} providers waiting for verification review.`}
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Queue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="text-orange-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{queue.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <FileText className="text-yellow-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Document Upload</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingDocuments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Eye className="text-red-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Manual Review</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingReview.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Verification Queue List */}
          <Card className="shadow-floating border-0">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center p-4 bg-gray-50 rounded-xl animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="text-right">
                        <div className="w-20 h-6 bg-gray-200 rounded-full mb-2"></div>
                        <div className="w-16 h-3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (queue as Provider[]).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending verifications</h3>
                  <p className="text-gray-500">All providers have been verified. Great job!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(queue as Provider[]).map((provider: Provider, index: number) => {
                    const statusInfo = getStatusInfo(provider.verificationStatus || "");
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <motion.div
                        key={provider.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => handleProviderClick(provider)}
                      >
                        <div className={`w-12 h-12 ${statusInfo.iconBg} rounded-xl flex items-center justify-center`}>
                          <StatusIcon size={20} />
                        </div>
                        
                        <div className="ml-4 flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                            <Badge className={`text-xs px-2 py-1 border ${statusInfo.badge}`}>
                              {statusInfo.priority} Priority
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{provider.email}</p>
                          <p className="text-xs text-gray-500 mt-1">{statusInfo.text}</p>
                        </div>
                        
                        <div className="text-right">
                          <Badge className={`border ${statusInfo.badge} mb-2`}>
                            {provider.verificationStatus === "PENDING_DOCUMENTS_UPLOAD" ? "Documents" : "Review"}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(new Date(provider.createdAt || Date.now()))}
                          </p>
                          <div className="mt-2">
                            <Button size="sm" className="bg-medium-blue hover:bg-blue-700 text-white">
                              Review
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

      <VerificationModal
        provider={selectedProvider}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProvider(null);
        }}
      />
    </div>
  );
}
