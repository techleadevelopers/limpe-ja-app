import { useState, useEffect } from "react"; // Adicionado useEffect
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Filter, Tag, DollarSign, Percent, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from "@/lib/api";
import { Coupon, CouponType, CouponTarget, CouponStatus } from "@/lib/types";

// Componente de Modal para Adicionar/Editar Cupom
interface CouponFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon?: Coupon; // Se for para edição, passa o cupom existente
}

const CouponFormModal = ({ isOpen, onClose, coupon }: CouponFormModalProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Coupon>>(() => coupon || {
    code: '',
    type: CouponType.PERCENTAGE,
    value: 0,
    validFrom: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
    validUntil: '',
    maxUses: 0,
    target: CouponTarget.ALL,
    targetId: null,
  });

  // Reset form data when modal opens/closes or coupon prop changes
  useEffect(() => { // Alterado de useState para useEffect
    setFormData(coupon || {
      code: '',
      type: CouponType.PERCENTAGE,
      value: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      maxUses: 0,
      target: CouponTarget.ALL,
      targetId: null,
    });
  }, [isOpen, coupon]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Coupon, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleNumberChange = (id: keyof Coupon, value: string) => {
    setFormData(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
  };

  const addCouponMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/coupons'] });
      toast({ title: "Sucesso!", description: "Cupom criado com sucesso." });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao criar cupom: ${error.message}`, variant: "destructive" });
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: (data: { id: string, couponData: Partial<Coupon> }) => updateCoupon(data.id, data.couponData),
    onSuccess: (updatedCoupon) => { // Adicionado updatedCoupon para a mensagem de sucesso
      queryClient.invalidateQueries({ queryKey: ['/coupons'] });
      toast({ title: "Sucesso!", description: `Cupom ${updatedCoupon.code} atualizado com sucesso.` });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao atualizar cupom: ${error.message}`, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (coupon) {
      updateCouponMutation.mutate({ id: coupon.id, couponData: formData });
    } else {
      // É importante garantir que o tipo de 'formData' esteja correto para 'createCoupon'
      // Omitir 'id', 'usesCount', 'status', 'createdAt', 'updatedAt'
      const { id, usesCount, status, createdAt, updatedAt, ...couponDataToCreate } = formData;
      addCouponMutation.mutate(couponDataToCreate as Omit<Coupon, 'id' | 'usesCount' | 'status' | 'createdAt' | 'updatedAt'>);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{coupon ? "Editar Cupom" : "Adicionar Novo Cupom"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código do Cupom</Label>
              <Input id="code" value={formData.code || ''} onChange={handleInputChange} placeholder="EX: VERÃO20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Desconto</Label>
              <Select value={formData.type} onValueChange={(value: CouponType) => handleSelectChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CouponType.PERCENTAGE}>Porcentagem</SelectItem>
                  <SelectItem value={CouponType.FIXED_AMOUNT}>Valor Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor ({formData.type === CouponType.PERCENTAGE ? '%' : 'R$'})</Label>
              <Input id="value" type="number" value={formData.value || 0} onChange={(e) => handleNumberChange('value', e.target.value)} placeholder="Ex: 10 para 10% ou R$10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses">Usos Máximos (0 para ilimitado)</Label>
              <Input id="maxUses" type="number" value={formData.maxUses || 0} onChange={(e) => handleNumberChange('maxUses', e.target.value)} placeholder="Ex: 100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Válido De</Label>
              <Input id="validFrom" type="date" value={formData.validFrom?.split('T')[0] || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Válido Até</Label>
              <Input id="validUntil" type="date" value={formData.validUntil?.split('T')[0] || ''} onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Alvo do Cupom</Label>
            <Select value={formData.target} onValueChange={(value: CouponTarget) => handleSelectChange('target', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o alvo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CouponTarget.ALL}>Todos</SelectItem>
                <SelectItem value={CouponTarget.NEW_CLIENTS}>Novos Clientes</SelectItem>
                <SelectItem value={CouponTarget.SPECIFIC_SERVICE}>Serviço Específico</SelectItem>
                <SelectItem value={CouponTarget.SPECIFIC_PROVIDER}>Provedor Específico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.target !== CouponTarget.ALL && (
            <div className="space-y-2">
              <Label htmlFor="targetId">ID do Alvo (Serviço/Provedor)</Label>
              <Input id="targetId" value={formData.targetId || ''} onChange={handleInputChange} placeholder="ID do serviço ou provedor" />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={addCouponMutation.isPending || updateCouponMutation.isPending} className="bg-medium-blue hover:bg-blue-700 text-white">
              {coupon ? "Salvar Alterações" : "Criar Cupom"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function CouponManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CouponStatus | "all">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [selectedPushCoupon, setSelectedPushCoupon] = useState<Coupon | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: coupons, isLoading, isError, error } = useQuery<Coupon[], Error>({
    queryKey: ['/coupons'],
    queryFn: () => fetchCoupons(),
  });

  const deleteCouponMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/coupons'] });
      toast({ title: "Sucesso!", description: "Cupom excluído com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: `Falha ao excluir cupom: ${error.message}`, variant: "destructive" });
    },
  });

  const handleDeleteCoupon = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cupom?")) {
      deleteCouponMutation.mutate(id);
    }
  };

  const openPushModal = (coupon: Coupon) => {
    setSelectedPushCoupon(coupon);
    setIsPushModalOpen(true);
  };

  const handlePushConfirm = () => {
    if (!selectedPushCoupon) return;
    setIsPushModalOpen(false);
    toast({
      title: "Campanha disparada",
      description: `O cupom ${selectedPushCoupon.code} será enviado para clientes inativos.`,
    });
    setSelectedPushCoupon(null);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsEditModalOpen(true);
  };

  const filteredCoupons = coupons?.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          coupon.target.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || coupon.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const activeCampaigns = filteredCoupons
    .filter(c => getCouponStatus(c) === CouponStatus.ACTIVE)
    .slice(0, 3);

  const calculateROI = (coupon: Coupon) => {
    const uses = coupon.usesCount;
    const perUseValue =
      coupon.type === CouponType.PERCENTAGE
        ? `${coupon.value}%`
        : `R$ ${coupon.value.toFixed(2)}`;
    return `${uses} usos • ${perUseValue}`;
  };

  const getCouponStatus = (coupon: Coupon): CouponStatus => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (coupon.usesCount >= (coupon.maxUses || Infinity) && coupon.maxUses !== 0) {
      return CouponStatus.USED_UP;
    }
    if (now < validFrom) {
      return CouponStatus.INACTIVE; // Not yet active
    }
    if (now > validUntil) {
      return CouponStatus.EXPIRED;
    }
    return CouponStatus.ACTIVE;
  };

  const getStatusBadgeClass = (status: CouponStatus) => {
    switch (status) {
      case CouponStatus.ACTIVE: return "bg-green-100 text-green-700";
      case CouponStatus.INACTIVE: return "bg-blue-100 text-blue-700";
      case CouponStatus.EXPIRED: return "bg-red-100 text-red-700";
      case CouponStatus.USED_UP: return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const activeCoupons = coupons?.filter(c => getCouponStatus(c) === CouponStatus.ACTIVE).length || 0;
  const expiredCoupons = coupons?.filter(c => getCouponStatus(c) === CouponStatus.EXPIRED).length || 0;
  const usedUpCoupons = coupons?.filter(c => getCouponStatus(c) === CouponStatus.USED_UP).length || 0;
  const totalUses = coupons?.reduce((sum, c) => sum + c.usesCount, 0) || 0;

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Gerenciamento de Cupons"
          subtitle="Crie, edite e monitore o desempenho dos cupons de desconto."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Cupons</p>
                      <p className="text-2xl font-bold text-gray-900">{coupons?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Tag className="text-blue-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Cupons Ativos</p>
                      <p className="text-2xl font-bold text-gray-900">{activeCoupons}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Cupons Expirados/Esgotados</p>
                      <p className="text-2xl font-bold text-gray-900">{expiredCoupons + usedUpCoupons}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <XCircle className="text-red-600" size={20} />
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
                      <p className="text-sm font-medium text-gray-600">Total de Usos</p>
                      <p className="text-2xl font-bold text-gray-900">{totalUses}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Calendar className="text-purple-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filters and Add Coupon Button */}
          <Card className="mb-6 shadow-floating border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Input
                      type="text"
                      placeholder="Buscar cupons por código ou alvo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={(value: CouponStatus | "all") => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value={CouponStatus.ACTIVE}>Ativo</SelectItem>
                      <SelectItem value={CouponStatus.INACTIVE}>Inativo (Futuro)</SelectItem>
                      <SelectItem value={CouponStatus.EXPIRED}>Expirado</SelectItem>
                      <SelectItem value={CouponStatus.USED_UP}>Esgotado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-medium-blue hover:bg-blue-700 text-white">
                  <Plus className="mr-2" size={16} />
                  Adicionar Cupom
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campanhas Ativas */}
          <Card className="mb-6 shadow-floating border-0">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Campanhas Ativas</CardTitle>
                <p className="text-sm text-gray-500">Promoções preparadas para reengajar clientes.</p>
              </div>
            </CardHeader>
            <CardContent>
              {activeCampaigns.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma campanha ativa no momento.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeCampaigns.map((campaign) => (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col justify-between h-full"
                    >
                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-gray-500">Campanha</p>
                        <h3 className="text-lg font-semibold text-gray-900 mt-1">{campaign.code}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {campaign.type === CouponType.PERCENTAGE
                            ? `${campaign.value}% de desconto`
                            : `R$ ${campaign.value.toFixed(2)} de desconto`}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 mt-4 space-y-1">
                        <p>Usos: {campaign.usesCount}</p>
                        <p>Alvo: {campaign.target.replace(/_/g, ' ')}</p>
                        <p>ROI: {calculateROI(campaign)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coupon List */}
          <Card className="shadow-floating border-0">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center p-4 bg-gray-50 rounded-xl animate-pulse">
                      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="w-24 h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="text-center py-12 text-red-600">
                  <p>Erro ao carregar cupons: {error?.message}</p>
                </div>
              ) : filteredCoupons.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cupom encontrado</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `Nenhum cupom corresponde a "${searchTerm}"` : "Nenhum cupom registrado ainda."}
                  </p>
                </div>
              ) : (
                <Table className="min-w-full">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cupom</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Alvo</TableCell>
                      <TableCell>ROI</TableCell>
                      <TableCell>Válido</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCoupons.map((coupon) => {
                      const status = getCouponStatus(coupon);
                      const statusClass = getStatusBadgeClass(status);
                      const isHistorical = status === CouponStatus.EXPIRED || status === CouponStatus.USED_UP;
                      return (
                        <TableRow
                          key={coupon.id}
                          className={`transition duration-150 ${
                            isHistorical ? "opacity-60 hover:opacity-70" : "hover:bg-gray-50"
                          }`}
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">{coupon.code}</span>
                              <span className="text-xs text-gray-500">
                                {coupon.type === CouponType.PERCENTAGE
                                  ? `${coupon.value}%`
                                  : `R$ ${coupon.value.toFixed(2)}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{coupon.type.replace(/_/g, ' ')}</TableCell>
                          <TableCell>
                            {coupon.target.replace(/_/g, ' ')}
                            {coupon.targetId ? ` (${coupon.targetId})` : ''}
                          </TableCell>
                          <TableCell>{calculateROI(coupon)}</TableCell>
                          <TableCell>
                            {new Date(coupon.validFrom).toLocaleDateString()} até {new Date(coupon.validUntil).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs px-2 py-1 border-0 ${statusClass}`}>
                              {status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="space-x-2 flex flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
                              onClick={() => handleEditCoupon(coupon)}
                            >
                              <Edit size={14} className="mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="border-gray-300 text-gray-700 hover:bg-gray-100"
                              onClick={() => openPushModal(coupon)}
                            >
                              Disparar para Clientes Inativos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              disabled={deleteCouponMutation.isPending}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <CouponFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <CouponFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCoupon(null);
        }}
        coupon={selectedCoupon || undefined}
      />

      <Dialog open={isPushModalOpen} onOpenChange={() => setIsPushModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disparar Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Deseja enviar este cupom via Push e E-mail para todos os clientes que não pedem limpeza há mais de 15 dias?
            </p>
            <div className="flex flex-col gap-2">
              <Button className="bg-medium-blue hover:bg-blue-700 text-white" onClick={handlePushConfirm}>
                Confirmar envio
              </Button>
              <Button variant="outline" onClick={() => setIsPushModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
