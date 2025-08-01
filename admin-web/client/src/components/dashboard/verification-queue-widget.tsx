import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Link } from "wouter";
// Removendo import de mockData
// import { getPendingProviders, type Provider } from "@/data/mockData";
import { useQuery } from "@tanstack/react-query";
import { fetchVerificationQueue } from "@/lib/api";
import { Provider, VerificationStatus } from "@/lib/types"; // Importa Provider e VerificationStatus dos tipos reais


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

function getStatusBadge(status: string) {
  switch (status) {
    case VerificationStatus.PENDING_DOCUMENTS_UPLOAD:
      return "bg-yellow-100 text-yellow-700";
    case VerificationStatus.PENDING_MANUAL_REVIEW:
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case VerificationStatus.PENDING_DOCUMENTS_UPLOAD:
      return "Documentos enviados";
    case VerificationStatus.PENDING_MANUAL_REVIEW:
      return "Revisão manual necessária";
    default:
      return "Pendente";
  }
}

export default function VerificationQueueWidget() {
  const { data: queue, isLoading, isError } = useQuery<Provider[], Error>({
    queryKey: ['/verification-queue'],
    queryFn: () => fetchVerificationQueue(),
  });

  const displayQueue = queue?.slice(0, 3) || []; // Show only first 3 items

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="shadow-floating hover:shadow-floating-lg transition-all duration-300 border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Fila de Verificação</CardTitle>
            <Badge className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full border-0">
              {(queue as Provider[])?.length || 0} Pendente
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 border border-gray-200 rounded-xl animate-pulse">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="ml-3 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div>
                      <div className="w-16 h-5 bg-gray-200 rounded-full mb-1"></div>
                      <div className="w-12 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center text-red-600">
              <p>Erro ao carregar a fila.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayQueue.map((provider: Provider) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 border border-gray-200 rounded-xl hover:border-medium-blue hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center">
                    <img 
                      src={`https://images.unsplash.com/photo-150720939${Math.floor(Math.random() * 10)}?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100`}
                      alt={`${provider.name} profile`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{provider.name}</p>
                      <p className="text-xs text-gray-500">{getStatusText(provider.verificationStatus || "")}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusBadge(provider.verificationStatus || "")}`}>
                        {provider.verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD ? "Pendente" : "Revisar"}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(new Date(provider.createdAt))}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <Link href="/verification-queue">
            <Button className="w-full mt-4 py-2 text-sm font-medium text-medium-blue border border-medium-blue rounded-xl hover:bg-medium-blue hover:text-white transition-all duration-300 bg-transparent">
              Ver Todos Pendentes ({(queue as Provider[])?.length || 0})
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}