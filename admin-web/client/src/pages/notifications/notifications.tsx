import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { motion } from "framer-motion";

interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: "system" | "verification" | "payment" | "user";
}

const sampleNotifications: Notification[] = [
  {
    id: "1",
    type: "warning",
    title: "New Provider Verification Required",
    message: "Ana Costa has submitted documents for manual review. Action required within 24 hours.",
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    read: false,
    category: "verification"
  },
  {
    id: "2",
    type: "info",
    title: "System Maintenance Scheduled",
    message: "Scheduled maintenance window: Sunday 2:00 AM - 4:00 AM UTC. Platform will be temporarily unavailable.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    category: "system"
  },
  {
    id: "3",
    type: "success",
    title: "Payment Processed Successfully",
    message: "Monthly commission payment of R$ 15,847.50 has been processed to providers.",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true,
    category: "payment"
  },
  {
    id: "4",
    type: "error",
    title: "Failed Login Attempts Detected",
    message: "Multiple failed login attempts detected from IP 192.168.1.100. Account temporarily locked.",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    read: false,
    category: "system"
  },
  {
    id: "5",
    type: "info",
    title: "New User Registration",
    message: "João Silva has registered as a new customer. Total active users: 1,247.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    read: true,
    category: "user"
  }
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

function getNotificationIcon(type: string) {
  switch (type) {
    case "success":
      return CheckCircle;
    case "warning":
      return AlertTriangle;
    case "error":
      return AlertTriangle;
    default:
      return Info;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case "success":
      return "text-green-600 bg-green-100";
    case "warning":
      return "text-yellow-600 bg-yellow-100";
    case "error":
      return "text-red-600 bg-red-100";
    default:
      return "text-blue-600 bg-blue-100";
  }
}

function getBadgeColor(category: string) {
  switch (category) {
    case "verification":
      return "bg-orange-100 text-orange-700";
    case "payment":
      return "bg-green-100 text-green-700";
    case "system":
      return "bg-red-100 text-red-700";
    case "user":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [activeTab, setActiveTab] = useState("all");

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "unread") return !notification.read;
    if (activeTab === "all") return true;
    return notification.category === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Notifications"
          subtitle={`You have ${unreadCount} unread notifications.`}
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Bell className="text-medium-blue" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">All Notifications</h2>
              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-600 border-0">
                  {unreadCount} New
                </Badge>
              )}
            </div>
            
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
              >
                <CheckCircle className="mr-2" size={16} />
                Mark All as Read
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white shadow-floating border-0">
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="user">User</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <Card className="shadow-floating border-0">
                <CardContent className="pt-6">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                      <p className="text-gray-500">
                        {activeTab === "unread" 
                          ? "All notifications have been read" 
                          : "You're all caught up!"
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredNotifications.map((notification, index) => {
                        const Icon = getNotificationIcon(notification.type);
                        const iconColor = getNotificationColor(notification.type);
                        const badgeColor = getBadgeColor(notification.category);
                        
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                              notification.read 
                                ? "bg-white border-gray-200" 
                                : "bg-blue-50 border-blue-200 shadow-sm"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
                                  <Icon size={16} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-medium ${notification.read ? "text-gray-900" : "text-gray-900 font-semibold"}`}>
                                      {notification.title}
                                    </h4>
                                    <Badge className={`text-xs px-2 py-1 border-0 ${badgeColor}`}>
                                      {notification.category}
                                    </Badge>
                                  </div>
                                  
                                  <p className={`text-sm mb-2 ${notification.read ? "text-gray-600" : "text-gray-700"}`}>
                                    {notification.message}
                                  </p>
                                  
                                  <p className="text-xs text-gray-500">
                                    {formatRelativeTime(notification.timestamp)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                {!notification.read && (
                                  <Button
                                    onClick={() => markAsRead(notification.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-medium-blue hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <CheckCircle size={14} />
                                  </Button>
                                )}
                                
                                <Button
                                  onClick={() => deleteNotification(notification.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <X size={14} />
                                </Button>
                              </div>
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
    </div>
  );
}