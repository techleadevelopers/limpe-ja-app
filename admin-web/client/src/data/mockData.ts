import { randomUUID } from "crypto";

// Types for the mock data
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Provider {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  verificationStatus: "PENDING_DOCUMENTS_UPLOAD" | "PENDING_MANUAL_REVIEW" | "APPROVED" | "REJECTED" | "BLOCKED" | null;
  documentPhotoFrontUrl: string | null;
  documentPhotoBackUrl: string | null;
  selfieWithDocumentUrl: string | null;
  ocrResult: any;
  livenessResult: any;
  rejectionReason: string | null;
  fiveStarReviewCount: number;
  monthlyBookingsCount: number;
  totalEarnings: string;
  latitude: string | null;
  longitude: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  type: string;
  createdAt: Date;
  status: string | null;
  description: string;
  entityId: string | null;
  entityType: string | null;
}

export interface DashboardMetrics {
  activeUsers: number;
  approvedProviders: number;
  servicesBooked: number;
  totalRevenue: number;
  pendingVerifications: number;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  isActive: boolean | null;
  createdAt: Date;
}

export interface Booking {
  id: string;
  userId: string;
  providerId: string;
  serviceId: string;
  totalAmount: string;
  commissionAmount: string;
  scheduledDate: Date;
  completedAt: Date | null;
  status: string | null;
  createdAt: Date;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: "user1",
    username: "maria.silva",
    email: "maria.silva@email.com",
    name: "Maria Silva",
    createdAt: new Date("2023-01-15")
  },
  {
    id: "user2", 
    username: "joao.santos",
    email: "joao.santos@email.com",
    name: "João Santos",
    createdAt: new Date("2023-03-20")
  },
  {
    id: "user3",
    username: "ana.costa",
    email: "ana.costa@email.com", 
    name: "Ana Costa",
    createdAt: new Date("2023-06-10")
  }
];

// Mock Providers
export const mockProviders: Provider[] = [
  {
    id: "provider1",
    userId: "user1",
    name: "Ana Costa",
    email: "ana.costa@example.com",
    phone: "+55 11 99999-9999",
    verificationStatus: "PENDING_MANUAL_REVIEW",
    documentPhotoFrontUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
    documentPhotoBackUrl: "https://images.unsplash.com/photo-1554224154-26032fced8bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
    selfieWithDocumentUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
    ocrResult: {
      documentType: "RG",
      documentNumber: "12.345.678-9",
      fullName: "Ana Costa",
      birthDate: "1985-03-15",
      confidence: 0.95
    },
    livenessResult: {
      isLive: true,
      confidence: 0.98,
      timestamp: new Date()
    },
    rejectionReason: null,
    fiveStarReviewCount: 42,
    monthlyBookingsCount: 18,
    totalEarnings: "3250.00",
    latitude: "-23.5505",
    longitude: "-46.6333",
    createdAt: new Date("2023-08-15"),
    updatedAt: new Date("2023-08-20")
  },
  {
    id: "provider2",
    userId: "user2",
    name: "Carlos Lima",
    email: "carlos.lima@example.com",
    phone: "+55 11 88888-8888",
    verificationStatus: "PENDING_DOCUMENTS_UPLOAD",
    documentPhotoFrontUrl: null,
    documentPhotoBackUrl: null,
    selfieWithDocumentUrl: null,
    ocrResult: null,
    livenessResult: null,
    rejectionReason: null,
    fiveStarReviewCount: 15,
    monthlyBookingsCount: 32,
    totalEarnings: "4875.00",
    latitude: "-23.5629",
    longitude: "-46.6544",
    createdAt: new Date("2023-09-01"),
    updatedAt: new Date("2023-09-01")
  },
  {
    id: "provider3",
    userId: "user3",
    name: "Marina Oliveira",
    email: "marina.oliveira@example.com",
    phone: "+55 11 77777-7777",
    verificationStatus: "APPROVED",
    documentPhotoFrontUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
    documentPhotoBackUrl: "https://images.unsplash.com/photo-1554224154-22dec7ec8818?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
    selfieWithDocumentUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
    ocrResult: {
      documentType: "CNH",
      documentNumber: "98765432101",
      fullName: "Marina Oliveira",
      birthDate: "1990-07-22",
      confidence: 0.97
    },
    livenessResult: {
      isLive: true,
      confidence: 0.96,
      timestamp: new Date()
    },
    rejectionReason: null,
    fiveStarReviewCount: 67,
    monthlyBookingsCount: 45,
    totalEarnings: "6720.00",
    latitude: "-23.5475",
    longitude: "-46.6361",
    createdAt: new Date("2023-07-10"),
    updatedAt: new Date("2023-07-15")
  }
];

