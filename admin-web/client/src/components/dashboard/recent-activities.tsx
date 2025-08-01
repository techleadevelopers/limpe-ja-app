import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Calendar, AlertTriangle, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
// Removendo mockActivities
// import { mockActivities, type Activity } from "@/data/mockData";
import { useQuery } from "@tanstack/react-query";
import { fetchRecentActivities } from "@/lib/api";
import { Activity, ActivityType } from "@/lib/types"; // Importa Activity e ActivityType dos tipos reais


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

function getActivityIcon(type: string) {
  switch (type) {
    case ActivityType.PROVIDER_REGISTRATION:
      return UserPlus;
    case ActivityType.BOOKING_COMPLETED:
      return Calendar;
    case ActivityType.PROVIDER_STATUS_CHANGE: // Exemplo de um novo tipo de atividade
      return AlertTriangle;
    case ActivityType.PAYMENT_PROCESSED:
      return DollarSign;
    default:
      return UserPlus;
  }
}

function getActivityColor(status: string) {
  switch (status) {
    case "COMPLETED":
    case "APPROVED":
      return "bg-green-100 text-green-600";
    case "PENDING":
      return "bg-yellow-100 text-yellow-600";
    case "PROCESSED":
      return "bg-purple-100 text-purple-600";
    default:
      return "bg-blue-100 text-blue-600";
  }
}

function getIconBgColor(type: string) {
  switch (type) {
    case ActivityType.PROVIDER_REGISTRATION:
      return "bg-green-100 text-green-600";
    case ActivityType.BOOKING_COMPLETED:
      return "bg-blue-100 text-blue-600";
    case ActivityType.PROVIDER_STATUS_CHANGE:
      return "bg-yellow-100 text-yellow-600";
    case ActivityType.PAYMENT_PROCESSED:
      return "bg-purple-100 text-purple-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function RecentActivities() {
  const { data: activities, isLoading, isError, error } = useQuery<Activity[], Error>({
    queryKey: ['/activities'],
    queryFn: () => fetchRecentActivities(5), // Busca as 5 atividades mais recentes
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="lg:col-span-2"
    >
      <Card className="shadow-floating hover:shadow-floating-lg transition-all duration-300 border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Atividades Recentes</CardTitle>
            <Button variant="link" className="text-medium-blue hover:text-blue-700 text-sm font-medium p-0">
              Ver Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center p-4 bg-gray-50 rounded-xl animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center text-red-600">
              <p>Erro ao carregar atividades: {error?.message}</p>
            </div>
          ) : (activities && activities.length > 0) ? (
            <div className="space-y-4">
              {activities.map((activity: Activity) => {
                const Icon = getActivityIcon(activity.type);
                const iconBgColor = getIconBgColor(activity.type);
                const statusColor = getActivityColor(activity.status || "");
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className={`w-10 h-10 ${iconBgColor} rounded-xl flex items-center justify-center`}>
                      <Icon size={16} />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(new Date(activity.createdAt))}</p>
                    </div>
                    {activity.status && (
                      <Badge className={`text-xs px-2 py-1 rounded-full border-0 ${statusColor}`}>
                        {activity.status}
                      </Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma atividade recente.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}