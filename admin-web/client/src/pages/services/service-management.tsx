import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createService, deleteService, fetchServices, updateService } from "@/lib/api";
import type { Service } from "@/lib/types";

type FormState = {
  name: string;
  description?: string;
  icon?: string;
};

export default function ServiceManagement() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: services = [], isLoading, isError } = useQuery<Service[], Error>({
    queryKey: ["/services"],
    queryFn: fetchServices,
  });

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const createMut = useMutation({
    mutationFn: (payload: Omit<Service, "id" | "createdAt" | "updatedAt">) => createService(payload as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/services"] });
      setIsAddOpen(false);
      toast({ title: "Serviço criado", description: "O serviço foi adicionado." });
    },
    onError: (e: any) => toast({ title: "Erro ao criar serviço", description: e?.message || "Tente novamente.", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) => updateService(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/services"] });
      setIsEditOpen(false);
      toast({ title: "Serviço atualizado", description: "As alterações foram salvas." });
    },
    onError: (e: any) => toast({ title: "Erro ao atualizar", description: e?.message || "Tente novamente.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/services"] });
      toast({ title: "Serviço excluído", description: "O serviço foi removido." });
    },
    onError: (e: any) => toast({ title: "Erro ao excluir", description: e?.message || "Tente novamente.", variant: "destructive" }),
  });

  const [createForm, setCreateForm] = useState<FormState>({ name: "", description: "", icon: "" });
  const [editForm, setEditForm] = useState<FormState>({ name: "", description: "", icon: "" });

  const openEdit = (srv: Service) => {
    setSelectedService(srv);
    setEditForm({ name: srv.name, description: srv.description ?? "", icon: srv.icon ?? "" });
    setIsEditOpen(true);
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      <div className="flex-1 ml-72 overflow-hidden">
        <Header title="Service Management" subtitle="Gerencie serviços globais (sem preço)." />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Package className="text-blue-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Serviços</p>
                    <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="services" className="space-y-6">
            <TabsList className="w-full bg-white shadow-floating border-0">
              <TabsTrigger value="services" className="flex items-center gap-2">Serviços</TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Catálogo de Serviços</h2>
                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-medium-blue hover:bg-blue-700 text-white">
                        <Plus className="mr-2" size={16} />
                        Novo Serviço
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Adicionar Serviço</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" value={createForm.name} onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="icon">Ícone (opcional)</Label>
                            <Input id="icon" value={createForm.icon} onChange={(e) => setCreateForm(f => ({ ...f, icon: e.target.value }))} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea id="description" value={createForm.description} onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={() => createMut.mutate({ name: createForm.name, icon: createForm.icon, description: createForm.description })} disabled={createMut.isPending || !createForm.name} className="bg-medium-blue text-white">
                            {createMut.isPending ? "Salvando..." : "Salvar"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <Card key={i} className="h-40 bg-gray-100 animate-pulse border-0" />
                    ))
                  ) : isError ? (
                    <div className="text-red-600">Erro ao carregar serviços.</div>
                  ) : services.length === 0 ? (
                    <div className="text-gray-600">Nenhum serviço cadastrado ainda.</div>
                  ) : (
                    services.map((service) => (
                      <motion.div key={service.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        <Card className="shadow-floating border-0">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span className="truncate">{service.name}</span>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEdit(service)}>
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                  onClick={() => deleteMut.mutate(service.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {service.description && <p className="text-sm text-gray-700">{service.description}</p>}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Serviço</DialogTitle>
              </DialogHeader>
              {selectedService && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nome</Label>
                      <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-icon">Ícone (opcional)</Label>
                      <Input id="edit-icon" value={editForm.icon} onChange={(e) => setEditForm(f => ({ ...f, icon: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea id="edit-description" value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} className="h-24" />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                    <Button
                      className="bg-medium-blue text-white"
                      onClick={() => selectedService && updateMut.mutate({ id: selectedService.id, data: { name: editForm.name, icon: editForm.icon, description: editForm.description } })}
                      disabled={updateMut.isPending}
                    >
                      {updateMut.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

