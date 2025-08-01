import { useState } from "react";
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

export default function Settings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
            <TabsList className="grid w-full grid-cols-5 bg-white shadow-floating border-0">
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
                        <Input id="commission-rate" defaultValue="15" type="number" min="0" max="100" />
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