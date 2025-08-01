import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Search, Filter, MoreHorizontal, Calendar, Mail, Phone, MapPin, Shield, Ban, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import type { User } from "@shared/schema";

// Sample customer data
interface Customer extends User {
  completedBookingsCount: number;
  totalSpent: number;
  memberSince: Date;
  status: "active" | "inactive" | "blocked";
  lastActivity: Date;
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
}

const sampleCustomers: Customer[] = [
  {
    id: "1",
    username: "maria.silva",
    email: "maria.silva@email.com",
    name: "Maria Silva",
    password: "",
    createdAt: new Date("2023-01-15"),
    completedBookingsCount: 23,
    totalSpent: 2450.00,
    memberSince: new Date("2023-01-15"),
    status: "active",
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    loyaltyTier: "gold"
  },
  {
    id: "2",
    username: "joao.santos",
    email: "joao.santos@email.com",
    name: "João Santos",
    password: "",
    createdAt: new Date("2023-03-20"),
    completedBookingsCount: 8,
    totalSpent: 680.00,
    memberSince: new Date("2023-03-20"),
    status: "active",
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    loyaltyTier: "silver"
  },
  {
    id: "3",
    username: "ana.costa",
    email: "ana.costa@email.com",
    name: "Ana Costa",
    password: "",
    createdAt: new Date("2023-06-10"),
    completedBookingsCount: 45,
    totalSpent: 4250.00,
    memberSince: new Date("2023-06-10"),
    status: "active",
    lastActivity: new Date(Date.now() - 30 * 60 * 1000),
    loyaltyTier: "platinum"
  },
  {
    id: "4",
    username: "carlos.lima",
    email: "carlos.lima@email.com",
    name: "Carlos Lima",
    password: "",
    createdAt: new Date("2023-08-05"),
    completedBookingsCount: 2,
    totalSpent: 180.00,
    memberSince: new Date("2023-08-05"),
    status: "inactive",
    lastActivity: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    loyaltyTier: "bronze"
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

function getLoyaltyBadge(tier: string) {
  switch (tier) {
    case "platinum":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "gold":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "silver":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-orange-100 text-orange-700 border-orange-200";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "inactive":
      return "bg-yellow-100 text-yellow-700";
    case "blocked":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customers] = useState(sampleCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === "active").length,
    inactive: customers.filter(c => c.status === "inactive").length,
    blocked: customers.filter(c => c.status === "blocked").length
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="User Management"
          subtitle="Manage customer accounts, profiles, and loyalty programs."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Shield className="text-green-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Calendar className="text-yellow-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Inactive</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-floating border-0">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Ban className="text-red-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Blocked</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.blocked}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6 shadow-floating border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Input
                      type="text"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-medium-blue hover:bg-blue-700 text-white">
                      <UserPlus className="mr-2" size={16} />
                      Add Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="Enter full name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="Enter email address" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" placeholder="Enter phone number" />
                      </div>
                      <Button className="w-full bg-medium-blue hover:bg-blue-700 text-white">
                        Create Customer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
          <Card className="shadow-floating border-0">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {filteredCustomers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={`https://images.unsplash.com/photo-150720939${index % 10}?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100`}
                          alt={customer.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                            <Badge className={`text-xs px-2 py-1 border-0 ${getStatusBadge(customer.status)}`}>
                              {customer.status}
                            </Badge>
                            <Badge className={`text-xs px-2 py-1 border ${getLoyaltyBadge(customer.loyaltyTier)}`}>
                              {customer.loyaltyTier}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail size={14} />
                              {customer.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {customer.completedBookingsCount} bookings
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span>Total Spent: R$ {customer.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span>Last active: {formatRelativeTime(customer.lastActivity)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-medium-blue text-medium-blue hover:bg-medium-blue hover:text-white"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Customer Details</DialogTitle>
                            </DialogHeader>
                            {selectedCustomer && (
                              <div className="space-y-6">
                                <div className="flex items-center space-x-4">
                                  <img 
                                    src={`https://images.unsplash.com/photo-150720939${index % 10}?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100`}
                                    alt={selectedCustomer.name}
                                    className="w-20 h-20 rounded-full object-cover"
                                  />
                                  <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h3>
                                    <p className="text-gray-600">{selectedCustomer.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge className={`text-xs px-2 py-1 border-0 ${getStatusBadge(selectedCustomer.status)}`}>
                                        {selectedCustomer.status}
                                      </Badge>
                                      <Badge className={`text-xs px-2 py-1 border ${getLoyaltyBadge(selectedCustomer.loyaltyTier)}`}>
                                        {selectedCustomer.loyaltyTier} member
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Account Statistics</p>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Total Bookings:</span>
                                        <span className="font-medium">{selectedCustomer.completedBookingsCount}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Total Spent:</span>
                                        <span className="font-medium text-green-600">
                                          R$ {selectedCustomer.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Member Since:</span>
                                        <span className="font-medium">{selectedCustomer.memberSince.toLocaleDateString('pt-BR')}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Activity</p>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Last Activity:</span>
                                        <span className="font-medium">{formatRelativeTime(selectedCustomer.lastActivity)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Loyalty Tier:</span>
                                        <span className="font-medium capitalize">{selectedCustomer.loyaltyTier}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-end space-x-3">
                                  <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                                    Block User
                                  </Button>
                                  <Button className="bg-medium-blue hover:bg-blue-700 text-white">
                                    Edit Profile
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal size={16} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {filteredCustomers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `No customers match "${searchTerm}"` : "No customers registered yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}