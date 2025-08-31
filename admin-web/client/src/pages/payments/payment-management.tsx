import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown, Search, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllTransactions,
  fetchWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
  initiateRefund,
} from "@/lib/api";
import { Transaction, TransactionType, WithdrawalRequest } from "@/lib/types";

// Componente para o Modal de Detalhes do Saque / Ação
interface WithdrawalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: WithdrawalRequest | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

const WithdrawalActionModal = ({ isOpen, onClose, withdrawal, onApprove, onReject }: WithdrawalActionModalProps) => {
  const [rejectionReason, setRejectionReason] = useState("");

  if (!withdrawal) return null;

  const handleApprove = () => {
    onApprove(withdrawal.id);
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert("Por favor, insira um motivo para a rejeição.");
      return;
    }
    onReject(withdrawal.id, rejectionReason);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da Solicitação de Saque</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p><strong>Provedor:</strong> {withdrawal.provider?.name || 'N/A'}</p>
          <p><strong>Valor:</strong> R$ {withdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Status:</strong> <Badge className={getWithdrawalStatusBadge(withdrawal.status)}>{withdrawal.status}</Badge></p>
          <p><strong>Solicitado em:</strong> {new Date(withdrawal.requestedAt).toLocaleString('pt-BR')}</p>

          {withdrawal.status === 'PENDING' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Motivo da Rejeição (opcional)</Label>
                <Input
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Documentação incompleta"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleReject} className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                  Rejeitar
                </Button>
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
                  Aprovar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Funções Auxiliares para Badges e Ícones
function getTransactionIcon(type: TransactionType) {
  switch (type) {
    case TransactionType.PAYMENT:
      return ArrowUpRight;
    case TransactionType.WITHDRAWAL:
      return ArrowDownRight;
    case TransactionType.COMMISSION:
      return DollarSign;
    case TransactionType.REFUND:
      return ArrowDownRight; // Pode ser um ícone diferente se preferir
    default:
      return CreditCard;
  }
}

function getTransactionColor(type: TransactionType) {
  switch (type) {
    case TransactionType.PAYMENT:
      return 'bg-green-100 text-green-600';
    case TransactionType.WITHDRAWAL:
      return 'bg-red-100 text-red-600';
    case TransactionType.COMMISSION:
      return 'bg-blue-100 text-blue-600';
    case TransactionType.REFUND:
      return 'bg-orange-100 text-orange-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getTransactionStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-700 border-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'failed': return 'bg-red-100 text-red-700 border-red-200';
    case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getWithdrawalStatusBadge(status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
    case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export default function PaymentManagementPage() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType | "all">("all");
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<string | "all">("all");
  const [withdrawalSearchTerm, setWithdrawalSearchTerm] = useState("");
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | "all">("all");

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Queries
  const { data: transactions, isLoading: isLoadingTransactions, isError: isErrorTransactions, error: errorTransactions } = useQuery<Transaction[], Error>({
    queryKey: ['/payments/transactions', transactionTypeFilter, transactionStatusFilter],
    queryFn: () => fetchAllTransactions(transactionTypeFilter === "all" ? undefined : transactionTypeFilter, transactionStatusFilter === "all" ? undefined : transactionStatusFilter),
  });

  const { data: withdrawalRequests, isLoading: isLoadingWithdrawals, isError: isErrorWithdrawals, error: errorWithdrawals } = useQuery<WithdrawalRequest[], Error>({
    queryKey: ['/payments/withdrawals', withdrawalStatusFilter],
    queryFn: () => fetchWithdrawalRequests(withdrawalStatusFilter === "all" ? undefined : withdrawalStatusFilter),
  });

  // Mutations
  const approveWithdrawalMutation = useMutation({
    mutationFn: approveWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/payments/withdrawals'] });
      toast({ title: "Sucesso!", description: "Solicitação de saque aprovada." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: `Falha ao aprovar saque: ${err.message}`, variant: "destructive" });
    },
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectWithdrawal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/payments/withdrawals'] });
      toast({ title: "Sucesso!", description: "Solicitação de saque rejeitada." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: `Falha ao rejeitar saque: ${err.message}`, variant: "destructive" });
    },
  });

  const initiateRefundMutation = useMutation({
    mutationFn: ({ transactionId, amount }: { transactionId: string; amount?: number }) => initiateRefund(transactionId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/payments/transactions'] });
      toast({ title: "Sucesso!", description: "Reembolso iniciado com sucesso." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: `Falha ao iniciar reembolso: ${err.message}`, variant: "destructive" });
    },
  });

  // Handlers
  const handleOpenWithdrawalModal = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setIsWithdrawalModalOpen(true);
  };

  const handleApproveWithdrawal = (id: string) => {
    approveWithdrawalMutation.mutate(id);
  };

  const handleRejectWithdrawal = (id: string, reason: string) => {
    rejectWithdrawalMutation.mutate({ id, reason });
  };

  const handleInitiateRefund = (transactionId: string, amount?: number) => {
    if (confirm("Tem certeza que deseja iniciar o reembolso para esta transação?")) {
      initiateRefundMutation.mutate({ transactionId, amount });
    }
  };

  // Filtered Data
  const filteredTransactions = transactions?.filter(transaction =>
    (transaction.description || '').toLowerCase().includes(transactionSearchTerm.toLowerCase()) ||
    (transaction.id || '').toLowerCase().includes(transactionSearchTerm.toLowerCase())
  ) || [];

  const filteredWithdrawalRequests = withdrawalRequests?.filter(request =>
    (request.provider?.name || '').toLowerCase().includes(withdrawalSearchTerm.toLowerCase()) ||
    (request.id || '').toLowerCase().includes(withdrawalSearchTerm.toLowerCase())
  ) || [];

  // Metrics (simplified, ideally from a dedicated metrics API endpoint)
  const totalRevenue = transactions?.filter(t => t.type === TransactionType.PAYMENT && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalPayouts = transactions?.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0) || 0;
  const pendingWithdrawalsCount = withdrawalRequests?.filter(w => w.status === 'PENDING').length || 0;
  const platformCommission = transactions?.filter(t => t.type === TransactionType.COMMISSION && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0) || 0;


  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Gerenciamento de Pagamentos"
          subtitle="Monitore transações, gerencie saques e visualize o fluxo financeiro."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Receita Total</p>
                      <p className="text-2xl font-bold text-gray-900">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-green-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Saques</p>
                      <p className="text-2xl font-bold text-gray-900">R$ {totalPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <TrendingDown className="text-red-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Saques Pendentes</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingWithdrawalsCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Clock className="text-yellow-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Comissão da Plataforma</p>
                      <p className="text-2xl font-bold text-gray-900">R$ {platformCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Wallet className="text-blue-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white shadow-floating border-0">
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="withdrawals">Solicitações de Saque</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              <Card className="shadow-floating border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Histórico de Transações</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Buscar transação..."
                          value={transactionSearchTerm}
                          onChange={(e) => setTransactionSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      </div>
                      <Select value={transactionTypeFilter} onValueChange={(value: TransactionType | "all") => setTransactionTypeFilter(value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Tipos</SelectItem>
                          <SelectItem value={TransactionType.PAYMENT}>Pagamento</SelectItem>
                          <SelectItem value={TransactionType.WITHDRAWAL}>Saque</SelectItem>
                          <SelectItem value={TransactionType.COMMISSION}>Comissão</SelectItem>
                          <SelectItem value={TransactionType.REFUND}>Reembolso</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={transactionStatusFilter} onValueChange={(value: string | "all") => setTransactionStatusFilter(value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Status</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="failed">Falhou</SelectItem>
                          <SelectItem value="processing">Processando</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingTransactions ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center p-4 bg-gray-50 rounded-xl animate-pulse">
                          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                          <div className="ml-4 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                          <div className="w-24 h-8 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : isErrorTransactions ? (
                    <div className="text-center py-12 text-red-600">
                      <p>Erro ao carregar transações: {errorTransactions?.message}</p>
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
                      <p className="text-gray-500">Ajuste seus filtros ou termos de busca.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTransactions.map((transaction, index) => {
                        const Icon = getTransactionIcon(transaction.type);
                        const iconColorClass = getTransactionColor(transaction.type);
                        const statusBadgeClass = getTransactionStatusBadge(transaction.status);
                        
                        return (
                          <motion.div
                            key={transaction.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColorClass}`}>
                                <Icon size={16} />
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-900">{transaction.description || `Transação ${transaction.type}`}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={`text-xs px-2 py-1 border-0 ${statusBadgeClass}`}>
                                    {transaction.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className={`font-semibold ${
                                transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === TransactionType.WITHDRAWAL || transaction.type === TransactionType.REFUND ? '-' : '+'}R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">{transaction.type}</p>
                              {transaction.type === TransactionType.PAYMENT && transaction.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-500 hover:text-blue-700 mt-1"
                                  onClick={() => handleInitiateRefund(transaction.id, transaction.amount)}
                                  disabled={initiateRefundMutation.isPending}
                                >
                                  Reembolsar
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals">
              <Card className="shadow-floating border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Solicitações de Saque</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Buscar solicitação..."
                          value={withdrawalSearchTerm}
                          onChange={(e) => setWithdrawalSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      </div>
                      <Select value={withdrawalStatusFilter} onValueChange={(value: 'PENDING' | 'APPROVED' | 'REJECTED' | "all") => setWithdrawalStatusFilter(value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Status</SelectItem>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="APPROVED">Aprovado</SelectItem>
                          <SelectItem value="REJECTED">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingWithdrawals ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center p-4 bg-gray-50 rounded-xl animate-pulse">
                          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                          <div className="ml-4 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                          <div className="w-24 h-8 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : isErrorWithdrawals ? (
                    <div className="text-center py-12 text-red-600">
                      <p>Erro ao carregar solicitações de saque: {errorWithdrawals?.message}</p>
                    </div>
                  ) : filteredWithdrawalRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma solicitação de saque encontrada</h3>
                      <p className="text-gray-500">Ajuste seus filtros ou termos de busca.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredWithdrawalRequests.map((request, index) => {
                        const statusBadgeClass = getWithdrawalStatusBadge(request.status);
                        
                        return (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                                request.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {request.status === 'PENDING' ? <Clock size={16} /> :
                                request.status === 'APPROVED' ? <CheckCircle size={16} /> :
                                <XCircle size={16} />}
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-900">Saque de {request.provider?.name || 'Provedor Desconhecido'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={`text-xs px-2 py-1 border-0 ${statusBadgeClass}`}>
                                    {request.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    Solicitado em: {new Date(request.requestedAt).toLocaleString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                R$ {request.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              {request.status === 'PENDING' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-500 hover:text-blue-700 mt-1"
                                  onClick={() => handleOpenWithdrawalModal(request)}
                                >
                                  Revisar
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <WithdrawalActionModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => {
          setIsWithdrawalModalOpen(false);
          setSelectedWithdrawal(null);
        }}
        withdrawal={selectedWithdrawal}
        onApprove={handleApproveWithdrawal}
        onReject={handleRejectWithdrawal}
      />
    </div>
  );
}