import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Bell, Shield, Globe, Database, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchSlaSettings, updateSlaSettings, fetchSlaHistory, SlaSettings, SlaAuditEvent, fetchGeneralSettings, updateGeneralSettings, fetchGeneralHistory, GeneralSettings, GeneralAuditEvent } from "@/lib/api";

export default function Settings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [slas, setSlas] = useState<SlaSettings | null>(null);
  const [general, setGeneral] = useState<GeneralSettings | null>(null);
  const [history, setHistory] = useState<SlaAuditEvent[]>([]);
  const [historyCursor, setHistoryCursor] = useState<number | null>(0);
  const [genHistory, setGenHistory] = useState<GeneralAuditEvent[]>([]);
  const [genCursor, setGenCursor] = useState<number | null>(0);

  const { data: slaData } = useQuery<SlaSettings>({
    queryKey: ['admin-settings-slas'],
    queryFn: fetchSlaSettings,
  });
  const { data: genData } = useQuery<GeneralSettings>({
    queryKey: ['admin-settings-general'],
    queryFn: fetchGeneralSettings,
  });

  useEffect(() => { if (slaData) setSlas(slaData); }, [slaData]);
  useEffect(() => { if (genData) setGeneral(genData); }, [genData]);

  const { data: historyPage } = useQuery<{ items: SlaAuditEvent[]; nextCursor: number | null}>({
    queryKey: ['admin-settings-slas-history', historyCursor],
    queryFn: () => fetchSlaHistory(20, historyCursor ?? 0),
    enabled: historyCursor !== null,
  });

  const { data: genPage } = useQuery<{ items: GeneralAuditEvent[]; nextCursor: number | null}>({
    queryKey: ['admin-settings-general-history', genCursor],
    queryFn: () => fetchGeneralHistory(10, genCursor ?? 0),
    enabled: genCursor !== null,
  });

  useEffect(() => { if (historyPage?.items) { setHistory(prev => [...prev, ...historyPage.items]); setHistoryCursor(historyPage.nextCursor); } }, [historyPage]);
  useEffect(() => { if (genPage?.items) { setGenHistory(prev => [...prev, ...genPage.items]); setGenCursor(genPage.nextCursor); } }, [genPage]);

  const saveSlas = useMutation({
    mutationFn: (payload: Partial<SlaSettings>) => updateSlaSettings(payload),
    onSuccess: (updated) => {
      setSlas(updated);
      toast({ title: 'SLAs atualizados', description: 'Configurações salvas com sucesso.' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao salvar SLAs', description: e?.message ?? 'Falha ao salvar.', variant: 'destructive' });
    },
  });

  const saveCommission = useMutation({
    mutationFn: (payload: Partial<GeneralSettings>) => updateGeneralSettings(payload),
    onSuccess: (updated) => { setGeneral(updated); toast({ title: 'Comissão salva', description: 'Configuração atualizada.' }); },
    onError: (e: any) => { toast({ title: 'Erro ao salvar', description: e?.message ?? 'Falha', variant: 'destructive' }); },
  });

  const handleSaveSettings = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Settings"
          subtitle="Manage platform configuration and preferences."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white shadow-floating border-0">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Globe size={16} />
                General
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell size={16} />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield size={16} />
                Security
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database size={16} />
                Database
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail size={16} />
                Email
              </TabsTrigger>
              <TabsTrigger value="slas" className="flex items-center gap-2">
                <Shield size={16} />
                SLAs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-floating border-0">
                  <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="platform-name">Platform Name</Label>
                        <Input id="platform-name" defaultValue="LimpeJá" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Admin Email</Label>
                        <Input id="admin-email" defaultValue="admin@limpeja.com" type="email" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="platform-description">Platform Description</Label>
                      <Textarea
                        id="platform-description"
                        defaultValue="Professional home cleaning services platform connecting customers with verified service providers."
                        className="h-24"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                        <Input id="commission-rate" type="number" min="0" max="100" value={general?.commissionRatePercent ?? ''} onChange={e => setGeneral(g => g ? ({...g, commissionRatePercent: Number(e.target.value)}) : g)} />
                        <div className="mt-2 flex justify-end">
                          <Button variant="outline" disabled={!general || (saveCommission as any).isPending} onClick={() => general && saveCommission.mutate({ commissionRatePercent: general.commissionRatePercent })}>Salvar Comissão</Button>
                        </div>
                        <div className="mt-3">
                          <h4 className="text-xs font-semibold text-gray-600 mb-2">Histórico de Comissão</h4>
                          <div className="border rounded">
                            <table className="min-w-full text-xs">
                              <thead className="bg-gray-50"><tr><th className="text-left px-3 py-1">Quando</th><th className="text-left px-3 py-1">Admin</th><th className="text-left px-3 py-1">Antes → Depois</th></tr></thead>
                              <tbody>
                                {genHistory.map(ev => (
                                  <tr key={ev.id} className="border-t">
                                    <td className="px-3 py-1">{new Date(ev.at).toLocaleString()}</td>
                                    <td className="px-3 py-1">{ev.actorUserId}</td>
                                    <td className="px-3 py-1">{ev.before.commissionRatePercent}% → {ev.after.commissionRatePercent}%</td>
                                  </tr>
                                ))}
                                {genHistory.length === 0 && (<tr><td className="px-3 py-2 text-gray-500" colSpan={3}>Sem alterações.</td></tr>)}
                              </tbody>
                            </table>
                          </div>
                          {genCursor !== null && (
                            <div className="mt-2 text-right">
                              <Button size="sm" variant="ghost" onClick={() => setGenCursor(genCursor ?? 0)}>Carregar mais</Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select defaultValue="BRL">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRL">Brazilian Real (R$)</SelectItem>
                            <SelectItem value="USD">US Dollar ($)</SelectItem>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Maintenance Mode</Label>
                        <p className="text-sm text-gray-600">Temporarily disable the platform for maintenance</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="slas"> 
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-floating border-0"> 
                  <CardHeader>
                    <CardTitle>Configuração de SLAs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Disputas (horas)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Urgente</Label>
                          <Input type="number" min="1" max="168" value={slas?.disputes.urgentHours ?? ''} onChange={e => setSlas(s => s ? ({...s, disputes: {...s.disputes, urgentHours: Number(e.target.value)}}) : s)} />
                        </div>
                        <div>
                          <Label>Alta</Label>
                          <Input type="number" min="1" max="168" value={slas?.disputes.highHours ?? ''} onChange={e => setSlas(s => s ? ({...s, disputes: {...s.disputes, highHours: Number(e.target.value)}}) : s)} />
                        </div>
                        <div>
                          <Label>Média</Label>
                          <Input type="number" min="1" max="168" value={slas?.disputes.mediumHours ?? ''} onChange={e => setSlas(s => s ? ({...s, disputes: {...s.disputes, mediumHours: Number(e.target.value)}}) : s)} />
                        </div>
                        <div>
                          <Label>Baixa</Label>
                          <Input type="number" min="1" max="168" value={slas?.disputes.lowHours ?? ''} onChange={e => setSlas(s => s ? ({...s, disputes: {...s.disputes, lowHours: Number(e.target.value)}}) : s)} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Suporte (horas por categoria)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Pagamento</Label>
                          <Input type="number" min="1" max="168" value={slas?.support.PAYMENT ?? ''} onChange={e => setSlas(s => s ? ({...s, support: {...s.support, PAYMENT: Number(e.target.value)}}) : s)} />
                        </div>
                        <div>
                          <Label>Qualidade</Label>
                          <Input type="number" min="1" max="168" value={slas?.support.QUALITY ?? ''} onChange={e => setSlas(s => s ? ({...s, support: {...s.support, QUALITY: Number(e.target.value)}}) : s)} />
                        </div>
                        <div>
                          <Label>App</Label>
                          <Input type="number" min="1" max="168" value={slas?.support.APP ?? ''} onChange={e => setSlas(s => s ? ({...s, support: {...s.support, APP: Number(e.target.value)}}) : s)} />
                        </div>
                        <div>
                          <Label>Outros</Label>
                          <Input type="number" min="1" max="168" value={slas?.support.OTHER ?? ''} onChange={e => setSlas(s => s ? ({...s, support: {...s.support, OTHER: Number(e.target.value)}}) : s)} />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button disabled={!slas || (saveSlas as any).isPending} onClick={() => slas && saveSlas.mutate(slas)}>
                        <Save className="mr-2 h-4 w-4" /> Salvar SLAs
                      </Button>
                    </div>

                    <div className="pt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Histórico de alterações</h3>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2">Quando</th>
                              <th className="text-left px-4 py-2">Admin</th>
                              <th className="text-left px-4 py-2">Mudanças</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.map(ev => (
                              <tr key={ev.id} className="border-t">
                                <td className="px-4 py-2">{new Date(ev.at).toLocaleString()}</td>
                                <td className="px-4 py-2">{ev.actorUserId}</td>
                                <td className="px-4 py-2 text-gray-700">
                                  <pre className="whitespace-pre-wrap break-words text-xs bg-gray-50 p-2 rounded">{JSON.stringify({ before: ev.before, after: ev.after }, null, 2)}</pre>
                                </td>
                              </tr>
                            ))}
                            {history.length === 0 && (
                              <tr><td className="px-4 py-6 text-gray-500" colSpan={3}>Nenhum histórico ainda.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {historyCursor !== null && (
                        <div className="mt-3 flex justify-center">
                          <Button variant="outline" onClick={() => setHistoryCursor(historyCursor ?? 0)}>Carregar mais</Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="notifications">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-floating border-0">
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>New Provider Registrations</Label>
                          <p className="text-sm text-gray-600">Receive notifications when new providers register</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Document Verification Required</Label>
                          <p className="text-sm text-gray-600">Get notified when manual verification is needed</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Payment Disputes</Label>
                          <p className="text-sm text-gray-600">Alerts for payment disputes and issues</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>System Alerts</Label>
                          <p className="text-sm text-gray-600">Critical system notifications and errors</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Weekly Reports</Label>
                          <p className="text-sm text-gray-600">Receive weekly platform performance reports</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="security">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-floating border-0">
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                        <Input id="session-timeout" defaultValue="30" type="number" min="5" max="480" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                        <Input id="max-login-attempts" defaultValue="5" type="number" min="3" max="10" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>IP Whitelist</Label>
                          <p className="text-sm text-gray-600">Restrict admin access to specific IP addresses</p>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Audit Logging</Label>
                          <p className="text-sm text-gray-600">Log all admin actions for security auditing</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allowed-ips">Allowed IP Addresses</Label>
                      <Textarea
                        id="allowed-ips"
                        placeholder="Enter IP addresses, one per line"
                        className="h-24"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="database">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-floating border-0">
                  <CardHeader>
                    <CardTitle>Database Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="backup-frequency">Backup Frequency</Label>
                        <Select defaultValue="daily">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="retention-period">Retention Period (days)</Label>
                        <Input id="retention-period" defaultValue="30" type="number" min="7" max="365" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Automatic Backups</Label>
                          <p className="text-sm text-gray-600">Enable scheduled database backups</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Data Encryption</Label>
                          <p className="text-sm text-gray-600">Encrypt sensitive data at rest</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <Button variant="outline" className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white">
                        Test Connection
                      </Button>
                      <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                        Create Backup
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="email">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-floating border-0">
                  <CardHeader>
                    <CardTitle>Email Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host">SMTP Host</Label>
                        <Input id="smtp-host" placeholder="smtp.gmail.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input id="smtp-port" defaultValue="587" type="number" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-username">SMTP Username</Label>
                        <Input id="smtp-username" placeholder="your-email@gmail.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-password">SMTP Password</Label>
                        <Input id="smtp-password" type="password" placeholder="••••••••" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="from-email">From Email Address</Label>
                      <Input id="from-email" defaultValue="noreply@limpeja.com" type="email" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>TLS/SSL Encryption</Label>
                        <p className="text-sm text-gray-600">Enable secure email transmission</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <Button variant="outline" className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white">
                      Send Test Email
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="fixed bottom-8 right-8">
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="bg-medium-blue hover:bg-blue-700 text-white shadow-floating-lg px-8 py-3"
            >
              <Save className="mr-2" size={16} />
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
