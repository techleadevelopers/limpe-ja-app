import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, Filter, Users, Star, Calendar, Layers, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
// Removendo mockProviders
// import { mockProviders, type Provider } from "@/data/mockData";
import { useQuery } from "@tanstack/react-query";
import { fetchProviders } from "@/lib/api";
import { Provider, VerificationStatus } from "@/lib/types"; // Importa Provider e VerificationStatus dos tipos reais


function getStatusColor(status: string) {
  switch (status) {
    case VerificationStatus.APPROVED:
      return "bg-green-500";
    case VerificationStatus.PENDING_MANUAL_REVIEW:
      return "bg-orange-500";
    case VerificationStatus.PENDING_DOCUMENTS_UPLOAD:
      return "bg-yellow-500";
    case VerificationStatus.REJECTED:
      return "bg-red-500";
    case VerificationStatus.BLOCKED:
      return "bg-gray-500";
    default:
      return "bg-blue-500";
  }
}

export default function ProviderMap() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // Busca os provedores usando react-query
  const { data: providers, isLoading, isError, error } = useQuery<Provider[], Error>({
    queryKey: ['/providers'],
    queryFn: () => fetchProviders(),
  });

  const filteredProviders = providers?.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || provider.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus && provider.latitude && provider.longitude;
  }) || [];

  const approvedProviders = filteredProviders.filter(p => p.verificationStatus === VerificationStatus.APPROVED);
  const pendingProviders = filteredProviders.filter(p => 
    p.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW || p.verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD
  );

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Mapa de Provedores"
          subtitle="Distribuição geográfica de provedores de serviço na plataforma."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Stats Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-red-600">
              <p>Erro ao carregar estatísticas do mapa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <MapPin className="text-blue-600" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total de Provedores</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredProviders.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Users className="text-green-600" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Aprovados</p>
                      <p className="text-2xl font-bold text-gray-900">{approvedProviders.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Calendar className="text-orange-600" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pendentes</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingProviders.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Layers className="text-purple-600" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Áreas de Cobertura</p>
                      <p className="text-2xl font-bold text-gray-900">12</p> {/* Este é um mock */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <Card className="shadow-floating border-0 h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="text-medium-blue" size={20} />
                      Localizações dos Provedores
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <ZoomIn size={16} />
                      </Button>
                      <Button variant="outline" size="sm">
                        <ZoomOut size={16} />
                      </Button>
                      <Button variant="outline" size="sm">
                        <RotateCcw size={16} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-96 flex items-center justify-center">
                      <p className="text-gray-500">Carregando mapa...</p>
                    </div>
                  ) : isError ? (
                    <div className="h-96 flex items-center justify-center text-red-600">
                      <p>Erro ao carregar mapa: {error?.message}</p>
                    </div>
                  ) : (
                    <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl border border-blue-200 relative overflow-hidden">
                      {/* Map Background */}
                      <div className="absolute inset-0 opacity-20">
                        <svg width="100%" height="100%" viewBox="0 0 400 300">
                          {/* Simple map outline */}
                          <path
                            d="M50,50 L350,50 L350,250 L50,250 Z M100,100 Q150,80 200,100 T300,120 L320,180 Q280,200 240,190 T160,200 L140,160 Q120,140 100,100"
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      
                      {/* Provider Markers */}
                      {filteredProviders.map((provider, index) => {
                        // Calculate position based on lat/lng (simplified for demo)
                        // Em um mapa real, você usaria uma biblioteca de mapas e coordenadas geográficas
                        const x = 10 + (parseFloat(provider.longitude || '0') + 180) / 360 * 80 + (index * 5) % 10;
                        const y = 10 + (90 - parseFloat(provider.latitude || '0')) / 180 * 80 + (index * 3) % 10;
                        
                        return (
                          <motion.div
                            key={provider.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="absolute cursor-pointer"
                            style={{ left: `${x}%`, top: `${y}%` }}
                            onClick={() => setSelectedProvider(provider)}
                          >
                            <div className={`w-4 h-4 rounded-full ${getStatusColor(provider.verificationStatus || "")} border-2 border-white shadow-lg`} />
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                              {provider.name}
                            </div>
                          </motion.div>
                        );
                      })}
                      
                      {/* Legend */}
                      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Legenda de Status</h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-xs text-gray-600">Aprovado</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-xs text-gray-600">Em Revisão</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-xs text-gray-600">Pendente</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Filters and Provider List */}
            <div className="space-y-6">
              {/* Filters */}
              <Card className="shadow-floating border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Buscar</label>
                    <div className="relative">
                      <Input
                        placeholder="Buscar provedores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value={VerificationStatus.APPROVED}>Aprovado</SelectItem>
                        <SelectItem value={VerificationStatus.PENDING_MANUAL_REVIEW}>Revisão Pendente</SelectItem>
                        <SelectItem value={VerificationStatus.PENDING_DOCUMENTS_UPLOAD}>Documentos Pendentes</SelectItem>
                        <SelectItem value={VerificationStatus.REJECTED}>Rejeitado</SelectItem>
                        <SelectItem value={VerificationStatus.BLOCKED}>Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Provider Info */}
              {selectedProvider && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="shadow-floating border-0">
                    <CardHeader>
                      <CardTitle className="text-lg">Detalhes do Provedor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={`https://images.unsplash.com/photo-150720939${Math.floor(Math.random() * 10)}?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100`}
                            alt={selectedProvider.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{selectedProvider.name}</h4>
                            <p className="text-sm text-gray-600">{selectedProvider.email}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Status:</span>
                            <Badge className={`text-xs px-2 py-1 border-0 ${
                              selectedProvider.verificationStatus === VerificationStatus.APPROVED 
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}>
                              {(selectedProvider.verificationStatus || "").replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              Avaliações:
                            </span>
                            <span className="font-medium">{selectedProvider.fiveStarReviewCount}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Agendamentos Mensais:</span>
                            <span className="font-medium">{selectedProvider.monthlyBookingsCount}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Ganhos:</span>
                            <span className="font-medium text-green-600">
                              R$ {parseFloat(selectedProvider.totalEarnings || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-medium-blue hover:bg-blue-700 text-white"
                          onClick={() => setSelectedProvider(null)}
                        >
                          Fechar Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}