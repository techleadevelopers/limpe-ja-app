import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, ArrowUpRight, ArrowDownRight, Download, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const revenueData = [
  { month: 'Jan', revenue: 45000, commission: 6750, payouts: 38250 },
  { month: 'Feb', revenue: 52000, commission: 7800, payouts: 44200 },
  { month: 'Mar', revenue: 48000, commission: 7200, payouts: 40800 },
  { month: 'Apr', revenue: 61000, commission: 9150, payouts: 51850 },
  { month: 'May', revenue: 55000, commission: 8250, payouts: 46750 },
  { month: 'Jun', revenue: 67000, commission: 10050, payouts: 56950 },
  { month: 'Jul', revenue: 72000, commission: 10800, payouts: 61200 },
  { month: 'Aug', revenue: 69000, commission: 10350, payouts: 58650 },
  { month: 'Sep', revenue: 78000, commission: 11700, payouts: 66300 },
  { month: 'Oct', revenue: 82000, commission: 12300, payouts: 69700 },
  { month: 'Nov', revenue: 89000, commission: 13350, payouts: 75650 },
  { month: 'Dec', revenue: 95000, commission: 14250, payouts: 80750 }
];

const categoryData = [
  { name: 'Residential', value: 65, color: '#3B82F6' },
  { name: 'Commercial', value: 25, color: '#10B981' },
  { name: 'Specialized', value: 10, color: '#F59E0B' }
];

const transactionData = [
  { id: '1', type: 'Payment', description: 'Service booking - Ana Costa', amount: 250.00, status: 'completed', date: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: '2', type: 'Commission', description: 'Platform commission (15%)', amount: 37.50, status: 'completed', date: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: '3', type: 'Payout', description: 'Provider payment - Carlos Lima', amount: -212.50, status: 'pending', date: new Date(Date.now() - 4 * 60 * 60 * 1000) },
  { id: '4', type: 'Payment', description: 'Service booking - Maria Silva', amount: 180.00, status: 'completed', date: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  { id: '5', type: 'Commission', description: 'Platform commission (15%)', amount: 27.00, status: 'completed', date: new Date(Date.now() - 6 * 60 * 60 * 1000) },
];

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

function getTransactionIcon(type: string) {
  switch (type) {
    case 'Payment':
      return ArrowUpRight;
    case 'Payout':
      return ArrowDownRight;
    case 'Commission':
      return DollarSign;
    default:
      return CreditCard;
  }
}

function getTransactionColor(type: string) {
  switch (type) {
    case 'Payment':
      return 'text-green-600 bg-green-100';
    case 'Payout':
      return 'text-red-600 bg-red-100';
    case 'Commission':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export default function FinancialAnalytics() {
  const [timeRange, setTimeRange] = useState("12m");

  const currentMonth = revenueData[revenueData.length - 1];
  const previousMonth = revenueData[revenueData.length - 2];
  
  const revenueGrowth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
  const commissionGrowth = ((currentMonth.commission - previousMonth.commission) / previousMonth.commission) * 100;

  const totalRevenue = revenueData.reduce((sum, month) => sum + month.revenue, 0);
  const totalCommission = revenueData.reduce((sum, month) => sum + month.commission, 0);
  const totalPayouts = revenueData.reduce((sum, month) => sum + month.payouts, 0);

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
                        R$ {totalRevenue.toLocaleString('pt-BR')}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="text-green-600 mr-1" size={14} />
                        <span className="text-sm text-green-600 font-medium">
                          +{revenueGrowth.toFixed(1)}%
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
                        R$ {totalCommission.toLocaleString('pt-BR')}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="text-green-600 mr-1" size={14} />
                        <span className="text-sm text-green-600 font-medium">
                          +{commissionGrowth.toFixed(1)}%
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
                        R$ {totalPayouts.toLocaleString('pt-BR')}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="text-orange-600 mr-1" size={14} />
                        <span className="text-sm text-orange-600 font-medium">+12.8%</span>
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
                      <p className="text-2xl font-bold text-gray-900">15.0%</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="text-green-600 mr-1" size={14} />
                        <span className="text-sm text-green-600 font-medium">Stable</span>
                        <span className="text-sm text-gray-500 ml-1">commission rate</span>
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
                        <LineChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#666" fontSize={12} />
                          <YAxis stroke="#666" fontSize={12} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `R$ ${value.toLocaleString('pt-BR')}`, 
                              name === 'revenue' ? 'Revenue' : name === 'commission' ? 'Commission' : 'Payouts'
                            ]}
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
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: 'white' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="commission" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
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
                        <Tooltip formatter={(value: number) => [`${value}%`, 'Revenue Share']} />
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
                        <span className="font-medium">{category.value}%</span>
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
                  {transactionData.map((transaction, index) => {
                    const Icon = getTransactionIcon(transaction.type);
                    const colorClass = getTransactionColor(transaction.type);
                    
                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                            <Icon size={16} />
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs px-2 py-1 border-0 ${
                                transaction.status === 'completed' 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {transaction.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(transaction.date)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}R$ {Math.abs(transaction.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{transaction.type}</p>
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