// Mock Activities
export const mockActivities: Activity[] = [
  {
    id: "activity1",
    type: "PROVIDER_REGISTERED",
    description: "New provider registered: Ana Costa",
    entityId: "provider1",
    entityType: "PROVIDER",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 2 * 60 * 1000)
  },
  {
    id: "activity2",
    type: "BOOKING_COMPLETED",
    description: "Service booking completed: House Cleaning",
    entityId: "booking1",
    entityType: "BOOKING",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: "activity3",
    type: "VERIFICATION_SUBMITTED",
    description: "Provider submitted documents for verification",
    entityId: "provider2",
    entityType: "PROVIDER",
    status: "PENDING",
    createdAt: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: "activity4",
    type: "PAYMENT_PROCESSED",
    description: "Payment processed: R$ 250.00 commission",
    entityId: "payment1",
    entityType: "PAYMENT",
    status: "PROCESSED",
    createdAt: new Date(Date.now() - 60 * 60 * 1000)
  },
  {
    id: "activity5",
    type: "PROVIDER_APPROVED",
    description: "Provider verification approved: Marina Oliveira",
    entityId: "provider3",
    entityType: "PROVIDER", 
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  }
];

// Mock Dashboard Metrics
export const mockDashboardMetrics: DashboardMetrics = {
  activeUsers: 1247,
  approvedProviders: 89,
  servicesBooked: 3456,
  totalRevenue: 285420,
  pendingVerifications: 12
};

// Mock Services
export const mockServices: Service[] = [
  {
    id: "service1",
    name: "Limpeza Residencial Básica",
    description: "Limpeza completa de casa incluindo quartos, banheiros, cozinha e sala",
    basePrice: "120.00",
    isActive: true,
    createdAt: new Date("2023-01-15")
  },
  {
    id: "service2",
    name: "Limpeza Pós-Obra",
    description: "Limpeza especializada após reformas e construções",
    basePrice: "250.00",
    isActive: true,
    createdAt: new Date("2023-02-20")
  },
  {
    id: "service3",
    name: "Limpeza de Escritório",
    description: "Limpeza profissional para ambientes corporativos",
    basePrice: "180.00",
    isActive: true,
    createdAt: new Date("2023-03-10")
  }
];

// Mock Bookings
export const mockBookings: Booking[] = [
  {
    id: "booking1",
    userId: "user1",
    providerId: "provider3",
    serviceId: "service1",
    totalAmount: "120.00",
    commissionAmount: "18.00",
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    completedAt: null,
    status: "SCHEDULED",
    createdAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: "booking2",
    userId: "user2",
    providerId: "provider3",
    serviceId: "service2",
    totalAmount: "250.00",
    commissionAmount: "37.50",
    scheduledDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 60 * 60 * 1000),
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  }
];

// Utility functions
export function getPendingProviders(): Provider[] {
  return mockProviders.filter(p => 
    p.verificationStatus === "PENDING_DOCUMENTS_UPLOAD" || 
    p.verificationStatus === "PENDING_MANUAL_REVIEW"
  );
}

export function getProvidersByStatus(status: string): Provider[] {
  return mockProviders.filter(p => p.verificationStatus === status);
}

export function updateProviderStatus(providerId: string, status: string, rejectionReason?: string): Provider | null {
  const providerIndex = mockProviders.findIndex(p => p.id === providerId);
  if (providerIndex === -1) return null;
  
  mockProviders[providerIndex] = {
    ...mockProviders[providerIndex],
    verificationStatus: status as any,
    rejectionReason: rejectionReason || null,
    updatedAt: new Date()
  };
  
  return mockProviders[providerIndex];
}