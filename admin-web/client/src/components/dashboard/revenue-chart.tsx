import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "@/lib/api"; // Reutilizando fetchDashboardMetrics para dados de exemplo

// Exemplo de dados mockados, que seriam substituídos por dados reais da API
// Para a demonstração, vamos simular que fetchDashboardMetrics retorna algo que podemos usar aqui
const sampleData = [
  { name: 'Jan', revenue: 65000 },
  { name: 'Fev', revenue: 59000 },
  { name: 'Mar', revenue: 80000 },
  { name: 'Abr', revenue: 81000 },
  { name: 'Mai', revenue: 56000 },
  { name: 'Jun', revenue: 89000 },
  { name: 'Jul', revenue: 95000 },
];

export default function RevenueChart() {
  // Em um cenário real, você buscaria dados de receita específicos, talvez com filtros de período
  // Por agora, vamos apenas usar um mock ou adaptar algo do dashboard metrics
  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['/dashboard/metrics'],
    queryFn: () => fetchDashboardMetrics(),
  });

  // Se você tivesse um endpoint específico para dados de gráfico de receita:
  // const { data: revenueChartData, isLoading: isRevenueLoading } = useQuery({
  //   queryKey: ['/revenue-chart-data'],
  //   queryFn: () => fetchRevenueChartData(),
  // });

  // Para a demonstração, usamos sampleData. Em produção, seria revenueChartData
  const chartData = sampleData; // Ou revenueChartData se implementado

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-floating hover:shadow-floating-lg transition-all duration-300 border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Análise de Receita</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="text-xs bg-light-blue/20 text-medium-blue border-light-blue/30 hover:bg-light-blue/30">
                7D
              </Button>
              <Button variant="outline" size="sm" className="text-xs text-gray-600 hover:text-medium-blue">
                30D
              </Button>
              <Button variant="outline" size="sm" className="text-xs text-gray-600 hover:text-medium-blue">
                90D
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? ( // Ou isRevenueLoading
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Carregando dados do gráfico...</p>
            </div>
          ) : isError ? (
            <div className="h-64 flex items-center justify-center text-red-600">
              <p>Erro ao carregar dados do gráfico.</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                    labelStyle={{ color: '#333' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--medium-blue)" 
                    strokeWidth={3}
                    dot={{ fill: 'var(--medium-blue)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'var(--medium-blue)', strokeWidth: 2, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}