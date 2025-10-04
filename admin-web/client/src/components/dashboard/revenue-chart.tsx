import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchRevenueTrend } from "@/lib/api";
import type { RevenueTrendPoint } from "@/lib/types";

const RANGE_OPTIONS = [
  { label: "3M", value: 3 },
  { label: "6M", value: 6 },
  { label: "12M", value: 12 },
];

export default function RevenueChart() {
  const [selectedRange, setSelectedRange] = useState<number>(12);

  const { data: revenueTrend = [], isLoading, isError, error } = useQuery<RevenueTrendPoint[], Error>({
    queryKey: ['/admin/dashboard/revenue-trend', selectedRange],
    queryFn: () => fetchRevenueTrend(selectedRange),
  });

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
              {RANGE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  className={`text-xs ${selectedRange === option.value
                    ? "bg-light-blue/20 text-medium-blue border-light-blue/30 hover:bg-light-blue/30"
                    : "text-gray-600 hover:text-medium-blue"
                  }`}
                  onClick={() => setSelectedRange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Carregando dados do gráfico...</p>
            </div>
          ) : isError ? (
            <div className="h-64 flex items-center justify-center text-red-600">
              <p>Erro ao carregar dados do gráfico: {error?.message}</p>
            </div>
          ) : revenueTrend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Nenhum dado de receita disponível para o período selecionado.</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" fontSize={12} />
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
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
