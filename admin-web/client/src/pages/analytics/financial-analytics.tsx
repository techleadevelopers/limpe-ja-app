import { useMemo, useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, CreditCard, Wallet, ArrowUpRight, ArrowDownRight, Download, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics, fetchRevenueTrend, fetchAllTransactions } from "@/lib/api";
import { DashboardMetrics, RevenueTrendPoint, Transaction } from "@/lib/types";

function formatRelativeTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "N/A";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "N/A";

  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

function getTransactionIcon(type: string) {
  switch (type) {
    case "PAYMENT":
      return ArrowUpRight;
    case "PAYOUT":
    case "WITHDRAWAL":
    case "REFUND":
      return ArrowDownRight;
    case "COMMISSION":
      return DollarSign;
    default:
      return CreditCard;
  }
}

function getTransactionColor(type: string) {
  switch (type) {
    case "PAYMENT":
      return "text-green-600 bg-green-100";
    case "PAYOUT":
    case "WITHDRAWAL":
    case "REFUND":
      return "text-red-600 bg-red-100";
    case "COMMISSION":
      return "text-blue-600 bg-blue-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

export default function FinancialAnalytics() {
  const [timeRange, setTimeRange] = useState("12m");
  const monthsMap: Record<string, number> = { "3m": 3, "6m": 6, "12m": 12 };

  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: fetchDashboardMetrics,
  });

  const { data: revenueTrend } = useQuery<RevenueTrendPoint[]>({
    queryKey: ["revenue-trend", timeRange],
    queryFn: () => fetchRevenueTrend(monthsMap[timeRange] ?? 12),
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["transactions", "all"],
    queryFn: () => fetchAllTransactions(),
  });

  const safeTransactions = transactions ?? [];

  const { paymentsTotal, payoutTotal, commissionTotal } = useMemo(() => {
    return safeTransactions.reduce(
      (acc, tx) => {
        const amount = Number(tx.amount ?? 0);
        if (tx.type === "PAYMENT") acc.paymentsTotal += amount;
        if (tx.type === "WITHDRAWAL" || tx.type === "PAYOUT") acc.payoutTotal += amount;
        if (tx.type === "COMMISSION") acc.commissionTotal += amount;
        return acc;
      },
      { paymentsTotal: 0, payoutTotal: 0, commissionTotal: 0 }
    );
  }, [safeTransactions]);

  const commissionByMonth = useMemo(() => {
    const map = new Map<string, number>();
    safeTransactions.forEach((tx) => {
      if (tx.type !== "COMMISSION") return;
      const date = new Date(tx.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const label = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      map.set(label, (map.get(label) ?? 0) + Number(tx.amount ?? 0));
    });
    return map;
  }, [safeTransactions]);

  const chartData = useMemo(() => {
    return (revenueTrend ?? []).map((point) => ({
      month: point.month,
      revenue: Number(point.revenue ?? 0),
      commission: commissionByMonth.get(point.month) ?? 0,
    }));
  }, [revenueTrend, commissionByMonth]);

  const revenueGrowth = useMemo(() => {
    if (chartData.length < 2) return 0;
    const last = chartData[chartData.length - 1].revenue;
    const prev = chartData[chartData.length - 2].revenue;
    if (!prev) return 0;
    return ((last - prev) / prev) * 100;
  }, [chartData]);

  const commissionGrowth = useMemo(() => {
    if (chartData.length < 2) return 0;
    const last = chartData[chartData.length - 1].commission;
    const prev = chartData[chartData.length - 2].commission;
    if (!prev) return 0;
    return ((last - prev) / prev) * 100;
  }, [chartData]);

  const totalRevenue = useMemo(() => {
    if (metrics?.totalRevenue !== undefined && metrics?.totalRevenue !== null) {
      return Number(metrics.totalRevenue);
    }
    return chartData.reduce((sum, item) => sum + (item.revenue ?? 0), 0);
  }, [metrics?.totalRevenue, chartData]);

  const totalPayouts = payoutTotal;
  const profitMargin = useMemo(() => {
    if (!totalRevenue) return 0;
    return (commissionTotal / totalRevenue) * 100;
  }, [commissionTotal, totalRevenue]);

  const categoryData = useMemo(() => {
    const totalVolume = paymentsTotal + commissionTotal + payoutTotal;
    const safeTotal = totalVolume || 1;
    return [
      { name: "Payments", value: paymentsTotal, color: "#3B82F6", share: Math.round((paymentsTotal / safeTotal) * 100) },
      { name: "Commissions", value: commissionTotal, color: "#10B981", share: Math.round((commissionTotal / safeTotal) * 100) },
      { name: "Payouts", value: payoutTotal, color: "#F97316", share: Math.round((payoutTotal / safeTotal) * 100) },
    ];
  }, [paymentsTotal, commissionTotal, payoutTotal]);

  const recentTransactions = useMemo(() => {
    return [...safeTransactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [safeTransactions]);

  const formatCurrency = (value: number) =>
    `R$ ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Financial Analytics"
          subtitle="Monitor revenue, commissions, and financial performance metrics."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(totalRevenue)}
                      </p>
                      <div className="flex items-center mt-2">
                        {revenueGrowth >= 0 ? (
                          <TrendingUp className="text-green-600 mr-1" size={14} />
                        ) : (
                          <ArrowDownRight className="text-red-600 mr-1" size={14} />
                        )}
                        <span className={`text-sm font-medium ${revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {revenueGrowth >= 0 ? "+" : ""}{revenueGrowth.toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-500 ml-1">vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="text-blue-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(commissionTotal)}
                      </p>
                      <div className="flex items-center mt-2">
                        {commissionGrowth >= 0 ? (
                          <TrendingUp className="text-green-600 mr-1" size={14} />
                        ) : (
                          <ArrowDownRight className="text-red-600 mr-1" size={14} />
                        )}
                        <span className={`text-sm font-medium ${commissionGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {commissionGrowth >= 0 ? "+" : ""}{commissionGrowth.toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-500 ml-1">vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Wallet className="text-green-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Provider Payouts</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(totalPayouts)}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="text-orange-600 mr-1" size={14} />
                        <span className="text-sm text-orange-600 font-medium">Latest interval</span>
                        <span className="text-sm text-gray-500 ml-1">vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="text-orange-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                      <p className="text-2xl font-bold text-gray-900">{profitMargin.toFixed(1)}%</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="text-green-600 mr-1" size={14} />
                        <span className="text-sm text-green-600 font-medium">Based on commissions</span>
                        <span className="text-sm text-gray-500 ml-1">over revenue</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-purple-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Revenue Trend */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="shadow-floating border-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Revenue Analytics</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3m">3 Months</SelectItem>
                            <SelectItem value="6m">6 Months</SelectItem>
                            <SelectItem value="12m">12 Months</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">
                          <Download size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#666" fontSize={12} />
                          <YAxis stroke="#666" fontSize={12} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `R$ ${value.toLocaleString("pt-BR")}`,
                              name === "revenue" ? "Revenue" : name === "commission" ? "Commission" : "Payouts",
                            ]}
                            labelStyle={{ color: "#333" }}
                            contentStyle={{ 
                              backgroundColor: "white", 
                              border: "1px solid #e0e0e0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2, fill: "white" }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="commission" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: "#10B981", strokeWidth: 2, r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Revenue by Category */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="shadow-floating border-0">
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [
                            `R$ ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                            "Valor",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {categoryData.map((category, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-gray-600">{category.name}</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(category.value)} | {category.share}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="shadow-floating border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Transactions</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Calendar className="mr-2" size={16} />
                      Filter by Date
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2" size={16} />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">Nenhuma transacao encontrada.</div>
                  )}
                  {recentTransactions.map((transaction, index) => {
                    const Icon = getTransactionIcon(transaction.type);
                    const colorClass = getTransactionColor(transaction.type);
                    
                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                            <Icon size={16} />
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description ?? "Transaction"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs px-2 py-1 border-0 ${
                                transaction.status?.toLowerCase() === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}>
                                {transaction.status ?? "pending"}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(transaction.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-semibold ${
                            Number(transaction.amount ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {Number(transaction.amount ?? 0) >= 0 ? "+" : "-"}{formatCurrency(Math.abs(Number(transaction.amount ?? 0)))}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{transaction.type?.toLowerCase()}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                <div className="flex justify-center mt-6">
                  <Button variant="outline" className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white">
                    View All Transactions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
